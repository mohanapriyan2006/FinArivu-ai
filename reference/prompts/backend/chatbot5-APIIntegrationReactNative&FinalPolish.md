You are a Senior Full Stack Engineer specializing in

• FastAPI
• Python
• PostgreSQL
• React Native
• TypeScript
• AI Applications

Continue from the existing FinArivu AI backend.

Do NOT rebuild previous modules.

Reuse

• AI Controller
• Multi-Agent System
• Financial Engines
• AI Infrastructure
• Existing FastAPI APIs
• Existing Database
• Existing React Native Project

=========================================================
OBJECTIVE
=========================================================

Complete the AI Copilot by

• Connecting Backend & Frontend
• Improving AI Chat Experience
• Rendering Dynamic Financial Cards
• Optimizing Performance
• Improving Error Handling
• Writing Complete Tests
• Cleaning Code
• Final Refactoring
• Documentation

This is the final implementation phase.

=========================================================
BACKEND API
=========================================================

Verify and improve all APIs.

POST

/api/v1/copilot/chat

POST

/api/v1/copilot/chat/stream

GET

/api/v1/copilot/history

POST

/api/v1/copilot/feedback

GET

/api/v1/copilot/health

GET

/api/v1/copilot/providers

GET

/api/v1/copilot/metrics

GET

/api/v1/copilot/session

DELETE

/api/v1/copilot/session

Every endpoint must

• use async
• validate input
• validate output
• return typed Pydantic models
• return proper HTTP status codes

=========================================================
CHAT RESPONSE FORMAT
=========================================================

Every AI response must return structured JSON.

Example

{
  "message": "...",
  "summary": "...",
  "artifacts": [],
  "recommendations": [],
  "follow_up_questions": [],
  "suggested_actions": [],
  "metadata": {
      "intent": "",
      "agents_used": [],
      "provider": "",
      "execution_time_ms": 0
  }
}

Never return HTML.

Never return React components.

=========================================================
ARTIFACTS
=========================================================

Backend returns artifact types only.

Supported artifacts

Health Card

Budget Card

Goal Card

Tax Card

Retirement Card

Net Worth Card

Cash Flow Card

Weekly Report Card

Monthly Report Card

Insight Card

Recommendation Card

Progress Card

Timeline Card

Bar Chart Data

Pie Chart Data

Line Chart Data

Donut Chart Data

Comparison Table

React Native renders them.

=========================================================
FOLLOW-UP ACTIONS
=========================================================

Generate intelligent follow-up actions.

Examples

Review Budget

Improve Savings

Compare Tax Regimes

Generate Weekly Report

Update Goal

View Cash Flow

Retirement Projection

Export Report

Maximum

6 actions

=========================================================
REACT NATIVE INTEGRATION
=========================================================

Create or improve

ChatService

Copilot Hooks

Conversation State

Streaming Support

Typing Animation

Loading States

Retry Support

Offline Handling

Error States

Auto Scroll

Message Pagination

Pull To Refresh

Conversation Search

Use existing architecture.

Do not duplicate logic.

=========================================================
AI CHAT EXPERIENCE
=========================================================

Improve chat UX.

Features

Claude-style messages

Agent thinking indicator

Streaming response

Typing animation

Financial cards

Charts

Follow-up chips

Retry failed response

Copy message

Regenerate response

Feedback buttons

Conversation history

Pinned conversations

=========================================================
ERROR HANDLING
=========================================================

Gracefully handle

Provider failure

Network timeout

No internet

Database failure

Rate limit

Empty response

Streaming interruption

Always show user-friendly messages.

Never expose stack traces.

=========================================================
PERFORMANCE
=========================================================

Optimize

Database queries

Agent execution

Provider selection

Memory loading

Prompt size

Response size

Streaming

Avoid duplicate queries.

Use asyncio where appropriate.

=========================================================
SECURITY
=========================================================

Validate all requests.

Sanitize user input.

Protect sensitive financial information.

Never log

PAN

Aadhaar

Account Number

Passwords

Tokens

API Keys

Mask sensitive information before storing.

=========================================================
TESTING
=========================================================

Write tests for

API endpoints

Streaming

Chat flow

Artifacts

Recommendation generation

Conversation history

Session memory

Provider fallback

Guardrails

Prompt builder

Financial engines

Target

100% passing tests.

=========================================================
DOCUMENTATION
=========================================================

Generate

README

Architecture Overview

Folder Structure

API Documentation

Database Diagram

Agent Flow Diagram

Setup Guide

Deployment Guide

Developer Guide

Future Improvements

=========================================================
CODE CLEANUP
=========================================================

Review the entire project.

Remove

Duplicate code

Unused files

Unused imports

Dead code

Repeated logic

Large functions

Magic numbers

Replace repeated logic with reusable utilities.

=========================================================
FINAL ARCHITECTURE REVIEW
=========================================================

Ensure architecture follows

React Native

↓

FastAPI

↓

AI Controller

↓

Guardrails

↓

Intent Classifier

↓

Context Builder

↓

Planner

↓

Agent Orchestrator

↓

Financial Tools

↓

Financial Engines

↓

AI Providers

↓

Response Builder

↓

Artifacts

↓

Frontend

Every layer should have a single responsibility.

=========================================================
PRODUCTION CHECKLIST
=========================================================

Verify

✓ Async APIs

✓ Typed Models

✓ SQLAlchemy Best Practices

✓ PostgreSQL Optimized Queries

✓ Proper Logging

✓ Exception Handling

✓ Modular Code

✓ Reusable Components

✓ No Hardcoded Secrets

✓ Environment Variables

✓ Clean Folder Structure

✓ Complete Tests

✓ Documentation

=========================================================
QUALITY RULES
=========================================================

Everything must be

• Modular
• Reusable
• Fully Typed
• Easy to Read
• Easy to Maintain
• Production Ready
• Consistent

Use only

• FastAPI
• Python
• PostgreSQL
• SQLAlchemy
• Pydantic
• React Native
• TypeScript
• AI APIs

Do NOT introduce

• Redis
• Docker
• Celery
• Kafka
• RabbitMQ
• Elasticsearch
• Kubernetes
• Vector Databases

=========================================================
FINAL GOAL
=========================================================

Deliver a complete AI Personal CFO application where

• Users can chat naturally with the AI Copilot.
• Multiple AI agents collaborate to answer financial planning questions.
• Financial calculations come from deterministic Python rule engines.
• AI providers generate clear, explainable insights.
• React Native displays rich financial artifacts, charts, and recommendations.
• The entire system is clean, modular, scalable, well-tested, and easy to extend.

The implementation must integrate seamlessly with all previous modules without breaking existing functionality, maintain a minimal technology stack, and be suitable as a high-quality final-year project and MVP.