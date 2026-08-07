Continue from the previously implemented AI Core.

Do not rebuild existing modules.

Implement the complete Multi-Agent system.

==================================================
OBJECTIVE
==================================================

Architecture

Execution Plan

↓

Agent Registry

↓

Orchestrator

↓

Parallel Agents

↓

Merge Results

↓

Response Builder

↓

Streaming Response

==================================================
AGENT REGISTRY
==================================================

Create AgentRegistry.

Register agents dynamically.

registry.register(BudgetAgent)

registry.register(TaxAgent)

registry.register(GoalAgent)

registry.register(HealthAgent)

registry.register(NetWorthAgent)

registry.register(RetirementAgent)

registry.register(EducationAgent)

registry.register(RecommendationAgent)

registry.register(ReportAgent)

registry.register(InsightAgent)

Registry resolves agent by intent.

==================================================
ORCHESTRATOR
==================================================

Implement AIOrchestrator.

Responsibilities

execute execution plan

run agents

parallel execution

sequential execution

dependency resolution

timeout handling

retry failed agent

merge responses

Use asyncio.gather()

==================================================
IMPLEMENT AGENTS
==================================================

Budget Agent

Analyze

budget

expenses

overspending

cashflow

Return structured JSON.

----------------------------------------

Health Agent

Analyze

health score

emergency fund

debt

savings

Return explanation.

----------------------------------------

Goal Agent

Analyze

goal progress

required monthly savings

timeline

recommendations

----------------------------------------

Tax Agent

Call ONLY Tax Engine.

Never calculate tax using LLM.

Explain result.

----------------------------------------

Retirement Agent

Call Retirement Engine.

Explain corpus.

Suggest improvements.

----------------------------------------

NetWorth Agent

Analyze

assets

liabilities

growth

history

----------------------------------------

Education Agent

Explain financial concepts.

No advice.

----------------------------------------

Recommendation Agent

Merge outputs.

Generate

educational

personalized

actionable recommendations.

Never recommend investments.

----------------------------------------

Report Agent

Generate

weekly report

monthly report

financial summary

==================================================
RESPONSE BUILDER
==================================================

Merge all agent responses.

Generate

Plain English explanation

Summary

Insights

Recommendations

Follow-up questions

Action buttons

==================================================
ARTIFACTS
==================================================

Return structured artifacts.

Examples

Budget Card

Goal Card

Health Card

Tax Card

Retirement Card

NetWorth Card

Chart

Table

Progress

Timeline

Frontend renders artifacts.

LLM never generates UI code.

==================================================
STREAMING
==================================================

Support

SSE streaming

Thinking updates

Agent progress

Partial responses

Final response

==================================================
ERROR HANDLING
==================================================

If one agent fails

continue remaining agents

retry failed agent once

log failure

never fail entire request

==================================================
FASTAPI APIs
==================================================

POST /api/v1/copilot/chat

POST /api/v1/copilot/chat/stream

GET /api/v1/copilot/history

POST /api/v1/copilot/feedback

GET /api/v1/copilot/health

==================================================
REACT NATIVE RESPONSE FORMAT
==================================================

Return

message

artifacts

suggested_actions

follow_up_questions

metadata

No markdown.

No HTML.

Only structured JSON.

==================================================
QUALITY RULES
==================================================

Everything must be

fully typed

async

modular

production-ready

easy to maintain

easy to extend

Use Python built-in libraries wherever possible.

Only use

FastAPI

Python

PostgreSQL

SQLAlchemy

Pydantic

LangGraph

AI APIs

Avoid unnecessary dependencies.

Do not introduce Redis, Celery, Kafka, RabbitMQ, Docker, Elasticsearch, or other infrastructure.

Maintain compatibility with the existing backend and ensure all current tests continue to pass while adding new tests for the AI Copilot modules.