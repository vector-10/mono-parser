import logging
from typing import Dict
from datetime import datetime

from app.features import FeatureExtractor
from app.scoring import CreditScorer
from app.decision import DecisionEngine
from app.models import AnalyzeRequest, AnalyzeResponse, ScoreBreakdown, DecisionResult, EligibleTenor


logger = logging.getLogger(__name__)

class AnalysisEngine:
    
    @staticmethod
    def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
        logger.info(f"Starting analysis for applicant: {request.applicant_id}")
        logger.info(f"Loan amount: {request.loan_amount}, Tenor: {request.tenor_months} months")
        
        mono_data = {
            'account_details': request.account_details,
            'balance': request.balance,
            'transactions': request.transactions,
            'income_records': request.income_records,
            'credits': request.credits,
            'debits': request.debits,
            'identity': request.identity
        }
        
        logger.info("Step 1: Extracting features from Mono data...")
        extractor = FeatureExtractor(mono_data)
        features = extractor.extract_all_features()
        
        logger.info(f"Features extracted: {list(features.keys())}")
        logger.info(f"Safe monthly income: {features.get('net_monthly_surplus', 0):,.2f}")
        logger.info(f"Average monthly credits: {features.get('avg_monthly_credits', 0):,.2f}")
        logger.info(f"Net flow: {features.get('net_flow', 0):,.2f}")
        
        logger.info("Step 2: Calculating credit score...")
        scorer = CreditScorer(features, request.loan_amount, request.tenor_months)
        score_breakdown = scorer.calculate_score()
        
        logger.info(f"Score calculated: {score_breakdown['total']}/1000")
        logger.info(f"Breakdown - Income: {score_breakdown['income_stability']}, "
                   f"Cashflow: {score_breakdown['cash_flow_health']}, "
                   f"DSC: {score_breakdown['debt_service_capacity']}, "
                   f"Spending: {score_breakdown['spending_behavior']}, "
                   f"Account: {score_breakdown['account_health']}")
        
        logger.info("Step 3: Running decision engine...")
        decision_engine = DecisionEngine(
            score_breakdown['total'],
            features,
            request.loan_amount,
            request.tenor_months
        )
        decision_result = decision_engine.make_decision()
        
        logger.info(f"Decision: {decision_result['decision']}")
        logger.info(f"Requested status: {decision_result['requested_status']}")
        logger.info(f"Max monthly repayment: {decision_result['max_monthly_repayment']:,.2f}")
        
        if decision_result['recommended_amount']:
            logger.info(f"Recommended amount: {decision_result['recommended_amount']:,.2f}")
        if decision_result['recommended_tenor']:
            logger.info(f"Recommended tenor: {decision_result['recommended_tenor']} months")
        
        logger.info(f"Reasons: {decision_result['reasons']}")
        
        response = AnalyzeResponse(
            applicant_id=request.applicant_id,
            score=score_breakdown['total'],
            score_breakdown=ScoreBreakdown(**score_breakdown),
            decision=DecisionResult(
                decision=decision_result['decision'],
                max_monthly_repayment=decision_result['max_monthly_repayment'],
                safe_monthly_income=decision_result['safe_monthly_income'],
                eligible_tenors=[
                    EligibleTenor(**tenor) for tenor in decision_result['eligible_tenors']
                ],
                requested_status=decision_result['requested_status'],
                recommended_amount=decision_result.get('recommended_amount'),
                recommended_tenor=decision_result.get('recommended_tenor'),
                reasons=decision_result['reasons']
            ),
            timestamp=datetime.utcnow().isoformat()
        )
        
        logger.info(f"Analysis completed successfully for applicant: {request.applicant_id}")
        logger.info(f"Final decision: {response.decision.decision}")
        
        return response