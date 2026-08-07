You are a Senior AI Engineer and Python Backend Developer.

Continue from the existing FinArivu AI backend.

Do NOT rebuild previous modules.

Reuse

• FastAPI
• PostgreSQL
• SQLAlchemy
• Existing AI Controller
• Multi-Agent System
• Financial Engines
• Tool Layer
• Existing APIs

=========================================================
OBJECTIVE
=========================================================

Build the complete AI Infrastructure layer.

This layer is responsible for

• AI Provider Management
• Smart Model Selection
• Automatic Provider Fallback
• Conversation Memory
• Prompt Templates
• Response Validation
• Guardrails Enhancement
• Simple Response Cache
• Performance Monitoring
• AI Health Monitoring

Keep everything lightweight.

Do NOT use

• Redis
• Docker
• Celery
• Kafka
• RabbitMQ
• Elasticsearch
• Vector Database
• Kubernetes

Use only

• FastAPI
• Python
• PostgreSQL
• SQLAlchemy
• AI APIs

=========================================================
FOLDER STRUCTURE
=========================================================

app/

ai/

providers/

base.py

gemini.py

groq.py

openrouter.py

provider_router.py

provider_manager.py

memory/

conversation_memory.py

session_memory.py

prompt/

system_prompts.py

prompt_builder.py

prompt_versions.py

validator/

response_validator.py

json_validator.py

guardrails/

guardrail_service.py

cache/

memory_cache.py

metrics/

metrics_service.py

health.py

schemas.py

=========================================================
1. AI PROVIDER LAYER
=========================================================

Create a common provider interface.

Every provider must implement

generate()

stream()

health()

supports_streaming()

supports_json()

Implement providers

Gemini

Groq

OpenRouter

Future support

Phi-4 Mini

No provider-specific code outside this layer.

=========================================================
2. PROVIDER ROUTER
=========================================================

Implement intelligent routing.

Select provider based on request.

Example

Fast Chat

↓

Groq

Complex Reasoning

↓

Gemini

Long Context

↓

OpenRouter

If selected provider fails

Automatically retry

If retry fails

Automatically switch provider

Maximum

3 retries

Log failures.

=========================================================
3. PROVIDER MANAGER
=========================================================

Track

Current provider

Model

Latency

Token usage

Success count

Failure count

Fallback count

Store metrics in PostgreSQL.

=========================================================
4. CONVERSATION MEMORY
=========================================================

Implement

ConversationMemory

Store

User Message

AI Response

Session

Intent

Agents Used

Provider Used

Timestamp

Load previous conversations.

Summarize old conversations if history becomes too large.

Store summaries in PostgreSQL.

=========================================================
5. SESSION MEMORY
=========================================================

Maintain temporary session state.

Examples

Current topic

Current goal

Current financial discussion

Recent follow-up questions

Clear session automatically after inactivity.

=========================================================
6. PROMPT MANAGEMENT
=========================================================

Create centralized prompt templates.

Examples

System Prompt

Budget Prompt

Goal Prompt

Tax Prompt

Health Prompt

Education Prompt

Recommendation Prompt

Report Prompt

Never hardcode prompts inside agents.

=========================================================
7. PROMPT BUILDER
=========================================================

Build prompts dynamically.

Combine

System Prompt

User Profile

Conversation Summary

Financial Context

Agent Instructions

User Message

Return final prompt.

=========================================================
8. PROMPT VERSIONING
=========================================================

Store prompt versions.

Each prompt has

Version

Name

Description

Created Date

Status

Allow easy prompt updates.

=========================================================
9. RESPONSE VALIDATOR
=========================================================

Validate every AI response.

Check

Empty response

Invalid JSON

Missing fields

Policy violations

Financial calculation mismatch

Unsafe responses

If validation fails

Retry once.

If still invalid

Return friendly error message.

=========================================================
10. GUARDRAIL ENHANCEMENT
=========================================================

Extend existing guardrails.

Detect

Prompt Injection

Jailbreak

PII

Investment Advice

SQL Injection

Sensitive Information

Mask

PAN

Aadhaar

Credit Card

Bank Account

Phone Number

Email

Return safe educational response if blocked.

=========================================================
11. SIMPLE MEMORY CACHE
=========================================================

Implement lightweight cache.

Use Python dictionary.

Store

Recent prompts

Recent responses

Add TTL.

Automatically remove expired items.

No Redis.

=========================================================
12. PERFORMANCE METRICS
=========================================================

Track

Response Time

Provider Used

Model Used

Execution Time

Agent Execution Time

Tokens Used

Prompt Size

Completion Size

Retry Count

Fallback Count

Store metrics in PostgreSQL.

=========================================================
13. AI HEALTH SERVICE
=========================================================

Create health checker.

Verify

Gemini

Groq

OpenRouter

Database

Return

Healthy

Degraded

Offline

Expose health endpoint.

=========================================================
14. CONFIGURATION
=========================================================

Move all AI configuration to config.

Provider Priority

Default Models

Temperature

Max Tokens

Timeout

Retry Count

Streaming Enabled

No hardcoded configuration.

=========================================================
15. ERROR HANDLING
=========================================================

Gracefully handle

Provider Failure

Timeout

Rate Limit

Network Failure

Invalid Response

Database Error

Always return meaningful response.

Never expose internal errors.

=========================================================
16. FASTAPI APIs
=========================================================

Expose

GET /api/v1/copilot/health

GET /api/v1/copilot/providers

GET /api/v1/copilot/metrics

GET /api/v1/copilot/session

DELETE /api/v1/copilot/session

=========================================================
17. TESTING
=========================================================

Write unit tests for

Provider Router

Conversation Memory

Prompt Builder

Prompt Versioning

Response Validator

Guardrails

Cache

Health Service

Metrics

Provider Fallback

Target

100% passing tests.

=========================================================
18. QUALITY RULES
=========================================================

Everything must be

Fully Typed

Production Ready

Reusable

Modular

Async

Easy to Maintain

Easy to Extend

Use SOLID principles.

Avoid unnecessary dependencies.

=========================================================
FINAL GOAL
=========================================================

The AI Infrastructure layer should provide a lightweight but production-quality foundation for the FinArivu AI Copilot.

It should intelligently manage AI providers, maintain conversation memory, build prompts dynamically, validate responses, protect users through guardrails, monitor performance, and expose health and metrics APIs—all while using only FastAPI, Python, PostgreSQL, SQLAlchemy, and AI APIs, without introducing additional infrastructure or services.