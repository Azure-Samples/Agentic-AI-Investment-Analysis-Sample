# syntax=docker/dockerfile:1
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1


WORKDIR /api-app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY api-app/requirements.txt ./requirements.txt

# Install deps
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY api-app/app ./app
COPY api-app/main.py ./main.py

# Default port
ENV PORT=8090
EXPOSE 8090

# Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8090"]
