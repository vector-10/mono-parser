from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

# ─── Score architecture ────────────────────────────────────────────────────────
#
# Final score = BASELINE (350) + earned points (0–500)
# Range: 350–850, mirroring FICO/Vantage — instantly recognisable to credit professionals.
#
# Each component is scored 0–100 internally (raw_score).
# Contribution = (raw_score / 100) * (weight * MAX_EARNED_POINTS)
#
# Normal weights (applicant has credit history):
#   Credit History      30% → max 150 pts
#   Income Stability    25% → max 125 pts
#   Cash Flow Health    20% → max 100 pts
#   Debt Service Cap.   15% → max  75 pts
#   Account Behavior    10% → max  50 pts
#
# Thin-file weights (< 2 loans in credit bureau, 30% redistributed):
#   Credit History       0% → max   0 pts
#   Income Stability    35% → max 175 pts
#   Cash Flow Health    30% → max 150 pts
#   Debt Service Cap.   20% → max 100 pts
#   Account Behavior    15% → max  75 pts

BASELINE_SCORE    = 350
MAX_EARNED_POINTS = 500

NORMAL_WEIGHTS = {
    "credit_history":       0.30,
    "income_stability":     0.25,
    "cash_flow_health":     0.20,
    "debt_service_capacity": 0.15,
    "account_behavior":     0.10,
}

THIN_FILE_WEIGHTS = {
    "credit_history":       0.00,
    "income_stability":     0.35,
    "cash_flow_health":     0.30,
    "debt_service_capacity": 0.20,
    "account_behavior":     0.15,
}

SCORE_BANDS = [
    (800, 850, "VERY_LOW_RISK"),
    (700, 799, "LOW_RISK"),
    (600, 699, "MEDIUM_RISK"),
    (500, 599, "HIGH_RISK"),
    (350, 499, "VERY_HIGH_RISK"),
]


class CreditScorer:
    """
    Stage 3: Calculate a 350–850 credit score.

    Each component scorer returns a raw 0–100 score.
    The orchestrator multiplies each by its weight to get earned points,
    adds the 350 baseline, and clamps to [350, 850].

    Thin-file detection comes from features["is_thin_file"] set by FeatureExtractor.
    When thin-file=True, the credit history component contributes 0 points and
    the remaining 30% is redistributed across the other four components.
    """

    def calculate(
        self,
        features: Dict[str, Any],
        loan_amount: float,
        tenor_months: int,
        interest_rate: float,
    ) -> Tuple[int, Dict[str, float]]:
        """
        Returns (final_score, breakdown_dict).
        breakdown_dict values are the actual earned points per component (not raw 0-100).
        """
        is_thin_file = features.get("is_thin_file", True)
        weights      = THIN_FILE_WEIGHTS if is_thin_file else NORMAL_WEIGHTS

        raw_scores = {
            "credit_history":        self._score_credit_history(features),
            "income_stability":      self._score_income_stability(features),
            "cash_flow_health":      self._score_cash_flow_health(features),
            "debt_service_capacity": self._score_debt_service_capacity(
                                         features, loan_amount, tenor_months, interest_rate
                                     ),
            "account_behavior":      self._score_account_behavior(features),
        }

        breakdown: Dict[str, float] = {}
        total_earned = 0.0
        for component, raw in raw_scores.items():
            max_points   = weights[component] * MAX_EARNED_POINTS
            contribution = (raw / 100.0) * max_points
            breakdown[component] = round(contribution, 2)
            total_earned        += contribution

        final_score = int(BASELINE_SCORE + total_earned)
        final_score = max(BASELINE_SCORE, min(850, final_score))

        logger.info(
            f"Score: {final_score} | thin_file={is_thin_file} | "
            f"raw={raw_scores} | earned={breakdown}"
        )
        return final_score, breakdown

    def get_score_band(self, score: int) -> str:
        for low, high, band in SCORE_BANDS:
            if low <= score <= high:
                return band
        return "VERY_HIGH_RISK"

    # ─── Component: Credit History (0–100) ───────────────────────────────────

    def _score_credit_history(self, features: Dict) -> float:
        """
        Breakdown:
          70 pts — repayment performance (payment_success_rate)
          20 pts — credit age (older history = more reliable signal)
          10 pts — loan closure rate (successfully repaid loans)

        Returns 0 for thin-file applicants. Since thin-file weight is 0%,
        this contributes 0 points regardless — but the raw score is still
        logged so you can see how this component would have scored.
        """
        if not features.get("has_credit_history"):
            return 0.0

        score = 0.0

        # 1. Repayment performance (70 pts)
        psr = features.get("payment_success_rate")
        if psr is None:
            score += 35.0   # Loans exist but no schedule data — neutral
        elif psr >= 0.95:
            score += 70.0
        elif psr >= 0.90:
            score += 55.0
        elif psr >= 0.80:
            score += 35.0
        elif psr >= 0.70:
            score += 15.0
        else:
            score += 0.0

        # 2. Credit age (20 pts)
        age = features.get("credit_age_months", 0.0)
        if age >= 36:
            score += 20.0
        elif age >= 24:
            score += 15.0
        elif age >= 12:
            score += 10.0
        else:
            score += 5.0

        # 3. Loan closure rate (10 pts) — successfully closed loans show track record
        total  = features.get("total_loan_count", 0)
        closed = features.get("closed_loan_count", 0)
        if total > 0:
            closure_rate = closed / total
            if closure_rate >= 0.70:
                score += 10.0
            elif closure_rate >= 0.50:
                score += 6.0
            else:
                score += 2.0

        return min(score, 100.0)

    # ─── Component: Income Stability (0–100) ─────────────────────────────────

    def _score_income_stability(self, features: Dict) -> float:
        """
        Breakdown:
          35 pts — income type quality × frequency (stable_income_ratio as proxy)
          25 pts — income recency (how recently was the last payment received?)
          20 pts — Mono's stability score (0–1 from income webhook)
          15 pts — income growth (growing > stable > declining)
           5 pts — income diversity (multiple streams = resilience)

        When income_source="transaction_fallback", avg_income_stability is
        conservatively set to 0.5 by FeatureExtractor, which naturally lowers
        this component's score without a special case here.
        """
        monthly_income = features.get("total_monthly_income", 0.0)
        if monthly_income <= 0:
            return 0.0

        score = 0.0

        # 1. Income type × frequency (35 pts via stable_income_ratio)
        # stable_income_ratio = salary_income / total_monthly. Higher = more salary.
        stable_ratio = features.get("stable_income_ratio", 0.0)
        if stable_ratio >= 0.80:
            score += 35.0
        elif stable_ratio >= 0.60:
            score += 26.0
        elif stable_ratio >= 0.40:
            score += 18.0
        elif stable_ratio >= 0.20:
            score += 10.0
        else:
            score += 5.0    # All variable / irregular

        # 2. Recency (25 pts)
        recency = features.get("income_recency_days", 999)
        if recency <= 31:
            score += 25.0
        elif recency <= 45:
            score += 18.0
        elif recency <= 60:
            score += 10.0
        elif recency <= 90:
            score += 5.0
        else:
            score += 0.0

        # 3. Mono's stability score (20 pts)
        avg_stability = features.get("avg_income_stability", 0.0)
        score += avg_stability * 20.0   # 0–1 mapped to 0–20 pts

        # 4. Growth (15 pts)
        if features.get("income_is_growing"):
            score += 15.0
        else:
            # Regular/consistent income still earns partial credit
            regular_ratio = features.get("income_regular_ratio", 0.0)
            score += regular_ratio * 8.0    # up to 8 pts

        # 5. Diversity (5 pts)
        stream_count = features.get("income_stream_count", 0)
        score += min(stream_count * 2.0, 5.0)

        return min(score, 100.0)

    # ─── Component: Cash Flow Health (0–100) ─────────────────────────────────

    def _score_cash_flow_health(self, features: Dict) -> float:
        """
        Breakdown:
          30 pts — surplus ratio (net cash flow / total inflow)
          30 pts — positive cash flow months (% of months income > expenses)
          20 pts — debit-to-credit ratio
          20 pts — spending volatility (predictable spending = lower risk)

        If Mono's statement insights are available, inflow_avg_last_12m and
        outflow_avg_last_12m give us more accurate 12-month averages. These
        inform surplus_ratio naturally through the features dict.
        """
        score = 0.0

        # 1. Surplus ratio (30 pts)
        surplus_ratio = features.get("surplus_ratio", 0.0)
        if surplus_ratio >= 0.30:
            score += 30.0
        elif surplus_ratio >= 0.20:
            score += 24.0
        elif surplus_ratio >= 0.10:
            score += 15.0
        elif surplus_ratio >= 0.0:
            score += 8.0
        else:
            score += 0.0    # Spending exceeds income (negative surplus)

        # 2. Positive cash flow months (30 pts)
        positive_ratio = features.get("positive_cash_flow_ratio", 0.0)
        score += positive_ratio * 30.0

        # 3. Debit-to-credit ratio (20 pts)
        dtc = features.get("debit_to_credit_ratio", 999.0)
        if dtc <= 0.70:
            score += 20.0
        elif dtc <= 0.90:
            score += 16.0
        elif dtc <= 1.00:
            score += 10.0
        elif dtc <= 1.20:
            score += 5.0
        else:
            score += 0.0

        # 4. Spending volatility (20 pts) — lower volatility = better
        volatility = features.get("spending_volatility", 1.0)
        if volatility <= 0.20:
            score += 20.0
        elif volatility <= 0.40:
            score += 14.0
        elif volatility <= 0.60:
            score += 8.0
        elif volatility <= 0.80:
            score += 3.0
        else:
            score += 0.0

        return min(score, 100.0)

    # ─── Component: Debt Service Capacity (0–100) ─────────────────────────────

    def _score_debt_service_capacity(
        self,
        features: Dict,
        loan_amount: float,
        tenor_months: int,
        interest_rate: float,
    ) -> float:
        """
        Can this person afford THIS loan given what they already owe?

        Breakdown:
          60 pts — DTI ratio including this loan's monthly payment
          40 pts — existing debt burden ratio (before this loan)

        safe_income: the more conservative of monthly income vs average monthly credits.
        We use the conservative reading to avoid over-approving.

        Amortization formula: P × [r(1+r)^n] / [(1+r)^n - 1]
        where r = monthly rate, n = tenor months.
        """
        monthly_income = features.get("total_monthly_income", 0.0)
        avg_credits    = features.get("monthly_avg_credits", 0.0)
        safe_income    = min(monthly_income, avg_credits) if monthly_income > 0 else avg_credits

        if safe_income <= 0:
            return 0.0

        monthly_payment     = self._amortize(loan_amount, tenor_months, interest_rate)
        existing_obligation = features.get("recurring_debt_monthly", 0.0)
        total_obligation    = monthly_payment + existing_obligation
        total_dti           = total_obligation / safe_income

        # 1. Total DTI including this loan (60 pts)
        if total_dti < 0.30:
            dti_score = 60.0
        elif total_dti < 0.40:
            dti_score = 45.0
        elif total_dti < 0.50:
            dti_score = 25.0
        else:
            dti_score = 0.0

        # 2. Existing debt burden before this loan (40 pts)
        existing_dti = existing_obligation / safe_income
        if existing_dti < 0.20:
            burden_score = 40.0
        elif existing_dti < 0.30:
            burden_score = 28.0
        elif existing_dti < 0.40:
            burden_score = 15.0
        else:
            burden_score = 0.0

        return min(dti_score + burden_score, 100.0)

    # ─── Component: Account Behavior (0–100) ──────────────────────────────────

    def _score_account_behavior(self, features: Dict) -> float:
        """
        Account discipline over time.

        Breakdown:
          40 pts — account age (more history = more data = more confidence)
          30 pts — overdraft and bounce discipline
          20 pts — minimum balance maintenance (days_below_1000 proxy)
          10 pts — absence of high-risk transactions

        For thin-file applicants this component carries 15% weight (up from 10%)
        because account behaviour is one of the strongest available signals
        when credit history is absent.
        """
        score = 0.0

        # 1. Account age (40 pts)
        age = features.get("account_age_months", 0.0)
        if age >= 24:
            score += 40.0
        elif age >= 18:
            score += 32.0
        elif age >= 12:
            score += 22.0
        elif age >= 6:
            score += 12.0
        else:
            score += 5.0

        # 2. Overdraft and bounce discipline (30 pts)
        overdrafts = features.get("overdraft_count", 0)
        bounced    = features.get("bounced_payment_count", 0)
        penalty    = (overdrafts * 3) + (bounced * 5)
        score     += max(0.0, 30.0 - penalty)

        # 3. Minimum balance maintenance (20 pts)
        # Fewer days with near-zero balance = better buffer discipline
        days_low = features.get("days_below_1000_ngn", 0)
        if days_low == 0:
            score += 20.0
        elif days_low <= 3:
            score += 14.0
        elif days_low <= 7:
            score += 8.0
        elif days_low <= 14:
            score += 3.0
        else:
            score += 0.0

        # 4. High-risk transactions (10 pts)
        high_risk = features.get("high_risk_transaction_count", 0)
        if high_risk == 0:
            score += 10.0
        elif high_risk <= 3:
            score += 5.0
        else:
            score += 0.0

        return min(score, 100.0)

    # ─── Shared helper ────────────────────────────────────────────────────────

    def _amortize(self, principal: float, months: int, annual_rate_pct: float) -> float:
        """
        Standard amortising loan monthly payment.
        P × [r(1+r)^n] / [(1+r)^n - 1]  where r = monthly rate.
        Handles 0% interest as a simple equal-instalment case.
        """
        if months <= 0:
            return principal
        if annual_rate_pct == 0:
            return principal / months
        r = (annual_rate_pct / 100.0) / 12.0
        return principal * (r * (1 + r) ** months) / ((1 + r) ** months - 1)
