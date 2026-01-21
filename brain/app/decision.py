from typing import Dict, List


class DecisionEngine:
    def __init__(self, score: int, features: Dict, loan_amount: float, tenor_months: int):
        self.score = score
        self.features = features
        self.loan_amount = loan_amount
        self.tenor_months = tenor_months
    
    def make_decision(self) -> Dict:
        reasons = []
        
        if self.score < 500:
            return {
                'decision': 'REJECTED',
                'max_monthly_repayment': 0,
                'safe_monthly_income': 0,
                'eligible_tenors': [],
                'requested_status': 'REJECTED_LOW_SCORE',
                'recommended_amount': None,
                'recommended_tenor': None,
                'reasons': ['Credit score below minimum threshold (500)']
            }
        
        net_monthly_surplus = self.features.get('net_monthly_surplus', 0)
        avg_monthly_credits = self.features.get('avg_monthly_credits', 0)
        
        safe_monthly_income = min(avg_monthly_credits, net_monthly_surplus)
        
        if safe_monthly_income <= 0:
            return {
                'decision': 'REJECTED',
                'max_monthly_repayment': 0,
                'safe_monthly_income': 0,
                'eligible_tenors': [],
                'requested_status': 'REJECTED_NO_INCOME',
                'recommended_amount': None,
                'recommended_tenor': None,
                'reasons': ['No positive monthly surplus detected']
            }
        
        max_monthly_repayment = 0.35 * safe_monthly_income
        monthly_payment = self.loan_amount / self.tenor_months
        
        account_age_months = self.features.get('account_age_months', 0)
        max_allowed_tenor = min(account_age_months, 24)
        
        if self.tenor_months > max_allowed_tenor:
            return {
                'decision': 'REJECTED',
                'max_monthly_repayment': max_monthly_repayment,
                'safe_monthly_income': safe_monthly_income,
                'eligible_tenors': self._calculate_eligible_tenors(max_monthly_repayment, max_allowed_tenor),
                'requested_status': 'REJECTED_TENOR_TOO_LONG',
                'recommended_amount': None,
                'recommended_tenor': max_allowed_tenor,
                'reasons': [f'Requested tenor ({self.tenor_months} months) exceeds maximum allowed ({max_allowed_tenor} months)']
            }
        
        current_balance = self.features.get('current_balance', 0)
        post_payment_balance = current_balance - monthly_payment
        
        if post_payment_balance < 0:
            return {
                'decision': 'REJECTED',
                'max_monthly_repayment': max_monthly_repayment,
                'safe_monthly_income': safe_monthly_income,
                'eligible_tenors': self._calculate_eligible_tenors(max_monthly_repayment, max_allowed_tenor),
                'requested_status': 'REJECTED_INSUFFICIENT_BALANCE',
                'recommended_amount': None,
                'recommended_tenor': None,
                'reasons': ['Insufficient balance to cover first payment']
            }
        
        max_loan_for_tenor = max_monthly_repayment * self.tenor_months
        
        if monthly_payment > max_monthly_repayment:
            reasons.append(f'Requested amount (₦{self.loan_amount:,.0f}) exceeds affordability')
            reasons.append(f'Maximum affordable: ₦{max_loan_for_tenor:,.0f} for {self.tenor_months} months')
            
            return {
                'decision': 'COUNTER_OFFER',
                'max_monthly_repayment': max_monthly_repayment,
                'safe_monthly_income': safe_monthly_income,
                'eligible_tenors': self._calculate_eligible_tenors(max_monthly_repayment, max_allowed_tenor),
                'requested_status': 'NOT_AFFORDABLE',
                'recommended_amount': max_loan_for_tenor,
                'recommended_tenor': self.tenor_months,
                'reasons': reasons
            }
        
        reasons.append(f'Score: {self.score}/1000')
        reasons.append(f'Monthly payment (₦{monthly_payment:,.0f}) within 35% affordability cap')
        reasons.append(f'Tenor ({self.tenor_months} months) within observed account activity')
        
        return {
            'decision': 'APPROVED',
            'max_monthly_repayment': max_monthly_repayment,
            'safe_monthly_income': safe_monthly_income,
            'eligible_tenors': self._calculate_eligible_tenors(max_monthly_repayment, max_allowed_tenor),
            'requested_status': 'APPROVED',
            'recommended_amount': self.loan_amount,
            'recommended_tenor': self.tenor_months,
            'reasons': reasons
        }
    
    def _calculate_eligible_tenors(self, max_monthly_repayment: float, max_allowed_tenor: int) -> List[Dict]:
        eligible_tenors = []
        
        for tenor in [6, 12, 18, 24]:
            if tenor > max_allowed_tenor:
                break
            
            max_amount = max_monthly_repayment * tenor
            eligible_tenors.append({
                'tenor': tenor,
                'max_amount': round(max_amount, 2)
            })
        
        return eligible_tenors