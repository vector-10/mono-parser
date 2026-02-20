from pydantic import BaseModel
from typing import List, Dict, Optional, Any


# ─── Input: Per-stream income detail ──────────────────────────────────────────

class MonoIncomeStream(BaseModel):
    """One income source from the mono.events.account_income webhook."""
    income_type: str            # SALARY, WAGES, BUSINESS, INVESTMENT, OTHER
    frequency: str              # MONTHLY, BI_WEEKLY, WEEKLY, VARIABLE
    monthly_average: float
    average_income_amount: float
    last_income_amount: float
    last_income_date: str       # "YYYY-MM-DD"
    last_income_description: Optional[str] = None
    currency: str = "NGN"
    stability: float = 0.0      # 0-1, Mono's own stability rating
    periods_with_income: int = 0
    number_of_incomes: int = 0


class MonoIncomeData(BaseModel):
    """
    Full income payload stored from mono.events.account_income webhook.
    NestJS stores this on BankAccount.incomeData and sends it here at analysis time.
    """
    income_streams: List[MonoIncomeStream] = []
    monthly_income: float = 0
    annual_income: float = 0
    aggregated_monthly_average: float = 0
    aggregated_monthly_average_regular: float = 0
    aggregated_monthly_average_irregular: float = 0
    total_regular_income_amount: float = 0
    total_irregular_income_amount: float = 0
    total_income: float = 0
    number_of_income_streams: int = 0
    first_transaction_date: Optional[str] = None
    last_transaction_date: Optional[str] = None
    period: Optional[str] = None


class MonoStatementInsights(BaseModel):
    """
    The jobData portion of GET /enrichments/record/{jobId}.
    NestJS polls for this and stores jobData on BankAccount.statementInsights.
    """
    account: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    transaction_length: Optional[int] = None
    transaction_count: Optional[int] = None
    balance_after_expense: Optional[float] = None
    account_summary: Optional[Dict[str, Any]] = None
    activity_insights: Optional[Dict[str, Any]] = None
    transaction_details: Optional[Dict[str, Any]] = None
    inflow: Optional[Dict[str, Any]] = None
    outflow: Optional[Dict[str, Any]] = None
    recurring_transactions: List[Dict[str, Any]] = []


class AccountData(BaseModel):
    """
    Per-account data bundle sent by NestJS gateway.

    Synchronous (always present — fetched during /analyze trigger):
      - account_details: from GET /accounts/{id}
      - balance:         from GET /accounts/{id}/balance
      - transactions:    from GET /accounts/{id}/transactions
      - identity:        from GET /accounts/{id}/identity

    Async enrichments (stored on BankAccount as Mono webhooks/jobs arrive):
      - income:           from mono.events.account_income
      - creditworthiness: from mono.events.account_credit_worthiness
      - statement_insights: from GET /enrichments/record/{jobId} (statement insights job)

    NestJS waits for all enrichments before allowing /analyze to be called.
    These are Optional only as a type-safety fallback, not because they can be missing.
    """
    account_id: str
    account_details: Dict[str, Any] = {}
    balance: float = 0
    transactions: List[Dict[str, Any]] = []
    identity: Optional[Dict[str, Any]] = None

    # Async enrichments
    income: Optional[MonoIncomeData] = None
    creditworthiness: Optional[MonoCreditWorthiness] = None
    statement_insights: Optional[MonoStatementInsights] = None


class AnalyzeRequest(BaseModel):
    """
    Main request from NestJS gateway to the brain.

    applicant_name and applicant_bvn are what the fintech submitted at
    application initiation — used for identity cross-checking in knockout rules.

    credit_history is BVN-based (one per applicant, not per account).
    It comes from GET /v3/lookup/credit-history/{provider} and is fetched
    during the data aggregation step in NestJS.
    """
    applicant_id: str
    applicant_name: str
    applicant_bvn: str
    loan_amount: float
    tenor_months: int
    interest_rate: float        # Annual percentage rate
    purpose: Optional[str] = None
    accounts: List[AccountData]
    credit_history: Optional[Dict[str, Any]] = None


# ─── Output models ────────────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    """Component contributions to the final score (in earned points, not %)."""
    credit_history: float
    income_stability: float
    cash_flow_health: float
    debt_service_capacity: float
    account_behavior: float
    total: int


class RiskFactor(BaseModel):
    factor: str
    severity: str   # HIGH, MEDIUM, LOW
    detail: str


class ApprovalDetails(BaseModel):
    approved_amount: float
    approved_tenor: int
    monthly_payment: float
    interest_rate: float
    dti_ratio: float
    conditions: List[str] = []


class CounterOffer(BaseModel):
    offered_amount: float
    offered_tenor: int
    monthly_payment: float
    reason: str


class EligibleTenor(BaseModel):
    """What the applicant can borrow at each standard tenor given their income."""
    tenor: int
    max_amount: float
    monthly_payment: float


class Explainability(BaseModel):
    primary_reason: str
    key_strengths: List[str]
    key_weaknesses: List[str]


class RegulatoryCompliance(BaseModel):
    identity_verified: bool
    credit_bureau_checked: bool
    affordability_assessed: bool
    thin_file: bool


class AnalyzeResponse(BaseModel):
    applicant_id: str
    decision: str           # APPROVED, REJECTED, COUNTER_OFFER, MANUAL_REVIEW
    score: int              # 350-850
    score_band: str         # VERY_HIGH_RISK, HIGH_RISK, MEDIUM_RISK, LOW_RISK, VERY_LOW_RISK
    score_breakdown: ScoreBreakdown
    risk_factors: List[RiskFactor]
    approval_details: Optional[ApprovalDetails] = None
    counter_offer: Optional[CounterOffer] = None
    eligible_tenors: List[EligibleTenor] = []
    manual_review_reasons: List[str] = []
    regulatory_compliance: RegulatoryCompliance
    explainability: Explainability
    timestamp: str
