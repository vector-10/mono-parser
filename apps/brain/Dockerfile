FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY apps/brain/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY apps/brain/src ./src

# Expose port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]