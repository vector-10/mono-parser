FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project files
COPY . /app

# Install dependencies
WORKDIR /app
RUN uv sync --frozen --no-cache

# Expose port
EXPOSE 8000

# Run with hot reload
CMD ["/app/.venv/bin/fastapi", "run", "app/main.py", "--port", "8000", "--host", "0.0.0.0", "--reload"]