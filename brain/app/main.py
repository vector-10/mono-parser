from fastapi import FastAPI

app = FastAPI(title="Mono Parser Brain")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "brain"}


@app.post("/analyze")
def analyze_applicant(data: dict):
    return {
        "score": "750",
        "decision": "approved",
        "narrative":"Mock response - before algorithm is ready"

    }