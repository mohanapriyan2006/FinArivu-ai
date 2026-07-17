# FinArivu AI Backend

Production-grade FastAPI backend for FinArivu AI, an AI Personal CFO for Indian salaried professionals.

## Tech Stack

- Python 3.13+
- FastAPI
- SQLAlchemy 2 Async ORM + Alembic
- PostgreSQL
- Pydantic v2
- Clerk JWT Authentication
- OpenAI (chatbot only)

## Local Setup

1. Install Python 3.13+.
2. Create a virtual environment and activate it.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and fill in secrets.
5. Start PostgreSQL and create the database.
6. Run migrations:

```bash
alembic upgrade head
```

7. Seed master data:

```bash
python -m app.seed.cli
```

8. Start the server:

```bash
uvicorn main:app --reload
```

## Testing

```bash
pytest
```

## API Documentation

The backend exposes an OpenAPI-compatible REST API. Once the server is running:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`
- **Static OpenAPI spec**: [`docs/openapi.json`](docs/openapi.json)

Authentication endpoints and most user-facing routes require a valid Clerk JWT in the `Authorization: Bearer <token>` header.

## Architecture & ER Diagrams

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — high-level system architecture and design principles
- [`docs/ER.md`](docs/ER.md) — entity-relationship diagram of the domain model

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # FastAPI routers
│   ├── services/        # Business logic and orchestration
│   ├── repositories/    # Data access layer
│   ├── engines/         # Pure financial calculations
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic request/response DTOs
│   ├── core/            # Config, DB, security, encryption, cache, logging
│   ├── middleware/      # Audit, rate limiting, security headers
│   ├── exceptions/      # Custom exceptions and handlers
│   └── seed/            # Master data seeding
├── tests/               # pytest-asyncio test suite
├── alembic/             # Database migrations
└── docs/                # Architecture and ER documentation
```

See `reference/prompts/FULL-backend.md` for the full architecture specification.
