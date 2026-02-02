from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    logger.error(f"Validation error: {exc.errors()}")
    logger.error(f"Request body (first 1000 chars): {body.decode()[:1000]}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": body.decode()[:500] 
        }
    )



@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_applicant(request: AnalyzeRequest):
    try:
        body = await request.body()
        logger.info(f"Received analyze request (first 500 chars): {body.decode()[:500]}")
        
        data = AnalyzeRequest.parse_raw(body)
        logger.info(f"Successfully parsed request for applicant: {data.applicant_id}")
        logger.info(f"Number of accounts: {len(data.accounts)}")
        
        response = AnalysisEngine.analyze(data)
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