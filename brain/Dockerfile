FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy project files
COPY pyproject.toml uv.lock README.md ./
COPY src ./src

# Install dependencies into .venv
RUN uv sync --frozen --no-dev

# Copy rest
COPY . .

# Add .venv to PATH and src to PYTHONPATH
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app/src:$PYTHONPATH"

EXPOSE 8000

CMD ["uvicorn", "brain.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]