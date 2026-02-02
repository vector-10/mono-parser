from typing import Dict, List
import statistics


class FeatureExtractor:
    def __init__(self, accounts_data: List[Dict]):
        self.accounts = accounts_data
        self.aggregated_data = self._aggregate_accounts()
        
        self.credits_data = self.aggregated_data.get('credits', {}).get('data', {})
        self.debits_data = self.aggregated_data.get('debits', {}).get('data', {})
        self.income_data = self.aggregated_data.get('income_records', {}).get('data', [])
        self.transactions = self.aggregated_data.get('transactions', [])
        
    def _aggregate_accounts(self) -> Dict:
        """
        Combine data from multiple accounts into one unified dataset
        """
        if not self.accounts:
            return {}
        
        total_balance = sum(acc.get('balance', 0) for acc in self.accounts)
        
        all_transactions = []
        for acc in self.accounts:
            all_transactions.extend(acc.get('transactions', []))
        all_transactions.sort(key=lambda x: x.get('date', ''))
        

        aggregated_credits = self._aggregate_credits_debits('credits')
        
        aggregated_debits = self._aggregate_credits_debits('debits')
        
        aggregated_income = self._aggregate_income()
        
        identity = self.accounts[0].get('identity') if self.accounts else None
        
        return {
            'balance': total_balance,
            'transactions': all_transactions,
            'credits': aggregated_credits,
            'debits': aggregated_debits,
            'income_records': aggregated_income,
            'identity': identity
        }
    
    def _aggregate_credits_debits(self, data_type: str) -> Dict:
        """
        Sum credits or debits across all accounts
        """
        total_amount = 0
        merged_history = {}
        
        for acc in self.accounts:
            data = acc.get(data_type, {}).get('data', {})
            total_amount += data.get('total', 0)
            
            history = data.get('history', [])
            for entry in history:
                period = entry.get('period', 'unknown')
                amount = entry.get('amount', 0)
                
                if period in merged_history:
                    merged_history[period]['amount'] += amount
                else:
                    merged_history[period] = {'amount': amount, 'period': period}
        
        # Convert back to list
        history_list = list(merged_history.values())
        history_list.sort(key=lambda x: x.get('period', ''))
        
        return {
            'data': {
                'total': total_amount,
                'history': history_list
            }
        }
    
    def _aggregate_income(self) -> Dict:
        """
        Combine income streams from all accounts
        """
        all_streams = []
        
        for acc in self.accounts:
            income_data = acc.get('income_records', {}).get('data', [])
            if not income_data:
                continue
                
            income_record = income_data[0] if isinstance(income_data, list) else income_data
            streams = income_record.get('income_streams', [])
            all_streams.extend(streams)
        
        # Remove duplicate streams (same employer/source)
        unique_streams = {}
        for stream in all_streams:
            income_type = stream.get('income_type', 'UNKNOWN')
            # Use income_type as key for now (can be improved)
            key = income_type
            
            if key not in unique_streams:
                unique_streams[key] = stream
            else:
                # If duplicate, take the one with higher monthly_average
                if stream.get('monthly_average', 0) > unique_streams[key].get('monthly_average', 0):
                    unique_streams[key] = stream
        
        return {
            'data': [{
                'income_streams': list(unique_streams.values())
            }]
        }
    
    def extract_all_features(self) -> Dict:
        return {
            **self.extract_income_features(),
            **self.extract_cash_flow_features(),
            **self.extract_spending_features(),
            **self.extract_account_features()
        }
    
    def extract_income_features(self) -> Dict:
        if not self.income_data:
            return {
                'total_monthly_income': 0,
                'stable_income': 0,
                'stable_ratio': 0,
                'num_income_streams': 0,
                'avg_stability': 0
            }
        
        income_record = self.income_data[0] if isinstance(self.income_data, list) else self.income_data
        streams = income_record.get('income_streams', [])
        
        total_income = sum(s.get('monthly_average', 0) for s in streams)
        stable_income = sum(
            s.get('monthly_average', 0) 
            for s in streams 
            if s.get('income_type') == 'SALARY'
        )
        
        stable_ratio = stable_income / total_income if total_income > 0 else 0
        num_streams = len(streams)
        avg_stability = statistics.mean([s.get('stability', 0) for s in streams]) if streams else 0
        
        return {
            'total_monthly_income': total_income,
            'stable_income': stable_income,
            'stable_ratio': stable_ratio,
            'num_income_streams': num_streams,
            'avg_stability': avg_stability
        }
    
    def extract_cash_flow_features(self) -> Dict:
        total_credits = self.credits_data.get('total', 0)
        total_debits = self.debits_data.get('total', 0)
        
        credits_history = self.credits_data.get('history', [])
        debits_history = self.debits_data.get('history', [])
        
        net_flow = total_credits - total_debits
        surplus_ratio = net_flow / total_credits if total_credits > 0 else 0
        
        months_positive = 0
        for i in range(len(credits_history)):
            credit_month = credits_history[i].get('amount', 0)
            debit_month = debits_history[i].get('amount', 0) if i < len(debits_history) else 0
            if credit_month > debit_month:
                months_positive += 1
        
        total_months = len(credits_history) if credits_history else 1
        positive_ratio = months_positive / total_months
        
        avg_monthly_credits = total_credits / total_months
        avg_monthly_debits = total_debits / total_months
        net_monthly_surplus = avg_monthly_credits - avg_monthly_debits
        
        return {
            'total_credits': total_credits,
            'total_debits': total_debits,
            'net_flow': net_flow,
            'surplus_ratio': surplus_ratio,
            'months_positive': months_positive,
            'total_months': total_months,
            'positive_ratio': positive_ratio,
            'avg_monthly_credits': avg_monthly_credits,
            'avg_monthly_debits': avg_monthly_debits,
            'net_monthly_surplus': net_monthly_surplus
        }
    
    def extract_spending_features(self) -> Dict:
        debits_history = self.debits_data.get('history', [])
        
        if len(debits_history) < 2:
            return {
                'spending_volatility': 0,
                'overdraft_count': 0
            }
        
        monthly_debits = [month.get('amount', 0) for month in debits_history]
        avg_debits = statistics.mean(monthly_debits)
        std_debits = statistics.stdev(monthly_debits) if len(monthly_debits) > 1 else 0
        
        spending_volatility = std_debits / avg_debits if avg_debits > 0 else 0
        
        overdraft_count = sum(1 for txn in self.transactions if txn.get('balance', 0) < 0)
        
        return {
            'spending_volatility': spending_volatility,
            'overdraft_count': overdraft_count
        }
    
    def extract_account_features(self) -> Dict:
        current_balance = self.aggregated_data.get('balance', 0)  # Changed from self.data
        avg_monthly_debits = self.extract_cash_flow_features()['avg_monthly_debits']
        
        balance_coverage = current_balance / avg_monthly_debits if avg_monthly_debits > 0 else 0
        
        credits_history = self.credits_data.get('history', [])
        account_age_months = len(credits_history)
        
        bounced_payments = sum(
            1 for txn in self.transactions 
            if 'insufficient' in txn.get('narration', '').lower() or 
               'bounced' in txn.get('narration', '').lower()
        )
        
        return {
            'current_balance': current_balance,
            'balance_coverage': balance_coverage,
            'account_age_months': account_age_months,
            'bounced_payments': bounced_payments
        }