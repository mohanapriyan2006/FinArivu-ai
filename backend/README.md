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

## Project Structure

See `reference/prompts/FULL-backend.md` for the full architecture specification.
