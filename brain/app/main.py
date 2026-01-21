from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
import traceback

from app.models import AnalyzeRequest, AnalyzeResponse, ScoreBreakdown, DecisionResult, EligibleTenor
from app.features import FeatureExtractor
from app.scoring import CreditScorer
from app.decision import DecisionEngine

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mono-parser brain API", 
              description="Credit scoring and decision Engine",
              version="1.0.0"
)

@app.get("/")
def read_root():
    return {
         "service": "Mono-Parser Brain",
            "status": "running",
            "version": "1.0.0"
            }

@app.get("/health")
def health_check():
    return { "status": "healthy", "timestamp": datetime.utcnow().isoformat()}