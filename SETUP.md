# FinArivu Setup Guide

## Backend

### Requirements

- Python 3.11+
- PostgreSQL 15+
- Node.js 20+ (for frontend)

### 1. Create virtual environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/finarivu
SECRET_KEY=...
AES_KEY=...
AES_KEY_SALT=...
GEMINI_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
AI_COPILOT_PROVIDER=gemini
```

### 3. Initialise database

```powershell
alembic upgrade head
```

### 4. Run backend

```powershell
python -m uvicorn main:app --reload
# or
uvicorn main:app --reload
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

```powershell
cd frontend
npm install
npx expo start
```

## Run tests

```powershell
cd backend
pytest
```
