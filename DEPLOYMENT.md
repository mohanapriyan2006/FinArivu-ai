# FinArivu Deployment Guide

## Minimal production stack

This project intentionally avoids Redis, Docker, Celery, Kafka, RabbitMQ, Elasticsearch, Kubernetes, and vector databases.

### Backend

- Use a **VPS / cloud VM** with Python 3.11+, PostgreSQL, and a reverse proxy.
- Run with **Uvicorn** + **Gunicorn**:
  ```bash
  gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
  ```
- Keep `DATABASE_URL` on a managed PostgreSQL service.
- Store API keys as environment variables only.

### Frontend

- Build with **Expo EAS** or `expo build`.
- Point the API base URL to the production backend.

### Monitoring

- Use the `/api/v1/copilot/health` endpoint for provider + DB health.
- Use `/api/v1/copilot/metrics` for lightweight in-memory metrics.
- Logs are written via the backend logger at `app/core/logger.py`.

### Scaling notes

- Current `SessionMemory` and `MemoryCache` are in-process.
- For multi-process deployments these would need to become PostgreSQL-backed.
- Provider routing, fallback, and retries work for a single deployment.
