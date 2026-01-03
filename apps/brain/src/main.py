from fastapi import FastAPI

app = FastAPI(title="Mono Risk Brain", version="1.0.0")

@app.get("/")
def read_root():
    return {
        "service": "brain",
        "status": "running",
        "description": "FastAPI scoring engine"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/score")
def score_application(data: dict):
    """
    Placeholder for credit scoring logic
    """
    return {
        "score": 750,
        "decision": "approved",
        "confidence": 0.85
    }