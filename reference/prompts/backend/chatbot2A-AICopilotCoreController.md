You are a Principal AI Architect and Senior Python/FastAPI Engineer.

Your task is to transform the existing FinArivu AI backend into a production-quality AI Personal CFO using FastAPI, Python, PostgreSQL, LangGraph, and AI APIs (Gemini, Groq, OpenRouter).

Do NOT rewrite the existing backend.

Extend it.

Reuse existing provider fallback, authentication, repositories, services, database models, and financial engines.

==================================================
PROJECT CONTEXT
==================================================

FinArivu AI is an AI Personal CFO.

It provides

- Budget Analysis
- Financial Health Analysis
- Goal Planning
- Retirement Planning
- Tax Intelligence
- Net Worth Tracking
- Weekly Reports
- Financial Education

Never provide

- Buy/Sell recommendations
- Stock picks
- Portfolio management
- Investment advisory
- Intraday advice

LLMs explain.

Python rule engines calculate.

==================================================
OBJECTIVE
==================================================

Implement the entire AI orchestration layer.

Architecture

User

↓

AI Controller

↓

Guardrail

↓

Intent Classifier

↓

Context Builder

↓

Planner

↓

Execution Planner

↓

Agent Orchestrator

↓

Response Builder

==================================================
FOLDER STRUCTURE
==================================================

app/

ai/

controller/

orchestrator/

planner/

intent/

context/

memory/

guardrails/

prompts/

schemas/

agents/

registry/

response/

utils/

==================================================
IMPLEMENT
==================================================

1. AIController

Single entry point.

Responsibilities

- receive user message
- load session
- call guardrail
- classify intent
- build context
- create execution plan
- execute orchestrator
- build response
- store conversation
- return response

==================================================

2. Guardrail

Runs before every request.

Detect

- jailbreak
- prompt injection
- harmful prompts
- PII
- SQL injection
- XSS strings
- investment advice
- buy/sell requests

Mask

PAN

Aadhaar

Account numbers

Credit cards

If request violates policy

Return educational response.

==================================================

3. Intent Classifier

Create lightweight classifier.

Supported intents

Budget

Goal

Retirement

Tax

Health

NetWorth

Education

Report

Greeting

General

Mixed

Use simple rules or a small fast LLM.

Return

IntentResult

confidence

entities

requested modules

==================================================

4. Context Builder

Load ALL required data once.

Collect

Profile

Income

Expenses

Budgets

Goals

Assets

Liabilities

Health Score

Tax Regime

Conversation Summary

Preferences

Build

FinancialContext

Pass to every agent.

Agents NEVER query database directly.

==================================================

5. Planner

Planner converts

Intent

↓

Execution Plan

Example

Budget

↓

Budget Agent

Mixed

↓

Budget Agent

Goal Agent

Health Agent

Retirement

↓

Retirement Agent

NetWorth Agent

Goal Agent

==================================================

6. Execution Planner

Build execution graph.

Support

parallel execution

sequential execution

dependencies

timeouts

retries

==================================================

7. Conversation Memory

Store

messages

session

feedback

latency

provider

token count

summary

Use PostgreSQL only.

No Redis.

==================================================

8. AI Schemas

Create Pydantic models.

FinancialContext

IntentResult

ExecutionPlan

AgentRequest

AgentResponse

Artifact

ChatResponse

ConversationSummary

==================================================

9. Shared Context

Every agent receives

FinancialContext

Never call repositories inside agents.

==================================================

10. Logging

Track

provider

model

latency

tokens

execution time

errors

==================================================

11. Architecture Rules

Use FastAPI

Use AsyncIO

Use SQLAlchemy

Use PostgreSQL

Use LangGraph

Use Dependency Injection

Repository Pattern

Service Layer

Never put business logic in routers.

Never calculate finance using LLM.

Everything must be asynchronous.

Generate complete production-ready code.

Follow SOLID principles.

Do not use Redis, Celery, Kafka, Docker, RabbitMQ, or Vector DB.

After implementation, ensure all modules integrate with the existing backend without breaking current APIs.