import logging
import os
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.logging_config import configure_logging
from app.models import AnalyzeRequest, AnalyzeResponse
from app.engine import AnalysisEngine


configure_logging(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mono-Parser Brain API",
    description="Credit scoring and decision engine",
    version="1.0.0",
)


@app.on_event("startup")
async def on_startup():
    logger.info("Brain service started — ready to accept requests")


@app.get("/")
def read_root():
    return {
        "service": "Mono-Parser Brain",
        "status":  "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status":    "healthy",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Log the validation errors WITHOUT the raw request body — the body can contain
    # BVN, bank account data, and other sensitive financial information.
    logger.error(
        f"Request validation failed path={request.url.path} "
        f"errors={exc.errors()}"
    )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception path={request.url.path} "
        f"error={type(exc).__name__}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error":   "Internal server error",
            "message": str(exc),
        },
    )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_applicant(request: AnalyzeRequest):
    start = time.perf_counter()

    logger.info(
        f"[REQUEST] applicant={request.applicant_id} "
        f"amount=₦{request.loan_amount:,.0f} tenor={request.tenor_months}m "
        f"rate={request.interest_rate}% accounts={len(request.accounts)}"
    )

    try:
        response = AnalysisEngine.analyze(request)

        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            f"[RESPONSE] applicant={request.applicant_id} "
            f"decision={response.decision} score={response.score} "
            f"duration_ms={duration_ms:.1f}"
        )
        return response

    except ValueError as e:
        duration_ms = (time.perf_counter() - start) * 1000
        logger.error(
            f"[ERROR] applicant={request.applicant_id} "
            f"type=validation error={e} duration_ms={duration_ms:.1f}",
            exc_info=True,
        )
        raise HTTPException(status_code=400, detail=f"Invalid input data: {e}")

    except ZeroDivisionError as e:
        duration_ms = (time.perf_counter() - start) * 1000
        logger.error(
            f"[ERROR] applicant={request.applicant_id} "
            f"type=calculation error={e} duration_ms={duration_ms:.1f}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Calculation error occurred")

    except Exception as e:
        duration_ms = (time.perf_counter() - start) * 1000
        logger.error(
            f"[ERROR] applicant={request.applicant_id} "
            f"type={type(e).__name__} error={e} duration_ms={duration_ms:.1f}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
