from typing import Dict, List, Optional, Any
from datetime import datetime, date
from collections import defaultdict
import statistics
import logging

from app.models import AnalyzeRequest, MonoIncomeData

logger = logging.getLogger(__name__)

# Narration keywords that flag high-risk behaviour
GAMBLING_KEYWORDS = ("bet", "betway", "sporty", "sportpesa", "nairabet",
                     "lotto", "stake", "casino", "1xbet", "22bet", "winning")
LOANAPP_KEYWORDS  = ("carbon", "fairmoney", "branch", "palmcredit", "aella",
                     "quickcheck", "migo", "okash", "lcredit", "renmoney")
SALARY_KEYWORDS   = ("salary", "payroll", "wages", "stipend", "allowance",
                     "monthly pay", "staff pay")


class FeatureExtractor:
    """
    Stage 2: Transform all raw Mono data into a flat, normalised feature dictionary.

    Design principles:
    1. Never crash on missing data. Every extractor returns conservative defaults.
    2. Prefer Mono's pre-computed signals (income webhook, insights job) over
       our own re-computation — Mono's ML is more accurate than our heuristics.
    3. Fall back to transaction-level computation when enrichments are absent.
    4. Amounts are in NGN as returned by Mono (integer kobo values like 505729).

    Features produced (~30):
      Income:         total_monthly_income, salary_income, stable_income_ratio,
                      income_stream_count, avg_income_stability, income_recency_days,
                      income_is_growing, income_regular_ratio, income_source
      Cash flow:      monthly_avg_credits, monthly_avg_debits, net_monthly_surplus,
                      surplus_ratio, positive_cash_flow_ratio, debit_to_credit_ratio,
                      spending_volatility
      Credit history: payment_success_rate, open_loan_count, closed_loan_count,
                      total_loan_count, credit_age_months, has_credit_history
      Debt:           total_existing_debt, recurring_debt_monthly
      Behaviour:      overdraft_count, bounced_payment_count, high_risk_transaction_count,
                      account_age_months, min_balance_maintained, days_below_1000_ngn
      Insights:       balance_after_expense, average_balance_from_insights,
                      inflow_avg_last_12m, outflow_avg_last_12m
      Meta:           is_thin_file
    """

    def extract(self, request: AnalyzeRequest) -> Dict[str, Any]:
        all_transactions = self._aggregate_transactions(request.accounts)
        best_income      = self._best_income(request.accounts)

        features: Dict[str, Any] = {}
        features.update(self._income(request.accounts, best_income))
        features.update(self._cash_flow(all_transactions, request.accounts))
        features.update(self._credit_history(request.credit_history))
        features.update(self._debt(request.accounts, request.credit_history))
        features.update(self._account_behaviour(all_transactions, request.accounts))
        features.update(self._insights(request.accounts))
        features["is_thin_file"] = self._is_thin_file(request.credit_history)

        logger.info(
            f"Extracted {len(features)} features for applicant={request.applicant_id} "
            f"thin_file={features['is_thin_file']} income_source={features.get('income_source')}"
        )
        return features

    # ─── Aggregation helpers ──────────────────────────────────────────────────

    def _aggregate_transactions(self, accounts: list) -> List[Dict]:
        """Merge transactions from all linked accounts, newest-first."""
        all_txns = []
        for account in accounts:
            all_txns.extend(account.transactions)
        try:
            all_txns.sort(key=lambda t: t.get("date", ""), reverse=True)
        except Exception:
            pass
        return all_txns

    def _best_income(self, accounts: list) -> Optional[MonoIncomeData]:
        """Return the income object with the highest monthly_income across accounts."""
        best, best_val = None, 0.0
        for account in accounts:
            if account.income and account.income.monthly_income > best_val:
                best     = account.income
                best_val = account.income.monthly_income
        return best

    # ─── Income features ──────────────────────────────────────────────────────

    def _income(self, accounts: list, best_income: Optional[MonoIncomeData]) -> Dict:
        """
        Primary source: mono.events.account_income webhook data.
        Fallback:       transaction narration scanning + monthly credit averaging.

        The fallback is less accurate — we flag income_source="transaction_fallback"
        so the decision layer can attach a payslip verification condition.
        """
        if best_income and best_income.income_streams:
            return self._income_from_webhook(best_income)
        return self._income_from_transactions(accounts)

    def _income_from_webhook(self, income: MonoIncomeData) -> Dict:
        salary_income = sum(
            s.monthly_average for s in income.income_streams
            if s.income_type == "SALARY"
        )
        total_monthly = income.monthly_income or income.aggregated_monthly_average or 0.0

        most_recent: Optional[date] = None
        total_stability = 0.0
        for stream in income.income_streams:
            total_stability += stream.stability
            try:
                d = datetime.strptime(stream.last_income_date, "%Y-%m-%d").date()
                if most_recent is None or d > most_recent:
                    most_recent = d
            except ValueError:
                pass

        avg_stability = total_stability / len(income.income_streams) if income.income_streams else 0.0
        recency_days  = (date.today() - most_recent).days if most_recent else 999

        primary    = max(income.income_streams, key=lambda s: s.monthly_average, default=None)
        is_growing = bool(
            primary and primary.monthly_average > 0
            and primary.last_income_amount > primary.monthly_average
        )

        regular_ratio = 0.0
        if total_monthly > 0:
            regular_ratio = min(
                (income.aggregated_monthly_average_regular or 0.0) / total_monthly, 1.0
            )

        return {
            "total_monthly_income": total_monthly,
            "salary_income":        salary_income,
            "stable_income_ratio":  salary_income / total_monthly if total_monthly > 0 else 0.0,
            "income_stream_count":  income.number_of_income_streams or len(income.income_streams),
            "avg_income_stability": avg_stability,
            "income_recency_days":  recency_days,
            "income_is_growing":    is_growing,
            "income_regular_ratio": regular_ratio,
            "income_source":        "webhook",
        }

    def _income_from_transactions(self, accounts: list) -> Dict:
        """
        Fallback: estimate income from narration keywords and monthly credit averages.
        Conservative — flags income_source so decision layer can require verification.
        """
        monthly_credits: Dict[str, float] = defaultdict(float)
        salary_credits: List[Dict]        = []

        for account in accounts:
            for txn in account.transactions:
                if txn.get("type") != "credit":
                    continue
                amount    = float(txn.get("amount", 0))
                narration = txn.get("narration", "").lower()
                try:
                    dt        = datetime.fromisoformat(txn["date"].replace("Z", "+00:00"))
                    month_key = dt.strftime("%Y-%m")
                    monthly_credits[month_key] += amount
                    if any(kw in narration for kw in SALARY_KEYWORDS):
                        salary_credits.append({"amount": amount, "date": dt})
                except Exception:
                    pass

        if not monthly_credits:
            return {
                "total_monthly_income": 0.0, "salary_income":        0.0,
                "stable_income_ratio":  0.0, "income_stream_count":  0,
                "avg_income_stability": 0.0, "income_recency_days":  999,
                "income_is_growing":    False, "income_regular_ratio": 0.0,
                "income_source":        "transaction_fallback",
            }

        avg_monthly = statistics.mean(monthly_credits.values())
        avg_salary  = statistics.mean(s["amount"] for s in salary_credits) if salary_credits else 0.0

        recency_days = 999
        if salary_credits:
            latest       = max(s["date"] for s in salary_credits)
            recency_days = (datetime.now(latest.tzinfo) - latest).days

        return {
            "total_monthly_income": avg_monthly,
            "salary_income":        avg_salary,
            "stable_income_ratio":  avg_salary / avg_monthly if avg_monthly > 0 else 0.0,
            "income_stream_count":  1 if salary_credits else 0,
            "avg_income_stability": 0.5 if salary_credits else 0.0,
            "income_recency_days":  recency_days,
            "income_is_growing":    False,
            "income_regular_ratio": avg_salary / avg_monthly if avg_monthly > 0 else 0.0,
            "income_source":        "transaction_fallback",
        }

    # ─── Cash flow features ───────────────────────────────────────────────────

    def _cash_flow(self, all_transactions: List[Dict], accounts: list) -> Dict:
        """
        Monthly inflow/outflow analysis.

        spending_volatility: std(monthly_debits) / mean. High = unpredictable
        spending = repayment risk. A person who spends ₦50k one month and ₦500k
        the next cannot reliably commit to a fixed monthly repayment.

        debit_to_credit_ratio: We prefer Mono's pre-computed value from statement
        insights (computed on the full statement) over our own slice-based calculation.
        """
        monthly_credits: Dict[str, float] = defaultdict(float)
        monthly_debits:  Dict[str, float] = defaultdict(float)

        for txn in all_transactions:
            try:
                dt        = datetime.fromisoformat(txn["date"].replace("Z", "+00:00"))
                month_key = dt.strftime("%Y-%m")
                amount    = float(txn.get("amount", 0))
                if txn.get("type") == "credit":
                    monthly_credits[month_key] += amount
                elif txn.get("type") == "debit":
                    monthly_debits[month_key]  += amount
            except Exception:
                pass

        if not monthly_credits and not monthly_debits:
            return {
                "monthly_avg_credits":      0.0, "monthly_avg_debits":      0.0,
                "net_monthly_surplus":      0.0, "surplus_ratio":           0.0,
                "positive_cash_flow_ratio": 0.0, "debit_to_credit_ratio": 999.0,
                "spending_volatility":      1.0,
            }

        all_months  = set(monthly_credits) | set(monthly_debits)
        avg_credits = statistics.mean(monthly_credits.values()) if monthly_credits else 0.0
        avg_debits  = statistics.mean(monthly_debits.values())  if monthly_debits  else 0.0
        net_surplus = avg_credits - avg_debits

        months_positive = sum(
            1 for m in all_months
            if monthly_credits.get(m, 0) > monthly_debits.get(m, 0)
        )
        positive_ratio = months_positive / len(all_months) if all_months else 0.0
        dtc_ratio      = avg_debits / avg_credits if avg_credits > 0 else 999.0

        debit_vals          = list(monthly_debits.values())
        spending_volatility = 0.0
        if len(debit_vals) > 1 and avg_debits > 0:
            spending_volatility = statistics.stdev(debit_vals) / avg_debits

        # Override with Mono's pre-computed ratio if available
        for account in accounts:
            si = account.statement_insights
            if si and si.account_summary:
                raw = si.account_summary.get("debit_to_credit_ratio", "")
                try:
                    dtc_ratio = float(str(raw).split(":")[0])
                    break
                except Exception:
                    pass

        return {
            "monthly_avg_credits":      avg_credits,
            "monthly_avg_debits":       avg_debits,
            "net_monthly_surplus":      net_surplus,
            "surplus_ratio":            net_surplus / avg_credits if avg_credits > 0 else 0.0,
            "positive_cash_flow_ratio": positive_ratio,
            "debit_to_credit_ratio":    dtc_ratio,
            "spending_volatility":      spending_volatility,
        }

    # ─── Credit history features ──────────────────────────────────────────────

    def _credit_history(self, credit_history: Optional[Dict]) -> Dict:
        """
        Parse getCreditHistory bureau response.

        payment_success_rate: fraction of scheduled repayments marked "paid".
        This is the single most predictive feature in any credit model.

        None (not 0) when loans exist but repayment schedules are empty —
        the scorer treats None as neutral, not as a failure.
        """
        empty = {
            "payment_success_rate": None,
            "open_loan_count":      0,
            "closed_loan_count":    0,
            "total_loan_count":     0,
            "credit_age_months":    0.0,
            "has_credit_history":   False,
        }
        if not credit_history:
            return empty

        institutions = credit_history.get("credit_history", [])
        if not institutions:
            return empty

        total_payments = 0
        paid_payments  = 0
        open_loans     = 0
        closed_loans   = 0
        oldest_date: Optional[date] = None

        for entry in institutions:
            for loan in entry.get("history", []):
                if loan.get("loan_status", "").lower() == "open":
                    open_loans  += 1
                else:
                    closed_loans += 1
                try:
                    opened = datetime.strptime(loan["date_opened"], "%d-%m-%Y").date()
                    if oldest_date is None or opened < oldest_date:
                        oldest_date = opened
                except Exception:
                    pass
                for payment in loan.get("repayment_schedule", []):
                    total_payments += 1
                    if payment.get("status") == "paid":
                        paid_payments += 1

        psr               = paid_payments / total_payments if total_payments > 0 else None
        credit_age_months = (date.today() - oldest_date).days / 30.0 if oldest_date else 0.0
        total_loans       = open_loans + closed_loans

        return {
            "payment_success_rate": psr,
            "open_loan_count":      open_loans,
            "closed_loan_count":    closed_loans,
            "total_loan_count":     total_loans,
            "credit_age_months":    credit_age_months,
            "has_credit_history":   total_loans > 0,
        }

    # ─── Debt features ────────────────────────────────────────────────────────

    def _debt(self, accounts: list, credit_history: Optional[Dict]) -> Dict:
        """
        Total outstanding debt and monthly recurring debt obligations.

        total_existing_debt:
          Sum of opening_balance for open loans in credit_history.

        recurring_debt_monthly:
          From statement insights recurring_transactions. Recurring debits
          with loan-related narrations = existing monthly repayment burden.
          This is the key input for DTI calculation alongside the new loan payment.
        """
        total_debt = 0.0

        # Open loans from credit history
        if credit_history:
            for entry in credit_history.get("credit_history", []):
                for loan in entry.get("history", []):
                    if loan.get("loan_status", "").lower() == "open":
                        total_debt += float(loan.get("opening_balance", 0))

        # Recurring debt from statement insights
        recurring_debt_monthly = 0.0
        for account in accounts:
            si = account.statement_insights
            if not si:
                continue
            for recurring in si.recurring_transactions:
                if recurring.get("type") != "debit":
                    continue
                cat  = recurring.get("category", "").lower()
                narr = recurring.get("description", "").lower()
                is_debt = (
                    any(kw in narr for kw in ("loan", "repay", "lend", "credit"))
                    or any(kw in narr for kw in LOANAPP_KEYWORDS)
                    or "loan" in cat or "repayment" in cat
                )
                if is_debt:
                    recurring_debt_monthly += float(recurring.get("average_monthly_sum", 0))

        return {
            "total_existing_debt":    total_debt,
            "recurring_debt_monthly": recurring_debt_monthly,
        }

    # ─── Account behaviour features ───────────────────────────────────────────

    def _account_behaviour(self, all_transactions: List[Dict], accounts: list) -> Dict:
        """
        Discipline signals from raw transaction data.

        days_below_1000_ngn: proxy for "living on the edge". Someone whose
        balance regularly drops near zero cannot absorb a fixed loan repayment
        without stress.

        high_risk_transaction_count: gambling and unregulated lending apps.
        Both signal financial instability — gambling is self-evident; unregulated
        lending apps indicate the person is already borrowing from multiple sources.
        """
        overdrafts   = 0
        bounced      = 0
        high_risk    = 0
        days_low_bal = 0
        min_balance  = float("inf")

        bounce_kws = ("insufficient", "bounced", "returned", "unable to process", "failed debit")

        for txn in all_transactions:
            balance   = float(txn.get("balance", 0))
            narration = txn.get("narration", "").lower()

            if balance < 0:
                overdrafts += 1
            if balance < 1000:
                days_low_bal += 1
            if balance < min_balance:
                min_balance = balance
            if any(w in narration for w in bounce_kws):
                bounced += 1
            if any(w in narration for w in GAMBLING_KEYWORDS + LOANAPP_KEYWORDS):
                high_risk += 1

        # Account age — prefer statement insights (covers full statement period)
        account_age_months = 0.0
        for account in accounts:
            si = account.statement_insights
            if si and si.start_date:
                try:
                    start  = datetime.strptime(si.start_date, "%Y-%m-%d").date()
                    months = (date.today() - start).days / 30.0
                    account_age_months = max(account_age_months, months)
                except Exception:
                    pass

        # Fallback: estimate from oldest transaction date
        if account_age_months == 0.0 and all_transactions:
            try:
                dates = [
                    datetime.fromisoformat(t["date"].replace("Z", "+00:00"))
                    for t in all_transactions if t.get("date")
                ]
                if dates:
                    oldest = min(dates)
                    account_age_months = (datetime.now(oldest.tzinfo) - oldest).days / 30.0
            except Exception:
                pass

        return {
            "overdraft_count":             overdrafts,
            "bounced_payment_count":       bounced,
            "high_risk_transaction_count": high_risk,
            "account_age_months":          account_age_months,
            "min_balance_maintained":      min_balance if min_balance != float("inf") else 0.0,
            "days_below_1000_ngn":         days_low_bal,
        }

    # ─── Insights features ────────────────────────────────────────────────────

    def _insights(self, accounts: list) -> Dict:
        """
        Mono's pre-computed signals from the statement insights job.
        These are more accurate than our own computation because Mono runs
        them on the full bank statement, not just the transaction page we received.
        """
        balance_after_expense: Optional[float] = None
        avg_balance:           Optional[float] = None
        inflow_12m:            Optional[float] = None
        outflow_12m:           Optional[float] = None

        for account in accounts:
            si = account.statement_insights
            if not si:
                continue

            if si.balance_after_expense is not None:
                balance_after_expense = (balance_after_expense or 0.0) + si.balance_after_expense

            if si.account_summary:
                ab = si.account_summary.get("average_balance")
                if ab is not None:
                    avg_balance = float(ab)

            if si.inflow:
                try:
                    v = si.inflow["all_transaction"]["average_per_month"]["last_12_months"]
                    inflow_12m = float(v)
                except Exception:
                    pass

            if si.outflow:
                try:
                    v = si.outflow["all_transaction"]["average_per_month"]["last_12_months"]
                    outflow_12m = float(v)
                except Exception:
                    pass

        return {
            "balance_after_expense":         balance_after_expense,
            "average_balance_from_insights": avg_balance,
            "inflow_avg_last_12m":           inflow_12m,
            "outflow_avg_last_12m":          outflow_12m,
        }

    # ─── Thin-file detection ──────────────────────────────────────────────────

    def _is_thin_file(self, credit_history: Optional[Dict]) -> bool:
        """
        Thin-file: no meaningful credit bureau history (< 2 loan entries).

        Thin-file applicants scored with redistributed weights:
        Credit History 30% → 0%, redistributed to Income/Cash Flow/DSC/Account.
        This is how serious African lenders handle first-time borrowers.
        """
        if not credit_history:
            return True
        institutions = credit_history.get("credit_history", [])
        total_loans  = sum(len(inst.get("history", [])) for inst in institutions)
        return total_loans < 2
