import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';
import { MonoService } from 'src/mono/mono.service';

@Injectable()
export class MonoWebhookService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly outboundWebhookService: OutboundWebhookService,
    private readonly monoService: MonoService,
    @InjectQueue('enrichments') private readonly enrichmentsQueue: Queue,
  ) {
    this.logger.setContext(MonoWebhookService.name);
  }

  // ─── Account linked / updated ──────────────────────────────────────────────
  //
  // Called for both mono.events.account_connected and mono.events.account_updated.
  // Saves (or refreshes) the BankAccount record, then kicks off enrichment.
  // Enrichment is triggered in the background — we don't wait for it here so
  // Mono gets our 200 response quickly.

  async handleAccountLinked(data: any) {
    this.logger.info({ payload: data }, 'Full payload received');

    const accountData = data.account;
    const monoAccountId = accountData?._id;
    const applicantId = data.meta?.user_id;
    const applicationId = data.meta?.application_id;

    if (!monoAccountId) {
      this.logger.error({ payload: data }, 'Missing account ID in webhook');
      return { status: 'error', reason: 'missing_account_id' };
    }

    if (!applicantId) {
      this.logger.info({ monoAccountId }, 'Account connected, waiting for full data');
      return { status: 'acknowledged', message: 'Waiting for account_updated event' };
    }

    try {
      const existingAccount = await this.prisma.bankAccount.findUnique({
        where: { monoAccountId },
        include: { applicant: { include: { fintech: true } } },
      });

      if (existingAccount) {
        // ── Duplicate webhook guard ───────────────────────────────────────────
        // Mono can deliver the same event more than once (retry on timeout/error).
        // If enrichmentStatus is PENDING and the account was updated in the last
        // 60 seconds, this is almost certainly a duplicate delivery — not a genuine
        // re-link. Skip the reset so we don't wipe an in-flight enrichment pipeline.
        const secondsSinceUpdate =
          (Date.now() - existingAccount.updatedAt.getTime()) / 1000;

        if (existingAccount.enrichmentStatus === 'PENDING' && secondsSinceUpdate < 60) {
          this.logger.warn(
            { monoAccountId, secondsSinceUpdate },
            'Duplicate account_connected webhook detected — skipping reset',
          );
          return { status: 'success', accountId: existingAccount.id, linked: false, duplicate: true };
        }

        // existingAccount already has applicant.fintech from the findUnique above.
        // We don't need to re-include relations on the update — use existingAccount
        // for fintechId / monoApiKey since those never change between the two calls.
        const updated = await this.prisma.bankAccount.update({
          where: { monoAccountId },
          data: {
            updatedAt: new Date(),
            accountName: accountData?.name,
            accountNumber: accountData?.accountNumber,
            balance: accountData?.balance,
            institution: accountData?.institution?.name,
            // Reset all stored data so fresh data is fetched when account is re-linked.
            // Prisma requires Prisma.DbNull (not JS null) to null-out a Json? field.
            enrichmentStatus: 'PENDING',
            accountDetailsData:   Prisma.DbNull,
            balanceData:          Prisma.DbNull,
            transactionsData:     Prisma.DbNull,
            identityData:         Prisma.DbNull,
            incomeData:           Prisma.DbNull,
            statementInsightsData: Prisma.DbNull,
            creditWorthinessData: Prisma.DbNull,
            insightsJobId: null,
          },
        });

        this.logger.info({ monoAccountId, applicantId }, 'Bank account refreshed');

        // Kick off enrichment + pre-fetch in the background
        if (existingAccount.applicant.fintech.monoApiKey) {
          this._triggerEnrichments(
            updated.id,
            monoAccountId,
            existingAccount.applicant.fintech.monoApiKey,
            applicationId ?? undefined,
          ).catch((err) =>
            this.logger.error({ err, monoAccountId }, 'Enrichment trigger failed after re-link'),
          );
        }

        if (applicationId) {
          await this.prisma.application.update({
            where: { id: applicationId },
            data: { status: 'LINKED' },
          });

          await this.outboundWebhookService.dispatch(
            existingAccount.applicant.fintechId,
            'account.linked',
            {
              applicationId,
              applicantId,
              accountId: updated.id,
              institution: updated.institution,
              accountNumber: updated.accountNumber,
            },
          );
        }

        return { status: 'success', accountId: updated.id, linked: false };
      }

      // ── New account ───────────────────────────────────────────────────────
      const bankAccount = await this.prisma.bankAccount.create({
        data: {
          monoAccountId,
          applicantId,
          accountName: accountData?.name,
          accountNumber: accountData?.accountNumber,
          balance: accountData?.balance,
          institution: accountData?.institution?.name,
        },
        include: { applicant: { include: { fintech: true } } },
      });

      this.logger.info({ monoAccountId, applicantId }, 'New bank account linked');

      // Kick off enrichment + pre-fetch in the background
      if (bankAccount.applicant.fintech.monoApiKey) {
        this._triggerEnrichments(
          bankAccount.id,
          monoAccountId,
          bankAccount.applicant.fintech.monoApiKey,
          applicationId ?? undefined,
        ).catch((err) =>
          this.logger.error({ err, monoAccountId }, 'Enrichment trigger failed after new link'),
        );
      }

      if (applicationId) {
        await this.prisma.application.update({
          where: { id: applicationId },
          data: { status: 'LINKED' },
        });

        await this.outboundWebhookService.dispatch(
          bankAccount.applicant.fintechId,
          'account.linked',
          {
            applicationId,
            applicantId,
            accountId: bankAccount.id,
            institution: bankAccount.institution,
            accountNumber: bankAccount.accountNumber,
          },
        );
      }

      return { status: 'success', accountId: bankAccount.id, linked: true };
    } catch (error) {
      this.logger.error(
        { err: error, monoAccountId, applicantId },
        `Failed to link bank account: ${error.message}`,
      );
      return { status: 'error', reason: 'database_failure' };
    }
  }

  // ─── Income webhook ────────────────────────────────────────────────────────
  //
  // Mono sends mono.events.account_income after we call GET /accounts/{id}/income.
  // The payload contains the full income analysis results we need for scoring.
  // We store it and then check whether the other enrichment (insights) is also ready.

  async handleAccountIncome(data: any) {
    this.logger.info({ accountId: data.account?._id }, 'Income webhook received');

    const monoAccountId = data.account?._id;

    // The income payload lives at data.income (from the webhook body)
    const incomeData = data.income ?? data;

    if (!monoAccountId) {
      this.logger.warn({ payload: data }, 'Income webhook missing account ID');
      return;
    }

    try {
      await this.prisma.bankAccount.update({
        where: { monoAccountId },
        data: { incomeData },
      });

      this.logger.info({ monoAccountId }, 'Income data stored');

      // Now check if we have both enrichments and can fire account.enrichment_ready
      await this._checkAndFireEnrichmentReady(monoAccountId);
    } catch (error) {
      this.logger.error(
        { err: error, monoAccountId },
        'Failed to store income data from webhook',
      );
    }
  }

  // ─── Creditworthiness webhook ──────────────────────────────────────────────
  //
  // Triggered at application-creation time with loan terms (amount, tenor, rate).
  // Result arrives here as a webhook. We store it on BankAccount so the processor
  // can read it from DB at analyze time — no live Mono call needed.
  // Does NOT affect enrichmentStatus (that gate is income + insights only).

  async handleAccountCreditWorthiness(data: any) {
    const monoAccountId = data.account?._id;
    const creditWorthinessData = data.creditworthiness ?? data;

    this.logger.info({ monoAccountId }, 'Creditworthiness webhook received');

    if (!monoAccountId) {
      this.logger.warn({ payload: data }, 'Creditworthiness webhook missing account ID');
      return;
    }

    try {
      await this.prisma.bankAccount.update({
        where: { monoAccountId },
        data: { creditWorthinessData },
      });
      this.logger.info({ monoAccountId }, 'Creditworthiness data stored');
    } catch (error) {
      this.logger.error(
        { err: error, monoAccountId },
        'Failed to store creditworthiness data from webhook',
      );
    }
  }

  // ─── Reauthorisation webhook ───────────────────────────────────────────────

  async handleAccountReauthorised(data: any) {
    const monoAccountId = data.account?._id;
    await this.prisma.bankAccount.update({
      where: { monoAccountId },
      data: { updatedAt: new Date() },
    });
    this.logger.info({ monoAccountId }, 'Bank account reauthorised');
    return { status: 'success' };
  }

  // ─── Private: pre-fetch + trigger all enrichments after account link ─────────
  //
  // Called in the background (fire-and-forget from handleAccountLinked).
  //
  // Sync fetches (run in parallel, stored immediately):
  //   - accountDetails, balance, transactions, identity
  //
  // Async enrichments (results arrive later via webhook / poller):
  //   1. GET /income  — triggers Mono income analysis; result arrives via
  //      mono.events.account_income webhook → stored in incomeData.
  //   2. POST /statement/insights — triggers Mono insights job; result polled
  //      via BullMQ every 30s → stored in statementInsightsData.
  //   3. POST /creditworthiness — triggers credit check using loan terms from the
  //      application; result arrives via mono.events.account_credit_worthiness
  //      webhook → stored in creditWorthinessData. Only triggered when applicationId
  //      is provided (i.e. when initiated via POST /applications/initiate).

  private async _triggerEnrichments(
    bankAccountId: string,
    monoAccountId: string,
    monoApiKey: string,
    applicationId?: string,
  ): Promise<void> {
    this.logger.info({ monoAccountId, applicationId }, 'Triggering enrichments and pre-fetch');

    // ── Run all sync fetches + async triggers in parallel ───────────────────
    const [accountDetails, balance, transactions, identity] = await Promise.allSettled([
      this.monoService.getAccountDetails(monoAccountId, monoApiKey),
      this.monoService.getAccountBalance(monoAccountId, monoApiKey),
      this.monoService.getTransactions(monoAccountId, monoApiKey),
      this.monoService.getIdentity(monoAccountId, monoApiKey),
    ]);

    // Log any sync fetch failures — non-fatal, will be null at analyze time
    (
      [
        ['accountDetails', accountDetails],
        ['balance',        balance],
        ['transactions',   transactions],
        ['identity',       identity],
      ] as [string, PromiseSettledResult<any>][]
    ).forEach(([name, result]) => {
      if (result.status === 'rejected') {
        this.logger.warn({ err: result.reason, monoAccountId, endpoint: name }, `Pre-fetch failed for ${name}`);
      }
    });

    // Store all sync data in one DB write
    await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        accountDetailsData: accountDetails.status === 'fulfilled' ? accountDetails.value : Prisma.DbNull,
        balanceData:        balance.status      === 'fulfilled'   ? balance.value        : Prisma.DbNull,
        transactionsData:   transactions.status === 'fulfilled'   ? transactions.value   : Prisma.DbNull,
        identityData:       identity.status     === 'fulfilled'   ? identity.value       : Prisma.DbNull,
      },
    });

    this.logger.info({ monoAccountId }, 'Sync pre-fetch complete');

    // ── Trigger income analysis (async — result comes back as webhook) ───────
    try {
      await this.monoService.getIncome(monoAccountId, monoApiKey);
      this.logger.info({ monoAccountId }, 'Income analysis triggered');
    } catch (err) {
      this.logger.warn({ err, monoAccountId }, 'Income trigger failed — will rely on webhook');
    }

    // ── Trigger statement insights job (async — result polled by BullMQ) ────
    try {
      const jobId = await this.monoService.triggerStatementInsightsJob(
        monoAccountId,
        monoApiKey,
      );

      await this.prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: { insightsJobId: jobId },
      });

      // Schedule the first poll after 30 seconds.
      // The poller will keep re-scheduling itself until the job completes or times out.
      await this.enrichmentsQueue.add(
        'poll-insights',
        { bankAccountId, monoAccountId, jobId, monoApiKey, pollAttempt: 0 },
        { delay: 30_000 },
      );

      this.logger.info({ monoAccountId, jobId }, 'Statement insights job started, poll scheduled');
    } catch (err) {
      this.logger.error({ err, monoAccountId }, 'Failed to trigger statement insights job');
    }

    // ── Trigger creditworthiness (async — result comes back as webhook) ──────
    // Only possible when we have an applicationId to look up the loan terms.
    if (applicationId) {
      try {
        const application = await this.prisma.application.findUnique({
          where: { id: applicationId },
          select: { amount: true, tenor: true, interestRate: true },
        });

        if (application) {
          await this.monoService.getCreditWorthiness(monoAccountId, monoApiKey, {
            amount:        application.amount,
            tenor_months:  application.tenor,
            interest_rate: application.interestRate,
          });
          this.logger.info({ monoAccountId, applicationId }, 'Creditworthiness check triggered');
        }
      } catch (err) {
        this.logger.warn({ err, monoAccountId, applicationId }, 'Creditworthiness trigger failed — will be null at analyze time');
      }
    }
  }

  // ─── Private: check if both enrichments are stored, fire webhook if so ─────
  //
  // Both the income webhook handler and the insights poller call this after
  // storing their data. The updateMany WHERE clause makes this atomic — only
  // one caller will get count=1, so the outbound webhook fires exactly once.

  async _checkAndFireEnrichmentReady(monoAccountId: string): Promise<void> {
    // Atomically transition PENDING → READY only when both fields are present.
    // If another concurrent call already set it to READY, count will be 0.
    const result = await this.prisma.bankAccount.updateMany({
      where: {
        monoAccountId,
        enrichmentStatus: { not: 'READY' },
        // Prisma.AnyNull matches either DbNull or JsonNull — i.e. "is not null"
        incomeData: { not: Prisma.AnyNull },
        statementInsightsData: { not: Prisma.AnyNull },
      },
      data: { enrichmentStatus: 'READY' },
    });

    if (result.count === 0) {
      // Either not ready yet (one enrichment still missing) or already fired
      return;
    }

    // We were the call that transitioned it to READY — now fire the webhook
    const account = await this.prisma.bankAccount.findUnique({
      where: { monoAccountId },
      include: { applicant: true },
    });

    if (!account) return;

    this.logger.info({ monoAccountId, accountId: account.id }, 'Both enrichments ready');

    await this.outboundWebhookService.dispatch(
      account.applicant.fintechId,
      'account.enrichment_ready',
      {
        accountId: account.id,
        monoAccountId,
        applicantId: account.applicantId,
        message:
          'Account enrichment complete. You may now submit this applicant for loan analysis.',
      },
    );
  }
}
