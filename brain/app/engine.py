import logging
from datetime import datetime

from app.models import (
    AnalyzeRequest, AnalyzeResponse, ScoreBreakdown, RiskFactor,
    Explainability, RegulatoryCompliance,
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

    All four sub-engines are instantiated once at class level so they are shared
    across requests (stateless singletons). This avoids per-request construction
    overhead and makes dependency injection straightforward for testing.
    """

    _knockout  = KnockoutEngine()
    _extractor = FeatureExtractor()
    _scorer    = CreditScorer()
    _decision  = DecisionEngine()

    @classmethod
    def analyze(cls, request: AnalyzeRequest) -> AnalyzeResponse:
        """
        Run the full pipeline for one applicant.

        Parameters
        ----------
        request : AnalyzeRequest
            The full data bundle sent by the NestJS gateway — applicant identity,
            loan parameters, all linked bank accounts (with sync and async enrichments),
            and the credit bureau history.

        Returns
        -------
        AnalyzeResponse
            A complete decision including score, breakdown, risk factors,
            approval/counter-offer details, eligible tenor table, explainability,
            and regulatory compliance flags.
        """
        logger.info(
            f"[PIPELINE START] applicant={request.applicant_id} "
            f"loan=₦{request.loan_amount:,.0f} tenor={request.tenor_months}m "
            f"rate={request.interest_rate}% accounts={len(request.accounts)}"
        )

        # ── Stage 1: Knockout rules ───────────────────────────────────────────
        # Cheap, order-sensitive hard stops. If any fires we reject immediately
        # and skip all expensive computation below.
        ko_result = cls._knockout.run(request)
        if ko_result.knocked_out:
            logger.warning(
                f"[KNOCKOUT] applicant={request.applicant_id} "
                f"reason={ko_result.reason}"
            )
            return cls._build_knockout_response(request, ko_result.reason, ko_result.detail)

        # ── Stage 2: Feature extraction ───────────────────────────────────────
        # Pulls signals from every available data source: transactions, income
        # webhook, statement insights job, and credit bureau history.
        # Fallbacks ensure we never crash on missing data.
        features = cls._extractor.extract(request)
        logger.info(
            f"[FEATURES] applicant={request.applicant_id} "
            f"income=₦{features.get('total_monthly_income', 0):,.0f} "
            f"thin_file={features.get('is_thin_file')} "
            f"source={features.get('income_source', 'unknown')}"
        )

        # ── Stage 3: Scoring ──────────────────────────────────────────────────
        # 350–850 FICO-aligned score. Weights differ for thin-file applicants —
        # credit history is zeroed and the 30% is redistributed to the other four
        # components that CAN be computed from bank statement data alone.
        score, score_breakdown = cls._scorer.calculate(
            features,
            request.loan_amount,
            request.tenor_months,
            request.interest_rate,
        )
        logger.info(
            f"[SCORE] applicant={request.applicant_id} score={score} "
            f"breakdown={score_breakdown}"
        )

        # ── Stages 4 & 5: Decision + manual review ────────────────────────────
        # DecisionEngine applies affordability caps, thin-file limits, and
        # manual-review triggers, then assembles the final AnalyzeResponse.
        response = cls._decision.decide(request, features, score, score_breakdown)
        logger.info(
            f"[DECISION] applicant={request.applicant_id} "
            f"decision={response.decision} score_band={response.score_band} "
            f"manual_triggers={len(response.manual_review_reasons)}"
        )

        return response

    # ─── Internal helpers ─────────────────────────────────────────────────────

    @classmethod
    def _build_knockout_response(
        cls,
        request: AnalyzeRequest,
        reason: str,
        detail: str,
    ) -> AnalyzeResponse:
        """
        Build a minimal AnalyzeResponse when Stage 1 fires.

        Score is set to the baseline (350) because no meaningful scoring has
        been performed. The breakdown is all zeros for the same reason.

        We still populate regulatory_compliance from the request so the caller
        can see which checks were possible before the knock-out fired.
        """
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
                # Identity is considered verified only if at least one account
                # provided Mono identity data (even if the name/BVN check failed —
                # that failure is what triggered the knockout).
                identity_verified=any(a.identity is not None for a in request.accounts),
                credit_bureau_checked=request.credit_history is not None,
                affordability_assessed=False,   # Never reached scoring
                thin_file=False,                # Never reached feature extraction
            ),
            explainability=Explainability(
                primary_reason=detail or reason,
                key_strengths=[],
                key_weaknesses=[detail or reason],
            ),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
