# FinArivu AI — Personal CFO

FinArivu AI is a React Native + FastAPI application that acts as an AI Personal CFO for Indian salaried professionals.

## What it does

- **Natural language chat** with an AI Copilot
- **Multi-agent financial analysis**: budget, health, goals, retirement, tax, net worth, cash flow, reports
- **Deterministic Python engines** for all financial calculations
- **Educational, explainable AI** responses — no buy/sell advice
- **React Native frontend** with rich financial artifacts and charts

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native + TypeScript |
| Backend | FastAPI + Python |
| Database | PostgreSQL + SQLAlchemy |
| AI | Multi-provider (Gemini, Groq, OpenRouter) |
| Orchestration | Multi-Agent / LangGraph-style async flow |

## Repository layout

```
backend/   FastAPI + AI Copilot + Financial Intelligence Layer
frontend/  React Native mobile application
reference/ Prompts and planning documents
```

## Quick start

See [SETUP.md](SETUP.md) for full installation and run instructions.

## API documentation

See [API.md](API.md) for the `/api/v1/copilot/*` endpoints.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system design and data flow.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guidance.

## License

This is a final-year project / MVP and is provided as-is for educational purposes.
