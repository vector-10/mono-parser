from dataclasses import dataclass
from typing import Optional
from datetime import datetime, date
import logging

from app.models import AnalyzeRequest, RiskPolicy

logger = logging.getLogger(__name__)


@dataclass
class KnockoutResult:
    knocked_out: bool
    reason: Optional[str] = None   
    detail: Optional[str] = None   


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

    All thresholds come from the RiskPolicy passed at call time rather than
    module-level constants, so each fintech can tune them independently.
    """

    def run(self, request: AnalyzeRequest, policy: RiskPolicy) -> KnockoutResult:
        checks = [
            self._check_identity,
            self._check_fraud_signals,
            self._check_active_defaults,
            lambda r, p: self._check_account_health(r, p),
            lambda r, p: self._check_income_disqualifiers(r, p),
        ]
        for check in checks:
            result = check(request, policy)
            if result.knocked_out:
                logger.warning(
                    f"[KNOCKOUT] applicant={request.applicant_id} "
                    f"reason={result.reason} detail={result.detail}"
                )
                return result
        return KnockoutResult(knocked_out=False)


    def _check_identity(self, request: AnalyzeRequest, policy: RiskPolicy) -> KnockoutResult:
        """
        Cross-check the name and BVN the fintech submitted against what Mono's
        /identity endpoint returned for the linked bank account.
        """
        for account in request.accounts:
            if not account.identity:
                continue

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


    def _check_fraud_signals(self, request: AnalyzeRequest, policy: RiskPolicy) -> KnockoutResult:
        """
        Mono's statement insights pre-compute three fraud patterns under
        activity_insights.rare_findings. These are hard stops regardless of policy.
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


    def _check_active_defaults(self, request: AnalyzeRequest, policy: RiskPolicy) -> KnockoutResult:
        """
        Credit bureau check: is the applicant currently defaulting on any loan?
        Uses policy.max_consecutive_failures as the consecutive missed payment threshold.
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

                schedule    = loan.get("repayment_schedule", [])
                consecutive = 0
                max_consec  = 0
                for payment in schedule:
                    if payment.get("status") in ("failed", "missed"):
                        consecutive += 1
                        max_consec = max(max_consec, consecutive)
                    else:
                        consecutive = 0
                if max_consec >= policy.max_consecutive_failures:
                    return KnockoutResult(
                        knocked_out=True,
                        reason="CONSECUTIVE_PAYMENT_FAILURES",
                        detail=(
                            f"{max_consec} consecutive missed payments at {institution_name}"
                        ),
                    )

        return KnockoutResult(knocked_out=False)


    def _check_account_health(self, request: AnalyzeRequest, policy: RiskPolicy) -> KnockoutResult:
        """
        Minimum account viability checks.
        Thresholds come from policy: min_account_age_months, max_overdrafts,
        max_bounced_payments.
        """
        total_overdrafts = 0
        total_bounced    = 0

        for account in request.accounts:
            if account.statement_insights and account.statement_insights.start_date:
                try:
                    start      = datetime.strptime(
                        account.statement_insights.start_date, "%Y-%m-%d"
                    ).date()
                    age_months = (date.today() - start).days / 30.0
                    if age_months < policy.min_account_age_months:
                        return KnockoutResult(
                            knocked_out=True,
                            reason="ACCOUNT_TOO_NEW",
                            detail=(
                                f"Account history is only {age_months:.1f} months. "
                                f"Minimum required: {policy.min_account_age_months} months"
                            ),
                        )
                except ValueError:
                    pass

            for txn in account.transactions:
                balance   = txn.get("balance", 0)
                narration = txn.get("narration", "").lower()

                if balance < 0:
                    total_overdrafts += 1
                if any(w in narration for w in
                       ("insufficient", "bounced", "returned", "unable to process")):
                    total_bounced += 1

        if total_overdrafts > policy.max_overdrafts:
            return KnockoutResult(
                knocked_out=True,
                reason="EXCESSIVE_OVERDRAFTS",
                detail=(
                    f"{total_overdrafts} overdraft instances detected across all accounts "
                    f"(maximum allowed: {policy.max_overdrafts})"
                ),
            )

        if total_bounced > policy.max_bounced_payments:
            return KnockoutResult(
                knocked_out=True,
                reason="EXCESSIVE_BOUNCED_PAYMENTS",
                detail=(
                    f"{total_bounced} bounced/returned payments detected "
                    f"(maximum allowed: {policy.max_bounced_payments})"
                ),
            )

        return KnockoutResult(knocked_out=False)


    def _check_income_disqualifiers(self, request: AnalyzeRequest, policy: RiskPolicy) -> KnockoutResult:
        """
        Baseline income checks.
        Thresholds from policy: minimum_monthly_income, income_staleness_days.
        """
        for account in request.accounts:
            income = account.income
            if not income:
                continue

            if not income.income_streams:
                return KnockoutResult(
                    knocked_out=True,
                    reason="NO_INCOME_DETECTED",
                    detail="No income streams identified in bank statement analysis",
                )

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
                if days_stale > policy.income_staleness_days:
                    return KnockoutResult(
                        knocked_out=True,
                        reason="INCOME_STALE",
                        detail=(
                            f"Last income was {days_stale} days ago. "
                            f"Maximum allowed gap: {policy.income_staleness_days} days"
                        ),
                    )

            if income.monthly_income < policy.minimum_monthly_income:
                return KnockoutResult(
                    knocked_out=True,
                    reason="INCOME_BELOW_MINIMUM",
                    detail=(
                        f"Monthly income ₦{income.monthly_income:,.0f} is below "
                        f"the minimum threshold of ₦{policy.minimum_monthly_income:,.0f}"
                    ),
                )

        return KnockoutResult(knocked_out=False)
