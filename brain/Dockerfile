FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first
COPY pyproject.toml uv.lock README.md ./
COPY src ./src

# Install dependencies WITHOUT installing the project itself
RUN uv sync --frozen --no-cache --python-preference=only-system

# Copy rest of the code
COPY . .

EXPOSE 8000

# Use uvicorn directly instead of fastapi CLI
CMD ["/app/.venv/bin/uvicorn", "brain.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]