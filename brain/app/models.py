from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class MonoTransaction(BaseModel):
    id: str
    amount: float
    type: str
    date: str
    narration: str
    balance: float
    currency: str

class MonoIncomeStream(BaseModel):
    income_type: str
    stability: float
    monthly_average: float
    frequency: str
    last_income_amount: float

class MonoCreditDebits(BaseModel):
    total:float
    history: List[Dict[str, Any]]

class MonoAccountDetails(BaseModel):
    balance: float
    account_number: str
    currency: str
    type: str
    bvn: Optional[str] = None

class AnalyzeRequest(BaseModel):
    applicant_id: str
    loan_amount: float
    tenor_months: int
    interest_rate: float  
    purpose: Optional[str] = None
    account_details: Dict
    balance: float
    transactions: List[Dict]
    income_records: Dict
    credits: Dict
    debits: Dict
    identity: Optional[Dict] = None

class ScoreBreakdown(BaseModel):
    income_stability: float
    cash_flow_health: float
    debt_service_capacity: float
    spending_behavior: float
    account_health: float
    total: int


class EligibleTenor(BaseModel):
    tenor: int
    max_amount: float


class DecisionResult(BaseModel):
    decision: str
    max_monthly_repayment: float
    safe_monthly_income: float
    eligible_tenors: List[EligibleTenor]
    requested_status: str
    recommended_amount: Optional[float] = None
    recommended_tenor: Optional[int] = None
    reasons: List[str]


class AnalyzeResponse(BaseModel):
    applicant_id: str
    score: int
    score_breakdown: ScoreBreakdown
    decision: DecisionResult
    timestamp: str
