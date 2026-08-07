You are a Principal AI Engineer and Senior Python Backend Developer.

Continue from the existing FinArivu AI backend.

Do NOT rebuild previous modules.

Reuse

- AI Controller
- Context Builder
- Planner
- Orchestrator
- Multi-Agent System
- PostgreSQL
- FastAPI
- Existing repositories
- Existing database models
- Existing services

====================================================
PROJECT CONTEXT
====================================================

FinArivu AI is an AI Personal CFO.

Purpose

Help users understand and improve their financial life.

Provide

• Budget Analysis
• Financial Health Analysis
• Goal Planning
• Retirement Planning
• Tax Intelligence
• Net Worth Tracking
• Cash Flow Analysis
• Financial Reports
• Financial Education

Never provide

• Buy/Sell Advice
• Stock Recommendations
• Mutual Fund Recommendations
• Portfolio Management
• Trading Signals

LLMs explain.

Python engines calculate.

====================================================
OBJECTIVE
====================================================

Build the complete Financial Intelligence Layer.

Architecture

Agents

↓

Financial Tools

↓

Financial Engines

↓

Recommendation Engine

↓

Artifact Generator

↓

AI Explanation Layer

====================================================
FOLDER STRUCTURE
====================================================

app/

financial/

engines/

budget_engine.py

health_engine.py

goal_engine.py

retirement_engine.py

tax_engine.py

networth_engine.py

cashflow_engine.py

recommendation_engine.py

report_engine.py

simulation_engine.py

tools/

budget_tool.py

health_tool.py

goal_tool.py

retirement_tool.py

tax_tool.py

networth_tool.py

cashflow_tool.py

report_tool.py

simulation_tool.py

artifacts/

artifact_builder.py

schemas.py

utils/

====================================================
GENERAL RULES
====================================================

Financial calculations MUST NEVER use LLMs.

All calculations must be deterministic Python code.

Every engine returns structured Pydantic models.

Agents call Tools.

Tools call Engines.

LLM only explains engine outputs.

====================================================
1. BUDGET ENGINE
====================================================

Implement

BudgetEngine

Responsibilities

Monthly budget analysis

Budget utilization

Category spending

Overspending detection

Recurring expense detection

Monthly comparison

Budget trends

Savings opportunities

Calculate

Budget Used %

Remaining Budget

Overspending %

Average Monthly Spending

Top Expense Categories

Return

BudgetAnalysis

====================================================
2. FINANCIAL HEALTH ENGINE
====================================================

Implement

HealthEngine

Calculate

Savings Score

Emergency Fund Score

Debt Score

Goal Score

Budget Score

Overall Health Score

Generate

Health Grade

Health Status

Improvement Areas

Trend

Return

FinancialHealthResult

====================================================
3. GOAL ENGINE
====================================================

Calculate

Required Monthly Savings

Goal Progress

Goal Completion %

Remaining Amount

Projected Completion Date

Goal Priority

Goal Risk

Return

GoalAnalysis

====================================================
4. RETIREMENT ENGINE
====================================================

Calculate

Future Monthly Expense

Inflation

Required Corpus

Current Gap

Monthly Investment Required

Years Remaining

Retirement Readiness Score

Never use AI.

Pure Python.

====================================================
5. TAX ENGINE
====================================================

Support

Old Regime

New Regime

Calculate

Income Tax

Deductions

Tax Savings

Recommended Regime

Effective Tax Rate

Rule based only.

No AI calculations.

====================================================
6. NET WORTH ENGINE
====================================================

Calculate

Assets

Liabilities

Net Worth

Monthly Growth

Annual Growth

Asset Allocation

Debt Ratio

Return

NetWorthAnalysis

====================================================
7. CASH FLOW ENGINE
====================================================

Calculate

Income

Expenses

Savings

Savings Rate

Burn Rate

Cash Flow

Runway

Monthly Trend

Return

CashFlowAnalysis

====================================================
8. RECOMMENDATION ENGINE
====================================================

Collect outputs from all engines.

Generate recommendations.

Priority

High

Medium

Low

Categories

Budget

Debt

Savings

Goals

Emergency Fund

Retirement

Tax

Recommendations must

be educational

be actionable

be personalized

Never recommend

stocks

funds

buy/sell

====================================================
9. REPORT ENGINE
====================================================

Generate

Weekly Report

Monthly Report

Financial Summary

Include

Health Score

Budget Summary

Goal Progress

Net Worth

Cash Flow

Recommendations

Achievements

Areas to Improve

====================================================
10. SCENARIO SIMULATION ENGINE
====================================================

Support

What-if analysis

Examples

What if

I save ₹5000 more?

What if

salary increases by 10%?

What if

I close my loan?

What if

I retire at 55?

Return

Current Scenario

Optimized Scenario

Difference

Recommendations

====================================================
TOOLS
====================================================

Create Tool Layer.

BudgetTool

GoalTool

HealthTool

TaxTool

RetirementTool

NetWorthTool

CashFlowTool

SimulationTool

ReportTool

Responsibilities

Validate request

Call Engine

Return Result

No AI logic.

====================================================
AI EXPLANATION LAYER
====================================================

LLM receives

Structured Engine Outputs

Responsibilities

Explain calculations

Summarize insights

Highlight trends

Generate simple explanations

Suggest improvements

Never change calculated values.

====================================================
ARTIFACT GENERATOR
====================================================

Implement

ArtifactBuilder

Convert engine outputs into UI artifacts.

Supported Artifacts

Financial Health Card

Budget Card

Goal Card

Tax Card

Retirement Card

Net Worth Card

Cash Flow Card

Report Card

Progress Card

Timeline Card

Pie Chart Data

Bar Chart Data

Line Chart Data

Donut Chart Data

Comparison Table

Return JSON only.

Never generate HTML.

Never generate React code.

====================================================
FOLLOW-UP GENERATOR
====================================================

Generate contextual follow-up questions.

Examples

Would you like to improve this budget?

Show my retirement projection.

How can I increase my savings?

Compare tax regimes.

Generate weekly report.

Maximum

5 follow-up questions.

====================================================
AI RESPONSE FORMAT
====================================================

Every AI response returns

message

summary

artifacts

recommendations

follow_up_questions

metadata

====================================================
FASTAPI INTEGRATION
====================================================

Integrate all engines into

Budget Agent

Goal Agent

Health Agent

Tax Agent

Retirement Agent

Net Worth Agent

Report Agent

Recommendation Agent

No duplicated logic.

====================================================
TESTING
====================================================

Write unit tests for

Budget Engine

Health Engine

Goal Engine

Retirement Engine

Tax Engine

Net Worth Engine

Cash Flow Engine

Recommendation Engine

Scenario Engine

Artifact Builder

Target

100% passing tests.

====================================================
QUALITY RULES
====================================================

Everything must be

Production Ready

Fully Typed

Async where required

Modular

Reusable

Maintainable

Easy to Extend

Use

FastAPI

Python

SQLAlchemy

PostgreSQL

Pydantic

AI APIs

Use only built-in Python libraries whenever possible.

Avoid unnecessary dependencies.

====================================================
FINAL GOAL
====================================================

The completed Financial Intelligence Layer should allow every AI agent to obtain accurate financial calculations from deterministic Python engines, generate explainable AI responses, produce structured UI artifacts for the React Native application, support scenario simulations and financial reports, and integrate seamlessly with the AI Copilot architecture implemented in previous prompts without changing the existing APIs or project structure.