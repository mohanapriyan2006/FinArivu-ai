# FinArivu AI Architecture

## Data flow

```
React Native
    ↓
FastAPI /api/v1/copilot/*
    ↓
AIController
    ↓
Guardrail / Intent Classifier / Context Builder
    ↓
Planner (ExecutionPlan)
    ↓
Agent Orchestrator
    ↓
Financial Tools / Agents
    ↓
Financial Engines
    ↓
AI Providers (Gemini / Groq / OpenRouter)
    ↓
Response Builder / Artifact Builder
    ↓
React Native
```

## Backend layers

| Folder | Responsibility |
|--------|----------------|
| `app/ai` | AI Copilot orchestration, agents, providers, prompts, guardrails |
| `app/financial` | Deterministic financial engines and tools |
| `app/engines` | Core calculation modules reused by `app/financial` |
| `app/models` | SQLAlchemy database models |
| `app/repositories` | Data access layer |
| `app/services` | Business services |
| `app/routers` / `app/api` | HTTP endpoints |

## Key components

- **AIController** — single entry point for the chat pipeline
- **AgentRegistry** — maps intents to specialist agents
- **Orchestrator** — executes agents in parallel/sequence with retries
- **ResponseBuilder** — merges agent outputs and explains them
- **ArtifactBuilder** — converts engine outputs into JSON UI artifacts
- **ProviderRouter** — selects and falls back between AI providers
- **ConversationMemory** / **SessionMemory** — persistence and state
- **GuardrailService** / **ResponseValidator** — safety and PII handling

## Frontend layers

| Folder | Responsibility |
|--------|----------------|
| `src/screens/chatbot` | Chat UI and conversation state |
| `src/components/chatbot` | Reusable message, card, and chip components |
| `src/services` | API client (`ChatService.ts`) |
