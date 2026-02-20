from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from app.models import (
    AnalyzeRequest, AnalyzeResponse, ScoreBreakdown, RiskFactor,
    ApprovalDetails, CounterOffer, EligibleTenor, Explainability,
    RegulatoryCompliance,
)
from app.scoring import CreditScorer

logger = logging.getLogger(__name__)

# ─── Decision thresholds ──────────────────────────────────────────────────────
SCORE_REJECT_FLOOR       = 500   # Below 500 → auto-reject (VERY_HIGH_RISK band)
SCORE_MANUAL_FLOOR       = 600   # 500–599 → manual review, not auto-reject
SCORE_APPROVE_FLOOR      = 700   # 600–699 → counter-offer eligible; ≥700 → approve
MANUAL_REVIEW_BUFFER     = 20    # ±20 pts of a threshold = borderline → manual review
HIGH_VALUE_THRESHOLD     = 500_000  # ₦500k+  → always flag for manual review

# ─── Affordability ────────────────────────────────────────────────────────────
AFFORDABILITY_CAP        = 0.35  # Monthly payment ≤ 35% of safe monthly income
MIN_VIABLE_OFFER_RATIO   = 0.30  # Counter-offer must be ≥ 30% of requested amount

# ─── Thin-file limits ─────────────────────────────────────────────────────────
THIN_FILE_INCOME_MULTIPLE = 2    # Max loan = 2× monthly income
THIN_FILE_MAX_TENOR       = 6    # Max tenor = 6 months

STANDARD_TENORS = [3, 6, 9, 12, 15, 18, 21, 24]


class DecisionEngine:
    """
    Stages 4 & 5: Affordability check, decision, and manual review triggers.

    Flow:
    1. Establish safe monthly income (conservative floor).
    2. Compute the 35% affordability cap (max monthly payment).
    3. Apply score-based gate → REJECTED / MANUAL_REVIEW / COUNTER_OFFER / APPROVED.
    4. Apply thin-file caps (2× income, 6-month tenor) if applicable.
    5. Affordability check on effective (possibly capped) terms → counter-offer if needed.
    6. Stage 5 manual review triggers (borderline score, high value, conflicting signals).
    7. Build explainability and regulatory compliance fields.
    8. Return fully assembled AnalyzeResponse.
    """

    def __init__(self):
        self._scorer = CreditScorer()

    def decide(
        self,
        request: AnalyzeRequest,
        features: Dict[str, Any],
        score: int,
        score_breakdown: Dict[str, float],
    ) -> AnalyzeResponse:

        is_thin_file = features.get("is_thin_file", True)

        # ── Safe income ───────────────────────────────────────────────────────
        # Use the more conservative of webhook income vs average monthly credits.
        # We never approve based on a number the applicant can't consistently sustain.
        monthly_income = features.get("total_monthly_income", 0.0)
        avg_credits    = features.get("monthly_avg_credits", 0.0)
        safe_income    = min(monthly_income, avg_credits) if monthly_income > 0 else avg_credits
        max_monthly_payment = safe_income * AFFORDABILITY_CAP

        risk_factors:         List[RiskFactor] = []
        manual_review_reasons: List[str]       = []
        decision       = "APPROVED"
        approval_details: Optional[ApprovalDetails] = None
        counter_offer:    Optional[CounterOffer]    = None

        self._collect_risk_factors(features, risk_factors)

        # ── Stage 4a: Score gate ──────────────────────────────────────────────
        if score < SCORE_REJECT_FLOOR:
            decision = "REJECTED"
        elif score < SCORE_MANUAL_FLOOR:
            # Score is in the HIGH_RISK band (500–599). Not auto-rejected —
            # a human can still approve with additional information.
            decision = "MANUAL_REVIEW"
            manual_review_reasons.append(
                f"Score {score} is in the HIGH_RISK band (500–599). Requires human assessment."
            )
        elif score < SCORE_APPROVE_FLOOR:
            decision = "COUNTER_OFFER"

        # ── No verifiable income ──────────────────────────────────────────────
        if safe_income <= 0:
            decision = "REJECTED"
            risk_factors.append(RiskFactor(
                factor="No verifiable income",
                severity="HIGH",
                detail="Could not establish a positive monthly income from available data",
            ))

        # ── Stage 4b: Thin-file caps ──────────────────────────────────────────
        effective_amount = request.loan_amount
        effective_tenor  = request.tenor_months

        if is_thin_file and decision not in ("REJECTED",):
            thin_file_max = safe_income * THIN_FILE_INCOME_MULTIPLE
            if effective_amount > thin_file_max:
                effective_amount = thin_file_max
                if decision == "APPROVED":
                    decision = "COUNTER_OFFER"
                risk_factors.append(RiskFactor(
                    factor="Thin credit file — loan amount capped",
                    severity="MEDIUM",
                    detail=(
                        f"No credit history. Amount capped at 2× monthly income "
                        f"(₦{thin_file_max:,.0f})"
                    ),
                ))

            if effective_tenor > THIN_FILE_MAX_TENOR:
                effective_tenor = THIN_FILE_MAX_TENOR
                if decision == "APPROVED":
                    decision = "COUNTER_OFFER"
                risk_factors.append(RiskFactor(
                    factor="Thin credit file — tenor capped",
                    severity="MEDIUM",
                    detail=f"No credit history. Tenor capped at {THIN_FILE_MAX_TENOR} months",
                ))

        # ── Stage 4c: Affordability check ────────────────────────────────────
        if decision not in ("REJECTED",) and safe_income > 0:
            effective_payment = self._scorer._amortize(
                effective_amount, effective_tenor, request.interest_rate
            )

            if effective_payment > max_monthly_payment:
                # Cannot afford at effective terms — find maximum affordable amount
                max_affordable = self._max_affordable_amount(
                    max_monthly_payment, effective_tenor, request.interest_rate
                )
                min_viable = request.loan_amount * MIN_VIABLE_OFFER_RATIO

                if max_affordable < min_viable:
                    # Affordable amount is less than 30% of what was requested — not viable
                    decision = "REJECTED"
                    risk_factors.append(RiskFactor(
                        factor="Insufficient repayment capacity",
                        severity="HIGH",
                        detail=(
                            f"Monthly payment would be ₦{effective_payment:,.0f} "
                            f"but capacity is ₦{max_monthly_payment:,.0f}"
                        ),
                    ))
                else:
                    decision = "COUNTER_OFFER"
                    co_payment = self._scorer._amortize(
                        max_affordable, effective_tenor, request.interest_rate
                    )
                    counter_offer = CounterOffer(
                        offered_amount=round(max_affordable, 2),
                        offered_tenor=effective_tenor,
                        monthly_payment=round(co_payment, 2),
                        reason=(
                            f"Requested amount exceeds repayment capacity. "
                            f"Maximum affordable at current income: ₦{max_affordable:,.0f}"
                        ),
                    )
            else:
                # Affordable — build approval details if decision still warrants it
                if decision in ("APPROVED", "COUNTER_OFFER") and not counter_offer:
                    actual_payment = self._scorer._amortize(
                        effective_amount, effective_tenor, request.interest_rate
                    )
                    dti = actual_payment / safe_income
                    approval_details = ApprovalDetails(
                        approved_amount=round(effective_amount, 2),
                        approved_tenor=effective_tenor,
                        monthly_payment=round(actual_payment, 2),
                        interest_rate=request.interest_rate,
                        dti_ratio=round(dti, 4),
                        conditions=self._build_conditions(features, is_thin_file),
                    )
                    # If effective terms differ from requested, it's a counter-offer
                    if effective_amount < request.loan_amount or effective_tenor != request.tenor_months:
                        decision = "COUNTER_OFFER"

        # ── Stage 5: Manual review triggers ──────────────────────────────────
        if decision not in ("REJECTED",):
            # Borderline score
            thresholds = [SCORE_REJECT_FLOOR, SCORE_MANUAL_FLOOR, SCORE_APPROVE_FLOOR]
            for threshold in thresholds:
                if abs(score - threshold) <= MANUAL_REVIEW_BUFFER:
                    manual_review_reasons.append(
                        f"Score ({score}) is within {MANUAL_REVIEW_BUFFER} points of "
                        f"decision threshold ({threshold})"
                    )
                    break

            # High-value loan
            if request.loan_amount > HIGH_VALUE_THRESHOLD:
                manual_review_reasons.append(
                    f"Loan amount ₦{request.loan_amount:,.0f} exceeds "
                    f"high-value threshold of ₦{HIGH_VALUE_THRESHOLD:,.0f}"
                )

            # Limited transaction data
            total_txns = sum(len(a.transactions) for a in request.accounts)
            if total_txns < 20:
                manual_review_reasons.append(
                    f"Limited transaction history ({total_txns} transactions). "
                    "Assessment may not be fully reliable."
                )

            # Escalate APPROVED to MANUAL_REVIEW if triggers fired
            if manual_review_reasons and decision == "APPROVED":
                decision = "MANUAL_REVIEW"

        # ── Regulatory compliance ─────────────────────────────────────────────
        regulatory = RegulatoryCompliance(
            identity_verified=any(a.identity is not None for a in request.accounts),
            credit_bureau_checked=request.credit_history is not None,
            affordability_assessed=safe_income > 0,
            thin_file=is_thin_file,
        )

        # ── Eligible tenors ───────────────────────────────────────────────────
        eligible_tenors = self._compute_eligible_tenors(
            max_monthly_payment, request.interest_rate, is_thin_file
        )

        # ── Explainability ────────────────────────────────────────────────────
        explainability = self._build_explainability(
            features, score, score_breakdown, decision, is_thin_file
        )

        return AnalyzeResponse(
            applicant_id=request.applicant_id,
            decision=decision,
            score=score,
            score_band=self._scorer.get_score_band(score),
            score_breakdown=ScoreBreakdown(
                credit_history=score_breakdown.get("credit_history", 0.0),
                income_stability=score_breakdown.get("income_stability", 0.0),
                cash_flow_health=score_breakdown.get("cash_flow_health", 0.0),
                debt_service_capacity=score_breakdown.get("debt_service_capacity", 0.0),
                account_behavior=score_breakdown.get("account_behavior", 0.0),
                total=score,
            ),
            risk_factors=risk_factors,
            approval_details=approval_details,
            counter_offer=counter_offer,
            eligible_tenors=eligible_tenors,
            manual_review_reasons=manual_review_reasons,
            regulatory_compliance=regulatory,
            explainability=explainability,
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    # ─── Helpers ──────────────────────────────────────────────────────────────

    def _max_affordable_amount(
        self, max_payment: float, tenor: int, annual_rate_pct: float
    ) -> float:
        """Reverse of amortize: given a max monthly payment, what principal can it support?"""
        if tenor <= 0 or max_payment <= 0:
            return 0.0
        if annual_rate_pct == 0:
            return max_payment * tenor
        r = (annual_rate_pct / 100.0) / 12.0
        return max_payment * ((1 + r) ** tenor - 1) / (r * (1 + r) ** tenor)

    def _compute_eligible_tenors(
        self, max_monthly_payment: float, rate: float, is_thin_file: bool
    ) -> List[EligibleTenor]:
        """Show the maximum borrowable amount at each standard tenor given income."""
        max_tenor = THIN_FILE_MAX_TENOR if is_thin_file else 24
        results   = []
        for tenor in STANDARD_TENORS:
            if tenor > max_tenor:
                break
            max_amount = self._max_affordable_amount(max_monthly_payment, tenor, rate)
            if max_amount > 0:
                payment = self._scorer._amortize(max_amount, tenor, rate)
                results.append(EligibleTenor(
                    tenor=tenor,
                    max_amount=round(max_amount, 2),
                    monthly_payment=round(payment, 2),
                ))
        return results

    def _collect_risk_factors(
        self, features: Dict, risk_factors: List[RiskFactor]
    ) -> None:
        """Populate risk factors from notable feature values."""
        if features.get("overdraft_count", 0) > 3:
            risk_factors.append(RiskFactor(
                factor="Frequent overdrafts",
                severity="MEDIUM",
                detail=f"{features['overdraft_count']} overdraft instances detected",
            ))
        if features.get("bounced_payment_count", 0) > 0:
            sev = "HIGH" if features["bounced_payment_count"] > 2 else "MEDIUM"
            risk_factors.append(RiskFactor(
                factor="Bounced payments",
                severity=sev,
                detail=f"{features['bounced_payment_count']} bounced/returned payment(s)",
            ))
        if features.get("high_risk_transaction_count", 0) > 0:
            risk_factors.append(RiskFactor(
                factor="High-risk transactions",
                severity="MEDIUM",
                detail="Transactions to gambling platforms or unregulated lenders detected",
            ))
        if features.get("income_recency_days", 0) > 45:
            risk_factors.append(RiskFactor(
                factor="Stale income",
                severity="MEDIUM",
                detail=f"Last income received {features['income_recency_days']} days ago",
            ))
        if features.get("debit_to_credit_ratio", 0) > 1.0:
            risk_factors.append(RiskFactor(
                factor="Spending exceeds income",
                severity="HIGH",
                detail=f"Debit-to-credit ratio: {features['debit_to_credit_ratio']:.2f}",
            ))
        if features.get("income_source") == "transaction_fallback":
            risk_factors.append(RiskFactor(
                factor="Income estimated from transactions",
                severity="LOW",
                detail=(
                    "Income webhook not available. Income estimated from transaction "
                    "narrations — less accurate than Mono's analysis."
                ),
            ))

    def _build_conditions(self, features: Dict, is_thin_file: bool) -> List[str]:
        conditions = []
        if is_thin_file:
            conditions.append(
                "First-time borrower terms apply. "
                "Eligible for standard terms after successful repayment history."
            )
        if features.get("income_source") == "transaction_fallback":
            conditions.append(
                "Income requires verification via payslip or employer confirmation."
            )
        if features.get("high_risk_transaction_count", 0) > 0:
            conditions.append(
                "No gambling or informal lending activity during loan tenor."
            )
        return conditions

    def _build_explainability(
        self,
        features: Dict,
        score: int,
        breakdown: Dict,
        decision: str,
        is_thin_file: bool,
    ) -> Explainability:
        strengths: List[str] = []
        weaknesses: List[str] = []

        psr = features.get("payment_success_rate")
        if psr is not None and psr >= 0.90:
            strengths.append(f"Strong repayment history ({psr * 100:.0f}% on-time payments)")

        if features.get("stable_income_ratio", 0) >= 0.70:
            strengths.append("Consistent salary income as primary source")

        if features.get("positive_cash_flow_ratio", 0) >= 0.80:
            strengths.append("Cash flow positive in most months")

        if (features.get("overdraft_count", 0) == 0
                and features.get("bounced_payment_count", 0) == 0):
            strengths.append("Clean account — zero overdrafts or bounced payments")

        age = features.get("account_age_months", 0)
        if age >= 18:
            strengths.append(f"{age:.0f} months of verified banking history")

        if features.get("income_recency_days", 999) > 45:
            weaknesses.append(
                f"Income last received {features['income_recency_days']} days ago"
            )
        if features.get("debit_to_credit_ratio", 0) > 1.0:
            weaknesses.append("Monthly expenses exceed monthly income")
        if features.get("spending_volatility", 0) > 0.5:
            weaknesses.append("Inconsistent spending — high month-to-month variation")
        if is_thin_file:
            weaknesses.append("No credit bureau history — first-time borrower")
        if features.get("high_risk_transaction_count", 0) > 0:
            weaknesses.append("Transactions to gambling or informal lenders detected")

        if decision == "APPROVED":
            primary = strengths[0] if strengths else "Applicant meets all credit criteria"
        elif decision == "REJECTED":
            if score < SCORE_REJECT_FLOOR:
                primary = f"Credit score ({score}) is below the minimum threshold of {SCORE_REJECT_FLOOR}"
            else:
                primary = weaknesses[0] if weaknesses else "Does not meet lending criteria"
        elif decision == "COUNTER_OFFER":
            primary = "Requested terms adjusted to match verified repayment capacity"
        else:
            primary = "Application requires manual review before a decision can be made"

        return Explainability(
            primary_reason=primary,
            key_strengths=strengths[:4],
            key_weaknesses=weaknesses[:4],
        )
