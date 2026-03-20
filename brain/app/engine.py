import logging
import time
from datetime import datetime

from app.models import (
    AnalyzeRequest, AnalyzeResponse, ScoreBreakdown, RiskFactor,
    Explainability, RegulatoryCompliance, RiskPolicy,
)
from app.knockout import KnockoutEngine
from app.features import FeatureExtractor
from app.scoring import CreditScorer
from app.decision import DecisionEngine


logger = logging.getLogger(__name__)


class AnalysisEngine:
    """
    Top-level orchestrator: runs the 5-stage credit analysis pipeline.

    Stage 1 — Knockout:   Hard-stop rules checked before any scoring.
    Stage 2 — Features:   Extract ~30 normalised signals from all Mono data.
    Stage 3 — Scoring:    Compute a 350–850 score across 5 weighted components.
    Stage 4 — Decision:   Affordability check, thin-file caps, approve/reject/counter.
    Stage 5 — Review:     Flag borderline cases and conflicting signals for humans.

    Stages 4 and 5 are co-located inside DecisionEngine.decide() — they share the
    same data and are executed atomically so the review triggers can see the
    tentative decision before it is finalised.
    """

    _knockout  = KnockoutEngine()
    _extractor = FeatureExtractor()
    _scorer    = CreditScorer()
    _decision  = DecisionEngine()

    @classmethod
    def analyze(cls, request: AnalyzeRequest) -> AnalyzeResponse:
        t0 = time.perf_counter()

        logger.info(
            f"[PIPELINE START] applicant={request.applicant_id} "
            f"loan=₦{request.loan_amount:,.0f} tenor={request.tenor_months}m "
            f"rate={request.interest_rate}% accounts={len(request.accounts)}"
        )

        policy = request.risk_policy or RiskPolicy()

        ko_result = cls._knockout.run(request, policy)
        if ko_result.knocked_out:
            duration_ms = (time.perf_counter() - t0) * 1000
            logger.warning(
                f"[PIPELINE END] applicant={request.applicant_id} "
                f"outcome=KNOCKOUT reason={ko_result.reason} "
                f"duration_ms={duration_ms:.1f}"
            )
            return cls._build_knockout_response(request, ko_result.reason, ko_result.detail)

        features = cls._extractor.extract(request)

        score, score_breakdown = cls._scorer.calculate(
            features,
            request.loan_amount,
            request.tenor_months,
            request.interest_rate,
        )

        response = cls._decision.decide(request, features, score, score_breakdown, policy)

        duration_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            f"[PIPELINE END] applicant={request.applicant_id} "
            f"decision={response.decision} score={response.score} "
            f"band={response.score_band} "
            f"manual_triggers={len(response.manual_review_reasons)} "
            f"duration_ms={duration_ms:.1f}"
        )

        return response

    @classmethod
    def _build_knockout_response(
        cls,
        request: AnalyzeRequest,
        reason: str,
        detail: str,
    ) -> AnalyzeResponse:
        return AnalyzeResponse(
            applicant_id=request.applicant_id,
            decision="REJECTED",
            score=350,
            score_band="VERY_HIGH_RISK",
            score_breakdown=ScoreBreakdown(
                credit_history=0.0,
                income_stability=0.0,
                cash_flow_health=0.0,
                debt_service_capacity=0.0,
                account_behavior=0.0,
                total=350,
            ),
            risk_factors=[
                RiskFactor(
                    factor=reason,
                    severity="HIGH",
                    detail=detail or reason,
                )
            ],
            approval_details=None,
            counter_offer=None,
            eligible_tenors=[],
            manual_review_reasons=[],
            regulatory_compliance=RegulatoryCompliance(
                identity_verified=any(a.identity is not None for a in request.accounts),
                credit_bureau_checked=request.credit_history is not None,
                affordability_assessed=False,
                thin_file=False,
            ),
            explainability=Explainability(
                primary_reason=detail or reason,
                key_strengths=[],
                key_weaknesses=[detail or reason],
            ),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
