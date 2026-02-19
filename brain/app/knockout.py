from dataclasses import dataclass
from typing import Optional
from datetime import datetime, date
import logging

from app.models import AnalyzeRequest

logger = logging.getLogger(__name__)

# ─── Thresholds ───────────────────────────────────────────────────────────────
MINIMUM_MONTHLY_INCOME_NGN = 30_000   # ₦30k/month floor
INCOME_STALENESS_DAYS      = 90       # Income older than 90 days = stale
MIN_ACCOUNT_AGE_MONTHS     = 3        # Less than 3 months of history = unreliable
MAX_OVERDRAFTS             = 10       # More than 10 overdrafts = chronic cash problem
MAX_BOUNCED_PAYMENTS       = 3        # More than 3 bounced = inability to honour
MAX_CONSECUTIVE_FAILURES   = 3        # 3 consecutive missed repayments = active default


@dataclass
class KnockoutResult:
    knocked_out: bool
    reason: Optional[str] = None    # Machine-readable code
    detail: Optional[str] = None    # Human-readable explanation


class KnockoutEngine:
    """
    Stage 1: Hard-stop rules that run before any scoring.

    Why do knockouts exist?
    Scoring is expensive and meaningless for certain applicants. Someone actively
    defaulting on another loan, or whose identity doesn't match the linked account,
    should not receive a score — they should be rejected immediately with a clear reason.

    Rules run in order. The first rule that fires stops the pipeline.
    Order matters: identity first (cheapest), fraud signals second (requires insights),
    credit defaults third (requires credit history), then account health, then income.
    """

    def run(self, request: AnalyzeRequest) -> KnockoutResult:
        checks = [
            self._check_identity,
            self._check_fraud_signals,
            self._check_active_defaults,
            self._check_account_health,
            self._check_income_disqualifiers,
        ]
        for check in checks:
            result = check(request)
            if result.knocked_out:
                logger.warning(
                    f"[KNOCKOUT] applicant={request.applicant_id} "
                    f"reason={result.reason} detail={result.detail}"
                )
                return result
        return KnockoutResult(knocked_out=False)

    # ─── Rule 1: Identity ─────────────────────────────────────────────────────

    def _check_identity(self, request: AnalyzeRequest) -> KnockoutResult:
        """
        Cross-check the name and BVN the fintech submitted at application
        initiation against what Mono's /identity endpoint returned for the
        linked bank account.

        Why this matters:
        If the names don't align, either the account doesn't belong to the person
        applying, or the fintech submitted incorrect data. Either way it's a hard stop.
        We require at least 2 matching name tokens (not full exact match) to
        accommodate middle names, initials, and capitalisation differences.

        BVN mismatch is absolute — one BVN, one person.
        """
        for account in request.accounts:
            if not account.identity:
                continue  # No identity data available — skip this account's check

            mono_name      = account.identity.get("full_name", "").upper().strip()
            submitted_name = request.applicant_name.upper().strip()
            mono_bvn       = str(account.identity.get("bvn", "")).strip()
            submitted_bvn  = str(request.applicant_bvn).strip()

            if mono_name and submitted_name:
                submitted_tokens = set(submitted_name.split())
                mono_tokens      = set(mono_name.split())
                common           = submitted_tokens & mono_tokens
                if len(common) < 2:
                    return KnockoutResult(
                        knocked_out=True,
                        reason="IDENTITY_NAME_MISMATCH",
                        detail=(
                            f"Submitted name '{request.applicant_name}' does not match "
                            f"account holder name '{mono_name}' on the linked bank account"
                        ),
                    )

            if mono_bvn and submitted_bvn and mono_bvn != submitted_bvn:
                return KnockoutResult(
                    knocked_out=True,
                    reason="IDENTITY_BVN_MISMATCH",
                    detail="BVN submitted at application does not match the linked bank account",
                )

        return KnockoutResult(knocked_out=False)

    # ─── Rule 2: Fraud signals ────────────────────────────────────────────────

    def _check_fraud_signals(self, request: AnalyzeRequest) -> KnockoutResult:
        """
        Mono's statement insights pre-compute three fraud patterns under
        activity_insights.rare_findings. These patterns cannot be explained by
        normal financial behaviour and are hard stops.

        - immediate_large_withdrawal_post_payday:
          Draining the account right after salary arrives. Classic loan-stacking fraud
          signal — applicant inflates apparent salary by cycling funds in and out.

        - identical_debit_vs_credit:
          Money flowing in and immediately back out in identical amounts. Indicates
          round-tripping to make the account look active when it isn't.

        - cash_deposits_larger_than_salary:
          Undisclosed income source or cash-based business not reflected in salary.
          Makes income analysis unreliable and raises AML concerns.
        """
        for account in request.accounts:
            if not account.statement_insights:
                continue
            activity = account.statement_insights.activity_insights
            if not activity:
                continue
            rare = activity.get("rare_findings", {})

            checks = [
                ("immediate_large_withdrawal_post_payday",
                 "Pattern: Immediate large withdrawal post-payday detected"),
                ("identical_debit_vs_credit",
                 "Pattern: Identical debit vs credit detected (possible round-tripping)"),
                ("cash_deposits_larger_than_salary",
                 "Pattern: Cash deposits larger than declared salary detected"),
            ]
            for key, detail in checks:
                if rare.get(key) == "Detected":
                    return KnockoutResult(
                        knocked_out=True,
                        reason="FRAUD_SIGNAL_DETECTED",
                        detail=detail,
                    )

        return KnockoutResult(knocked_out=False)

    # ─── Rule 3: Active defaults ──────────────────────────────────────────────

    def _check_active_defaults(self, request: AnalyzeRequest) -> KnockoutResult:
        """
        Credit bureau check: is the applicant currently defaulting on any loan?

        non-performing: The lender has classified this loan as in default.
        written-off: The lender gave up trying to recover the money.
        3+ consecutive failures: Even without a formal default classification,
          three consecutive missed payments signals active inability to repay.

        If credit_history is None, this check is skipped entirely — we treat
        the applicant as thin-file, not as a defaulter.
        """
        if not request.credit_history:
            return KnockoutResult(knocked_out=False)

        for institution_entry in request.credit_history.get("credit_history", []):
            institution_name = institution_entry.get("institution", "unknown institution")
            for loan in institution_entry.get("history", []):
                status      = loan.get("performance_status", "").lower()
                loan_status = loan.get("loan_status", "").lower()

                if status == "non-performing":
                    return KnockoutResult(
                        knocked_out=True,
                        reason="ACTIVE_DEFAULT",
                        detail=f"Non-performing loan at {institution_name}",
                    )
                if loan_status == "written-off":
                    return KnockoutResult(
                        knocked_out=True,
                        reason="WRITTEN_OFF_LOAN",
                        detail=f"Written-off loan at {institution_name}",
                    )

                # Consecutive missed payments
                schedule     = loan.get("repayment_schedule", [])
                consecutive  = 0
                max_consec   = 0
                for payment in schedule:
                    if payment.get("status") in ("failed", "missed"):
                        consecutive += 1
                        max_consec = max(max_consec, consecutive)
                    else:
                        consecutive = 0
                if max_consec >= MAX_CONSECUTIVE_FAILURES:
                    return KnockoutResult(
                        knocked_out=True,
                        reason="CONSECUTIVE_PAYMENT_FAILURES",
                        detail=(
                            f"{max_consec} consecutive missed payments at {institution_name}"
                        ),
                    )

        return KnockoutResult(knocked_out=False)

    # ─── Rule 4: Account health ───────────────────────────────────────────────

    def _check_account_health(self, request: AnalyzeRequest) -> KnockoutResult:
        """
        Minimum account viability checks across all linked accounts.

        Account age < 3 months: Too little history to assess behaviour. Any
          score computed would be statistically meaningless.

        Overdraft count > 10: Chronic overdrafting means the applicant regularly
          spends beyond their balance. This is a structural cash flow problem, not
          a one-off event.

        Bounced payments > 3: Inability to honour scheduled payments. Beyond 3
          instances this is a pattern, not bad luck.
        """
        total_overdrafts = 0
        total_bounced    = 0

        for account in request.accounts:
            # Age check from statement insights (most reliable source)
            if account.statement_insights and account.statement_insights.start_date:
                try:
                    start      = datetime.strptime(
                        account.statement_insights.start_date, "%Y-%m-%d"
                    ).date()
                    age_months = (date.today() - start).days / 30.0
                    if age_months < MIN_ACCOUNT_AGE_MONTHS:
                        return KnockoutResult(
                            knocked_out=True,
                            reason="ACCOUNT_TOO_NEW",
                            detail=(
                                f"Account history is only {age_months:.1f} months. "
                                f"Minimum required: {MIN_ACCOUNT_AGE_MONTHS} months"
                            ),
                        )
                except ValueError:
                    pass

            # Overdraft and bounce counts from raw transactions
            for txn in account.transactions:
                balance  = txn.get("balance", 0)
                narration = txn.get("narration", "").lower()

                if balance < 0:
                    total_overdrafts += 1

                if any(w in narration for w in
                       ("insufficient", "bounced", "returned", "unable to process")):
                    total_bounced += 1

        if total_overdrafts > MAX_OVERDRAFTS:
            return KnockoutResult(
                knocked_out=True,
                reason="EXCESSIVE_OVERDRAFTS",
                detail=(
                    f"{total_overdrafts} overdraft instances detected across all accounts "
                    f"(maximum allowed: {MAX_OVERDRAFTS})"
                ),
            )

        if total_bounced > MAX_BOUNCED_PAYMENTS:
            return KnockoutResult(
                knocked_out=True,
                reason="EXCESSIVE_BOUNCED_PAYMENTS",
                detail=(
                    f"{total_bounced} bounced/returned payments detected "
                    f"(maximum allowed: {MAX_BOUNCED_PAYMENTS})"
                ),
            )

        return KnockoutResult(knocked_out=False)

    # ─── Rule 5: Income disqualifiers ─────────────────────────────────────────

    def _check_income_disqualifiers(self, request: AnalyzeRequest) -> KnockoutResult:
        """
        Baseline income checks. Only runs if income webhook data is available.
        If income is None (enrichment timed out or unavailable), we skip these
        checks — the scoring engine will penalise missing income naturally.

        No income streams: The account shows no identifiable income source.
          Lending without evidence of income is irresponsible.

        Income stale > 90 days: Employment may have ended. A 3-month gap is
          the industry-standard threshold for "income has stopped".

        Monthly income < ₦30,000: Below the floor for any viable loan product.
          Even the smallest repayment would represent an extreme burden.
        """
        for account in request.accounts:
            income = account.income
            if not income:
                continue  # Skip if webhook data not available

            if not income.income_streams:
                return KnockoutResult(
                    knocked_out=True,
                    reason="NO_INCOME_DETECTED",
                    detail="No income streams identified in bank statement analysis",
                )

            # Find the most recent income date across all streams
            most_recent: Optional[date] = None
            for stream in income.income_streams:
                try:
                    d = datetime.strptime(stream.last_income_date, "%Y-%m-%d").date()
                    if most_recent is None or d > most_recent:
                        most_recent = d
                except ValueError:
                    pass

            if most_recent:
                days_stale = (date.today() - most_recent).days
                if days_stale > INCOME_STALENESS_DAYS:
                    return KnockoutResult(
                        knocked_out=True,
                        reason="INCOME_STALE",
                        detail=(
                            f"Last income was {days_stale} days ago. "
                            f"Maximum allowed gap: {INCOME_STALENESS_DAYS} days"
                        ),
                    )

            if income.monthly_income < MINIMUM_MONTHLY_INCOME_NGN:
                return KnockoutResult(
                    knocked_out=True,
                    reason="INCOME_BELOW_MINIMUM",
                    detail=(
                        f"Monthly income ₦{income.monthly_income:,.0f} is below "
                        f"the minimum threshold of ₦{MINIMUM_MONTHLY_INCOME_NGN:,.0f}"
                    ),
                )

        return KnockoutResult(knocked_out=False)
