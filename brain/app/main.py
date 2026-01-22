from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
import traceback

from app.models import AnalyzeRequest, AnalyzeResponse
from app.engine import AnalysisEngine


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mono-Parser Brain API",
    description="Credit scoring and decision engine",
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
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_applicant(request: AnalyzeRequest):
    try:
        response = AnalysisEngine.analyze(request)
        return response
        
    except ValueError as e:
        logger.error(f"Validation error for applicant {request.applicant_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Invalid input data: {str(e)}")
    
    except ZeroDivisionError as e:
        logger.error(f"Math error for applicant {request.applicant_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Calculation error occurred")
    
    except Exception as e:
        logger.error(f"Unexpected error for applicant {request.applicant_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )