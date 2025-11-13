FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy requirements and install Python dependencies with uv
COPY api/requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# Copy application code
COPY api/ .

# Copy engine module
COPY engine/ /app/engine/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
