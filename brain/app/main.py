from fastapi import FastAPI

app = FastAPI(title="Mono-parser brain API")

@app.get("/")
def read_root():
    return { "message": "brain service is running"}

@app.get("/health")
def health_check():
    return { "status": "healthy"}