from typing import Dict


class CreditScorer:
    def __init__(self, features: Dict, loan_amount: float, tenor_months: int):
        self.features = features
        self.loan_amount = loan_amount
        self.tenor_months = tenor_months
    
    def calculate_score(self) -> Dict:
        income_score = self._score_income_stability()
        cashflow_score = self._score_cash_flow_health()
        dsc_score = self._score_debt_service_capacity()
        spending_score = self._score_spending_behavior()
        account_score = self._score_account_health()
        
        weighted_income = income_score * 0.25
        weighted_cashflow = cashflow_score * 0.30
        weighted_dsc = dsc_score * 0.20
        weighted_spending = spending_score * 0.15
        weighted_account = account_score * 0.10
        
        total_score = (
            weighted_income + 
            weighted_cashflow + 
            weighted_dsc + 
            weighted_spending + 
            weighted_account
        )
        
        final_score = int(total_score * 10)
        final_score = self._apply_penalties(final_score)
        final_score = max(0, min(1000, final_score))
        
        return {
            'income_stability': round(weighted_income * 10, 2),
            'cash_flow_health': round(weighted_cashflow * 10, 2),
            'debt_service_capacity': round(weighted_dsc * 10, 2),
            'spending_behavior': round(weighted_spending * 10, 2),
            'account_health': round(weighted_account * 10, 2),
            'total': final_score
        }
    
    def _score_income_stability(self) -> float:
        stable_ratio = self.features.get('stable_ratio', 0)
        num_streams = min(self.features.get('num_income_streams', 0), 3)
        avg_stability = self.features.get('avg_stability', 0)
        
        score = (
            (stable_ratio * 60) +
            (num_streams * 10) +
            (avg_stability * 20)
        )
        
        return min(100, score)
    
    def _score_cash_flow_health(self) -> float:
        surplus_ratio = self.features.get('surplus_ratio', 0)
        positive_ratio = self.features.get('positive_ratio', 0)
        
        surplus_points = min(surplus_ratio * 100, 40)
        consistency_points = positive_ratio * 30
        
        balance_trend_points = 30 if surplus_ratio > 0.10 else 15
        
        score = surplus_points + consistency_points + balance_trend_points
        
        return min(100, score)
    
    def _score_debt_service_capacity(self) -> float:
        safe_monthly_income = min(
            self.features.get('avg_monthly_credits', 0),
            self.features.get('net_monthly_surplus', 0)
        )
        
        if safe_monthly_income <= 0:
            return 0
        
        monthly_payment = self.loan_amount / self.tenor_months
        dti_ratio = monthly_payment / safe_monthly_income
        
        if dti_ratio < 0.30:
            return 100
        elif dti_ratio < 0.40:
            return 70
        elif dti_ratio < 0.50:
            return 40
        else:
            return 0
    
    def _score_spending_behavior(self) -> float:
        spending_volatility = self.features.get('spending_volatility', 0)
        overdraft_count = self.features.get('overdraft_count', 0)
        
        volatility_points = max(0, 50 - (spending_volatility * 100))
        overdraft_points = max(0, 50 - (overdraft_count * 10))
        
        score = volatility_points + overdraft_points
        
        return min(100, score)
    
    def _score_account_health(self) -> float:
        balance_coverage = self.features.get('balance_coverage', 0)
        account_age = self.features.get('account_age_months', 0)
        bounced_payments = self.features.get('bounced_payments', 0)
        
        coverage_points = min(balance_coverage * 25, 50)
        age_points = min(account_age * 5, 25)
        clean_record_points = 25 if bounced_payments == 0 else 0
        
        score = coverage_points + age_points + clean_record_points
        
        return min(100, score)
    
    def _apply_penalties(self, score: int) -> int:
        if self.features.get('bounced_payments', 0) > 2:
            score -= 100
        
        if self.features.get('overdraft_count', 0) > 5:
            score -= 50
        
        return score