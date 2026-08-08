You are a Senior Python Backend Engineer, FastAPI Architect, PostgreSQL Database Engineer, and AI Context Engineer.

You are working on the existing FinArivu AI backend.

The project already contains:

- FastAPI backend
- Python
- PostgreSQL
- SQLAlchemy
- Pydantic
- Authentication
- Financial engines
- AI Controller
- Intent Classifier
- Context Builder
- Planner
- LangGraph Multi-Agent Orchestrator
- AI Provider Router
- Gemini / Groq / OpenRouter providers
- Existing Copilot APIs

DO NOT rebuild the existing AI Copilot.

DO NOT create a second AI architecture.

DO NOT create a second Context Builder.

Extend the existing architecture.

============================================================
1. OBJECTIVE
============================================================

Implement the backend system for storing the user's financial profile collected by the new React Native onboarding screens.

The system must:

1. Receive financial profile data from React Native.
2. Validate it.
3. Store it efficiently in PostgreSQL.
4. Allow partial completion.
5. Allow users to update individual sections.
6. Track profile completion.
7. Track which sections are incomplete.
8. Support multiple records where required.
9. Never require sensitive banking credentials.
10. Provide a clean FinancialContext to the EXISTING AI Copilot.
11. Allow agents to use real user financial data.
12. Prevent hallucinated financial values.
13. Avoid sending unnecessary financial data to external AI APIs.
14. Keep the architecture simple and maintainable.

============================================================
2. TECHNOLOGY CONSTRAINT
============================================================

Use ONLY the existing project stack:

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Existing authentication
- Existing AI APIs
- Existing LangGraph implementation

Do NOT introduce:

- Redis
- MongoDB
- Firebase
- Elasticsearch
- Kafka
- Celery
- RabbitMQ
- Vector Database
- Docker
- Kubernetes
- Additional database systems

Use PostgreSQL as the single source of truth.

============================================================
3. CORE ARCHITECTURE
============================================================

Implement:

React Native

        ↓

Financial Profile APIs

        ↓

Validation

        ↓

Service Layer

        ↓

PostgreSQL

        ↓

Financial Data Repository

        ↓

FinancialContextBuilder

        ↓

Existing AI Controller

        ↓

Existing Intent / Planner

        ↓

Existing Multi-Agent Orchestrator

        ↓

Relevant Financial Agents

        ↓

Financial Engines

        ↓

AI Explanation

============================================================
4. IMPORTANT ARCHITECTURAL PRINCIPLE
============================================================

Do NOT create one giant table such as:

financial_profiles

with 50+ nullable columns.

Do NOT store the entire financial profile as an uncontrolled JSON blob.

Use normalized domain tables.

The financial profile is a COLLECTION of financial domains.

Example:

User

├── Profile
├── Income
├── Expenses
├── Savings
├── Investments
├── Fixed Deposits
├── Loans
├── Credit Cards
├── Insurance
├── Goals
└── Tax Profile

This allows:

- efficient updates
- efficient queries
- multiple loans
- multiple goals
- multiple investments
- multiple FDs
- proper indexing
- future bank/API integration
- financial engine reuse

============================================================
5. DATA OWNERSHIP
============================================================

Every financial record MUST belong to a user.

Use:

user_id

as the primary ownership relationship.

Never trust user_id supplied by the frontend.

The authenticated user identity MUST determine the user_id.

Example:

request

↓

authenticated_user

↓

user_id

↓

database query

Never:

request.user_id

↓

database

without authentication verification.

============================================================
6. USER PROFILE
============================================================

Reuse the existing users/profiles tables if they already exist.

Do NOT create duplicates.

Profile fields may include:

- full_name
- age
- employment_type
- city
- dependents
- children_count
- retirement_age if already supported

Do not store:

- passwords
- bank passwords
- OTP
- PIN
- CVV
- account passwords
- API keys

============================================================
7. INCOME DATA
============================================================

Implement or extend:

income

Recommended fields:

id

user_id

source

amount

frequency

income_date

is_primary

created_at

updated_at

Examples:

source:

salary

bonus

freelance

rental

business

other

frequency:

monthly

annual

one_time

Use NUMERIC/DECIMAL for money.

Never use FLOAT for financial amounts.

============================================================
8. MONTHLY INCOME SUMMARY
============================================================

The onboarding UI mainly collects:

monthly take-home income.

Store the underlying income record.

Do not create duplicate "monthly_income" values in multiple tables.

If a summary is required:

calculate it through a service.

Example:

IncomeService.get_monthly_income(user_id)

The database remains the source of truth.

============================================================
9. EXPENSE DATA
============================================================

Reuse the existing expense system.

Existing structure should support:

expenses

expense_categories

Recommended fields:

expenses:

id

user_id

category_id

amount

description

expense_date

frequency if supported

created_at

updated_at

Categories:

Housing

Food

Transport

Utilities

Shopping

Travel

Entertainment

Healthcare

Education

Insurance

Other

============================================================
10. MONTHLY EXPENSE SUMMARY
============================================================

The onboarding screen may ask:

"Estimated monthly expenses"

Do NOT create an unrelated duplicate expense table just for onboarding.

Store the value in a way compatible with the existing expense architecture.

If the project requires a manually estimated summary before detailed transactions exist, create a clearly named profile-level estimate such as:

monthly_expense_estimate

with:

user_id

amount

source = "manual_estimate"

updated_at

This must remain distinguishable from actual transaction-derived expenses.

IMPORTANT:

Do not mix:

estimated expense

and

transaction-derived expense

without identifying the source.

============================================================
11. EXPENSE SOURCE
============================================================

Financial values should carry source metadata where useful.

Example:

source:

manual

imported

api

calculated

estimate

This becomes important when future bank/statement integrations are added.

Example:

{
    "amount": 42000,
    "source": "manual_estimate"
}

============================================================
12. SAVINGS
============================================================

Implement a savings domain.

Minimal fields:

id

user_id

total_amount

updated_at

Optional breakdown:

emergency_fund

general_savings

goal_savings

Do not require bank-level details.

Never ask/store:

- account number
- IFSC
- password
- PIN
- OTP

============================================================
13. INVESTMENTS
============================================================

Create/reuse an investments table.

Minimal onboarding:

total investment value.

Optional breakdown:

mutual_funds

stocks

ppf

nps

gold

other

Recommended model:

investment_accounts/items

or another normalized structure compatible with the existing architecture.

Do NOT store:

- broker password
- demat password
- OTP
- account credentials

Do not make security-level holdings mandatory.

The MVP only needs aggregate investment information for:

- net worth
- financial health
- retirement planning
- general financial analysis

============================================================
14. FIXED DEPOSITS
============================================================

Create:

fixed_deposits

Fields:

id

user_id

name/label

principal_or_current_value

interest_rate nullable

maturity_date nullable

purpose nullable

created_at

updated_at

Allow multiple FDs.

Do not require:

- FD account number
- bank credentials
- OTP

============================================================
15. LOANS
============================================================

Create/reuse:

loans

Fields:

id

user_id

loan_type

outstanding_amount

monthly_emi

interest_rate nullable

remaining_months nullable

start_date nullable

created_at

updated_at

Loan types:

home

personal

car

education

consumer

other

Allow multiple loans.

This data is required by:

- Health Engine
- Debt analysis
- Cash Flow Engine
- Retirement planning
- Net Worth Engine

============================================================
16. CREDIT CARDS
============================================================

Create:

credit_cards

Minimal:

id

user_id

current_outstanding

typical_monthly_payment

Optional:

credit_limit

monthly_spend

created_at

updated_at

NEVER store:

- card number
- CVV
- PIN
- OTP
- password

Credit card data is financial information, not authentication information.

============================================================
17. GOALS
============================================================

Reuse the existing goals table if present.

Fields should support:

id

user_id

goal_type

goal_name

target_amount

target_date

current_amount

monthly_contribution nullable

created_at

updated_at

Examples:

home

vehicle

education

travel

emergency_fund

retirement

marriage

wealth

other

Allow multiple goals.

============================================================
18. INSURANCE
============================================================

Create/reuse:

insurance

Fields:

id

user_id

insurance_type

coverage_amount nullable

annual_premium nullable

created_at

updated_at

Types:

health

life

other

Do NOT store:

- policy passwords
- OTP
- account credentials

Policy number is NOT required for the MVP.

============================================================
19. TAX PROFILE
============================================================

Create/reuse:

tax_profiles

Fields:

id

user_id

annual_income nullable

tax_regime nullable

deduction_80c nullable

deduction_80d nullable

home_loan_interest nullable

nps_deduction nullable

other_deductions nullable

updated_at

Regime:

old

new

unknown

Do NOT make tax profile mandatory for all users.

The Tax Agent can request additional information later.

============================================================
20. PROFILE COMPLETION
============================================================

Implement backend profile completion calculation.

Do NOT trust the frontend percentage.

The backend is the source of truth.

Use configurable weights.

Suggested:

About You       10%

Income          15%

Expenses        20%

Savings         15%

Investments     15%

Loans           10%

Goals           15%

Total           100%

Optional:

FD

Credit Card

Insurance

Tax

These improve data richness but should not block core completion.

============================================================
21. PROFILE COMPLETION SERVICE
============================================================

Create:

FinancialProfileCompletionService

Methods:

get_completion(user_id)

get_section_status(user_id)

get_missing_sections(user_id)

get_last_incomplete_section(user_id)

is_core_profile_ready(user_id)

Example result:

{
    "completion_percentage": 72,
    "core_ready": true,
    "missing_sections": [
        "loans",
        "insurance"
    ],
    "last_incomplete_section": "loans"
}

============================================================
22. DO NOT STORE COMPLETION PERCENTAGE AS PRIMARY TRUTH
============================================================

Avoid blindly storing:

completion_percentage = 72

because data may later change.

Calculate completion from actual data.

If performance requires caching later, it can be added carefully.

For the MVP:

calculate from the user's domain records.

============================================================
23. PROFILE INITIALIZATION
============================================================

Support:

profile_initialized

or equivalent state.

The backend should distinguish:

new user

partially completed user

completed user

Do not force users to complete every optional section.

============================================================
24. PARTIAL SAVE
============================================================

Every onboarding section must be independently saveable.

Example:

POST/PUT Income

POST/PUT Expenses

POST/PUT Savings

etc.

If the user closes the application after completing:

Income

Expenses

Savings

the data must remain stored.

Next login:

backend returns:

completion_percentage

missing_sections

last_incomplete_section

============================================================
25. UPSERT BEHAVIOR
============================================================

For single-record sections:

Profile

Savings

Tax Profile

use update/upsert behavior.

For collection sections:

Loans

Goals

FDs

Credit Cards

Insurance

use create/update/delete operations.

Do NOT create duplicate records when the user taps Continue multiple times.

============================================================
26. API DESIGN
============================================================

Create a clean Financial Profile API.

Suggested:

GET

/api/v1/financial-profile

Returns complete profile summary.

GET

/api/v1/financial-profile/completion

Returns completion information.

PUT

/api/v1/financial-profile/profile

Updates basic profile.

PUT

/api/v1/financial-profile/income

Updates primary income.

PUT

/api/v1/financial-profile/expenses

Updates expense estimate/basic expense data.

PUT

/api/v1/financial-profile/savings

Updates savings.

PUT

/api/v1/financial-profile/investments

Updates investment summary.

GET

/api/v1/financial-profile/investments

Returns investment details.

POST

/api/v1/financial-profile/investments

Creates investment item.

PUT

/api/v1/financial-profile/investments/{id}

Updates investment item.

DELETE

/api/v1/financial-profile/investments/{id}

Deletes investment item.

Repeat appropriate CRUD patterns for:

FD

Loans

Credit Cards

Goals

Insurance

Tax

============================================================
27. PREFER SECTION APIs OVER ONE HUGE POST
============================================================

Do NOT make the onboarding submit everything through:

POST /financial-profile

with a giant payload.

Prefer section-based APIs.

Reason:

- partial completion
- smaller payloads
- easier validation
- easier updates
- fewer accidental overwrites
- easier frontend integration

The GET profile endpoint can return the aggregated view.

============================================================
28. RESPONSE FORMAT
============================================================

GET:

/api/v1/financial-profile

Return:

{
    "profile": {...},
    "income": {...},
    "expenses": {...},
    "savings": {...},
    "investments": [...],
    "fixed_deposits": [...],
    "loans": [...],
    "credit_cards": [...],
    "insurance": [...],
    "goals": [...],
    "tax_profile": {...},
    "completion": {
        "percentage": 72,
        "core_ready": true,
        "missing_sections": []
    }
}

Only return data belonging to the authenticated user.

============================================================
29. DATABASE DESIGN
============================================================

Inspect the existing database first.

If tables already exist:

DO NOT duplicate them.

Migrate/extend them where appropriate.

Recommended relationships:

users
  |
  ├── profile
  ├── income
  ├── expenses
  ├── savings
  ├── investments
  ├── fixed_deposits
  ├── loans
  ├── credit_cards
  ├── insurance
  ├── goals
  └── tax_profile

Every child table must have:

user_id

with appropriate foreign key constraints.

============================================================
30. INDEXING
============================================================

Add indexes where useful.

At minimum:

user_id

date fields used for filtering

category_id where appropriate

created_at where needed

Composite indexes where query patterns justify them.

Examples:

expenses(user_id, expense_date)

income(user_id, income_date)

goals(user_id)

loans(user_id)

investments(user_id)

fixed_deposits(user_id)

Do NOT add indexes blindly.

Inspect actual query patterns.

============================================================
31. MONEY STORAGE
============================================================

CRITICAL.

Never use FLOAT for financial amounts.

Use:

NUMERIC / DECIMAL

Recommended:

NUMERIC(15,2)

or a suitable precision based on existing schema.

Python:

Decimal

not float.

Pydantic:

Decimal

This prevents financial precision errors.

============================================================
32. DATE STORAGE
============================================================

Use proper PostgreSQL:

DATE

TIMESTAMP WITH TIME ZONE

where appropriate.

Do not store dates as strings.

============================================================
33. VALIDATION
============================================================

Implement Pydantic validation.

Examples:

Income:

>= 0

Expense:

>= 0

Savings:

>= 0

Investment:

>= 0

Loan amount:

>= 0

EMI:

>= 0

Goal target:

> 0

Interest rate:

>= 0

Percentage:

0–100

Age:

reasonable valid range

Do not reject legitimate zero values.

Example:

No investments:

investment_total = 0

is valid.

Missing investment data:

null/missing

is different from:

0

============================================================
34. NULL VS ZERO
============================================================

This is extremely important.

Use:

NULL

when the user has not provided information.

Use:

0

when the user explicitly says the value is zero.

Examples:

investment_total = NULL

means:

"Unknown / not provided."

investment_total = 0

means:

"User has no investments."

Do not automatically convert missing fields to zero.

============================================================
35. DATA SOURCE
============================================================

Every financial domain should be capable of identifying its source.

Use:

manual

imported

api

calculated

estimate

For onboarding:

source = manual

For estimated monthly expense:

source = estimate

For future bank aggregation:

source = api

This makes the architecture future-ready.

============================================================
36. UPDATED TIMESTAMP
============================================================

Every editable financial record should have:

created_at

updated_at

Use server-side timestamps.

Do not trust frontend timestamps.

============================================================
37. USER CONTEXT BUILDER
============================================================

THIS IS THE MOST IMPORTANT PART.

The existing AI Copilot already has a Context Builder.

DO NOT create a separate competing context system.

Extend the existing:

FinancialContextBuilder

or equivalent.

Its responsibility:

Fetch relevant financial data.

Normalize it.

Summarize it.

Return structured FinancialContext.

============================================================
38. FINANCIAL CONTEXT MODEL
============================================================

Create/reuse a strongly typed model.

Example:

FinancialContext

{
    "profile": {
        "age": 28,
        "employment_type": "salaried",
        "city": "Chennai",
        "dependents": 2
    },

    "income": {
        "monthly_take_home": 60000
    },

    "expenses": {
        "monthly_estimate": 48000,
        "categories": {
            "food": 8000,
            "housing": 15000,
            "transport": 4000
        }
    },

    "savings": {
        "total": 200000,
        "emergency_fund": 120000
    },

    "investments": {
        "total": 500000,
        "breakdown": {
            "mutual_funds": 300000,
            "stocks": 100000,
            "ppf": 100000
        }
    },

    "liabilities": {
        "total_loans": 1500000,
        "monthly_emi": 22000,
        "credit_card_outstanding": 10000
    },

    "goals": [
        {
            "name": "House",
            "target_amount": 5000000,
            "current_amount": 500000,
            "target_date": "2032-01-01"
        }
    ],

    "insurance": {
        "health_cover": 1000000,
        "life_cover": 5000000
    }
}

Use Pydantic models.

============================================================
39. DO NOT SEND THE ENTIRE PROFILE TO EVERY AGENT
============================================================

The Context Builder should support selective context.

Example:

Budget Agent needs:

income

expenses

budgets

cashflow

Goal Agent needs:

income

expenses

savings

goals

Retirement Agent needs:

age

income

expenses

savings

investments

retirement goal

Tax Agent needs:

income

tax profile

deductions

Health Agent may need:

income

expenses

savings

debt

goals

Therefore:

Planner/Agent Registry

↓

requested_context_fields

↓

Context Builder

↓

minimal context

This reduces:

- token usage
- latency
- unnecessary data exposure
- prompt size

============================================================
40. CONTEXT PROJECTION
============================================================

Implement a projection mechanism.

Example:

BudgetAgentContext

contains only:

income

expenses

budgets

cashflow

GoalAgentContext

contains only:

income

expenses

savings

goals

Do not send:

credit card details

insurance

tax data

etc.

unless required.

============================================================
41. CONTEXT IS NOT RAW DATABASE DATA
============================================================

Do not send raw SQLAlchemy objects to the LLM.

Do not send ORM models directly.

Flow:

PostgreSQL

↓

Repository

↓

Domain Service

↓

FinancialContext

↓

Agent-specific Context

↓

LLM

============================================================
42. CALCULATED CONTEXT
============================================================

The Context Builder may call deterministic engines for derived values.

Examples:

monthly_savings

savings_rate

total_assets

total_liabilities

net_worth

debt_ratio

emergency_fund_months

goal_progress

These should come from Python engines/services.

Example:

income = 60000

expenses = 48000

↓

savings = 12000

↓

savings_rate = 20%

Do not ask the LLM to calculate this.

============================================================
43. FINANCIAL ENGINE INTEGRATION
============================================================

The context system should reuse:

BudgetEngine

HealthEngine

GoalEngine

RetirementEngine

TaxEngine

NetWorthEngine

CashFlowEngine

Do not duplicate formulas.

Example:

NetWorthAgent

↓

NetWorthEngine

↓

verified result

↓

Agent

↓

LLM explanation

============================================================
44. AI CONTEXT FLOW
============================================================

Final architecture:

User

↓

FastAPI Copilot

↓

Authentication

↓

Intent Classifier

↓

Planner

↓

Determine required context

↓

FinancialContextBuilder

↓

Load only required user data

↓

Financial Engines

↓

Agent Context

↓

Specialist Agent

↓

LLM

↓

Response Builder

============================================================
45. CONVERSATION + FINANCIAL CONTEXT
============================================================

The existing Copilot has conversation memory.

Combine:

Conversation Context

+

Financial Context

but keep them logically separate.

Example:

ConversationContext:

"User previously asked about food spending."

FinancialContext:

monthly food expense = ₹8,000

The agent receives both.

Do not permanently store the entire generated AI prompt as the user's financial profile.

============================================================
46. CONTEXT FRESHNESS
============================================================

Financial data can change.

Therefore the Context Builder should fetch current database values when the user starts a financial analysis.

Do not reuse stale financial context across requests.

Example:

User updates savings:

₹2,00,000 → ₹3,00,000

Next Copilot request must use:

₹3,00,000

not the old value.

============================================================
47. CONTEXT SNAPSHOT FOR AUDIT
============================================================

If the existing AI architecture already records AI execution metadata, optionally store a compact context snapshot or context metadata.

Do NOT store unnecessary sensitive raw data in logs.

Prefer:

context_version

data_updated_at

fields_used

rather than dumping the entire financial profile into logs.

============================================================
48. DATA MINIMIZATION
============================================================

Never send irrelevant financial data to AI providers.

Example:

Question:

"What is a mutual fund?"

Do NOT send:

salary

expenses

loan balance

investments

net worth

Even though the system knows them.

Use:

EducationAgent

with no financial profile context unless required.

============================================================
49. PERSONAL FINANCE QUESTION
============================================================

Question:

"How much did I spend on food?"

Use:

ExpenseAgent

Load:

expenses

food category

date range

budget if comparison is requested

Do NOT load:

tax

insurance

FD

retirement

unless needed.

============================================================
50. CROSS-DOMAIN QUESTION
============================================================

Question:

"Am I spending too much and can I still reach my house goal?"

Use:

BudgetAgent

+

GoalAgent

Required context:

income

expenses

budget

savings

house goal

Possibly debt if it affects cash flow.

Do not load unrelated insurance data.

============================================================
51. MISSING DATA HANDLING
============================================================

If the agent requires data that does not exist:

DO NOT hallucinate.

Example:

User:

"Can I retire at 50?"

Database:

age = available

income = available

expenses = available

investments = missing

savings = missing

Return a structured missing-data result.

Example:

{
    "status": "missing_data",
    "missing_fields": [
        "savings",
        "investments"
    ]
}

The Copilot should then ask the user only for the missing information.

============================================================
52. DATA COMPLETENESS FOR AI
============================================================

Create a context readiness check.

Example:

RetirementAgent:

required:

age

income

expenses

savings OR investments

If required data exists:

execute.

If not:

ask for missing data.

This prevents meaningless agent execution.

============================================================
53. CONTEXT QUALITY
============================================================

Every context object should include:

data_available

data_missing

data_source

last_updated

where useful.

Example:

{
    "monthly_income": {
        "value": 60000,
        "source": "manual",
        "updated_at": "2026-08-08"
    }
}

Do not expose these metadata fields to the user unless useful.

They are primarily for internal reliability.

============================================================
54. SECURITY
============================================================

Never store or send:

passwords

OTP

PIN

CVV

bank credentials

API keys

authentication tokens

account passwords

Do not log sensitive financial values unnecessarily.

Never include authorization headers or JWTs in AI prompts.

Never send user authentication information to AI providers.

============================================================
55. AI PROVIDER DATA MINIMIZATION
============================================================

Before sending context to Gemini/Groq/OpenRouter:

1. Build relevant context.
2. Remove irrelevant fields.
3. Remove sensitive metadata.
4. Serialize structured context.
5. Send only required values.

Example:

Budget question:

{
    "monthly_income": 60000,
    "monthly_expenses": 48000,
    "food_spending": 8000,
    "food_budget": 6000
}

Do not send the user's:

email

phone

city

loan account identifiers

etc.

unless actually needed.

============================================================
56. CONTEXT SERIALIZATION
============================================================

Use structured JSON internally.

Do NOT construct huge uncontrolled text strings.

Example:

Financial Context:

{
    "income": ...,
    "expenses": ...,
    "goals": ...
}

The prompt builder can safely inject this structured context.

============================================================
57. REPOSITORY LAYER
============================================================

Create/reuse repositories:

FinancialProfileRepository

IncomeRepository

ExpenseRepository

SavingsRepository

InvestmentRepository

LoanRepository

CreditCardRepository

FixedDepositRepository

GoalRepository

InsuranceRepository

TaxProfileRepository

Repositories:

- only access database
- do not contain AI logic
- do not contain business calculations
- do not build prompts

============================================================
58. SERVICE LAYER
============================================================

Create/reuse services:

FinancialProfileService

IncomeService

ExpenseService

SavingsService

InvestmentService

LoanService

GoalService

FinancialContextService

ProfileCompletionService

Services handle:

validation

business rules

repository calls

domain coordination

============================================================
59. ROUTER LAYER
============================================================

Routers should only:

- validate request
- get authenticated user
- call service
- return response

Never place:

financial calculations

AI prompt construction

database queries

inside routers.

============================================================
60. DATABASE MIGRATIONS
============================================================

Use the existing migration system.

If Alembic is already installed:

create proper migrations.

Do not manually modify production database schema.

Before migration:

inspect existing schema.

Avoid destructive migrations.

Do not delete existing user financial data.

============================================================
61. BACKWARD COMPATIBILITY
============================================================

Existing endpoints must continue working.

Existing:

income

expenses

budgets

goals

net worth

copilot

etc.

must not break.

If an existing table already supports the required functionality:

extend it instead of creating duplicate tables.

============================================================
62. FRONTEND API COMPATIBILITY
============================================================

The backend must support the frontend Financial Profile Service created in the previous task.

The frontend should be able to:

load profile

save section

update section

add loan

remove loan

add goal

remove goal

add FD

update FD

calculate completion

resume setup

============================================================
63. API ERROR FORMAT
============================================================

Use consistent errors.

Example:

{
    "detail": {
        "code": "INVALID_FINANCIAL_DATA",
        "message": "Monthly EMI cannot be negative.",
        "field": "monthly_emi"
    }
}

Do not expose:

SQL errors

stack traces

internal paths

database credentials

provider errors

============================================================
64. RESPONSE DATA
============================================================

Financial profile APIs should return frontend-friendly DTOs.

Do not return raw SQLAlchemy models.

Use Pydantic response schemas.

============================================================
65. TESTING
============================================================

Create comprehensive tests.

Test:

Profile creation

Profile update

Income creation

Expense update

Savings update

Investment update

FD creation

Loan creation

Credit card update

Goal creation

Insurance update

Tax profile update

Completion calculation

Partial profile

Full profile

Missing profile data

Multiple loans

Multiple goals

Multiple FDs

Authentication ownership

Unauthorized access

Cross-user access

FinancialContextBuilder

Agent-specific context

Missing context detection

Data minimization

============================================================
66. CRITICAL SECURITY TEST
============================================================

Create two test users:

User A

User B

User A must NEVER be able to access User B's:

income

expenses

savings

investments

loans

goals

FDs

credit cards

insurance

tax profile

financial context

This test is mandatory.

============================================================
67. AI CONTEXT TESTS
============================================================

Example:

User has:

income = 60000

expenses = 48000

savings = 200000

investments = 500000

loan = 1500000

goal = house

Question:

"How is my financial health?"

Context should include relevant:

income

expenses

savings

investments

loan

goal

It should NOT include:

password

email unless needed

account credentials

irrelevant metadata.

============================================================
68. EDUCATIONAL QUERY TEST
============================================================

Question:

"What is a mutual fund?"

Expected:

No financial profile context required.

EducationAgent only.

This prevents unnecessary financial data from being sent to AI providers.

============================================================
69. BUDGET QUERY TEST
============================================================

Question:

"Am I overspending on food?"

Context:

income

food expenses

food budget

relevant monthly expenses

Do not include:

tax profile

insurance

FD

unless required.

============================================================
70. RETIREMENT QUERY TEST
============================================================

Question:

"Can I retire at 55?"

Context:

age

retirement age if known

income

expenses

savings

investments

goals

relevant debt

If missing:

return missing-data request.

Never invent values.

============================================================
71. NET WORTH QUERY TEST
============================================================

Question:

"What is my net worth?"

Context:

assets

investments

savings

FDs

liabilities

loans

credit card outstanding

Use:

NetWorthEngine

Then AI explains the verified result.

============================================================
72. NO HALLUCINATION RULE
============================================================

If a value is not in PostgreSQL:

the AI must not invent it.

Example:

investment value missing.

Do NOT generate:

"You have ₹5 lakh invested."

Instead:

"I don't have your investment details yet."

============================================================
73. AI CALCULATION RULE
============================================================

LLM must NEVER calculate:

tax

retirement corpus

health score

budget utilization

net worth

goal progress

debt ratio

savings rate

These must come from deterministic Python financial engines.

The project documentation explicitly separates these rule engines from the AI explanation layer. :contentReference[oaicite:2]{index=2}

============================================================
74. CONTEXT VERSION
============================================================

Add a context schema/version.

Example:

FINANCIAL_CONTEXT_VERSION = "1.0"

This helps future changes without breaking agents.

============================================================
75. PERFORMANCE
============================================================

Avoid loading every table for every Copilot message.

Use the planner to determine required domains.

Example:

Budget request

↓

load only:

income

expenses

budgets

Then:

Goal request

↓

load:

income

expenses

savings

goals

Use efficient PostgreSQL queries.

Avoid N+1 queries.

Use eager/selective loading where appropriate.

============================================================
76. TRANSACTION SAFETY
============================================================

For multi-record operations:

use database transactions.

Example:

Saving onboarding section containing multiple investment items:

begin transaction

↓

validate

↓

delete/update affected records if required

↓

insert/update

↓

commit

If failure:

rollback.

Never leave partial inconsistent data.

============================================================
77. UPDATE SEMANTICS
============================================================

Frontend section save must be idempotent.

If user saves:

monthly income = ₹60,000

multiple times,

do not create:

₹60,000

₹60,000

₹60,000

as duplicate primary income records.

Use proper upsert/update semantics.

============================================================
78. DELETE SEMANTICS
============================================================

When user removes a:

Loan

Goal

FD

Credit Card

Investment

ensure it is actually removed or soft-deleted according to the existing project's conventions.

Do not leave deleted data in active financial calculations.

============================================================
79. PROFILE SUMMARY
============================================================

Create a service:

FinancialProfileSummaryService

It can provide:

total assets

total liabilities

monthly income

monthly expenses

monthly savings

investment total

loan EMI total

goal count

profile completion

This summary can support:

Dashboard

AI Context

Health Engine

Net Worth Engine

============================================================
80. DO NOT DUPLICATE CALCULATIONS
============================================================

If:

NetWorthEngine

already calculates net worth,

do not create another net worth formula in:

FinancialProfileService.

Call:

NetWorthEngine.

Same principle for:

Health

Budget

Goal

Retirement

Tax

Cash Flow.

============================================================
81. AI COPILOT INTEGRATION
============================================================

Modify the EXISTING Copilot flow only where necessary.

Current:

User

↓

AI Controller

↓

Intent

↓

Planner

↓

Agent

Update to:

User

↓

AI Controller

↓

Intent

↓

Planner

↓

Determine Required Context

↓

FinancialContextBuilder

↓

Agent-specific Context

↓

Agent

↓

Financial Engine if required

↓

LLM Explanation

↓

Response Builder

============================================================
82. DO NOT BYPASS THE EXISTING ORCHESTRATOR
============================================================

Do not create:

FinancialChatService

that directly calls Gemini.

Do not create:

SecondCopilot

Do not create:

FinancialAIController

The existing AI Controller and Orchestrator remain the entry points.

============================================================
83. CONTEXT INJECTION
============================================================

The existing agents should receive structured context.

Example:

AgentRequest:

{
    "user_message": "...",
    "financial_context": {...},
    "conversation_context": {...}
}

Do not manually concatenate database values inside every agent.

============================================================
84. CONTEXT BUILDER INTERFACE
============================================================

Implement something conceptually like:

FinancialContextBuilder.build(
    user_id,
    required_domains,
    conversation_context=None
)

Return:

FinancialContext

or:

MissingFinancialContext

depending on availability.

============================================================
85. REQUIRED DOMAIN ENUM
============================================================

Create a controlled list such as:

PROFILE

INCOME

EXPENSES

BUDGETS

SAVINGS

INVESTMENTS

FIXED_DEPOSITS

LOANS

CREDIT_CARDS

GOALS

INSURANCE

TAX

NET_WORTH

CASH_FLOW

This avoids arbitrary database loading.

============================================================
86. AGENT CONTEXT REQUIREMENTS
============================================================

Create a centralized mapping.

Example:

BUDGET_AGENT:

INCOME

EXPENSES

BUDGETS

CASH_FLOW

GOAL_AGENT:

INCOME

EXPENSES

SAVINGS

GOALS

RETIREMENT_AGENT:

PROFILE

INCOME

EXPENSES

SAVINGS

INVESTMENTS

GOALS

LOANS

TAX_AGENT:

INCOME

TAX

HEALTH_AGENT:

INCOME

EXPENSES

SAVINGS

LOANS

GOALS

NET_WORTH_AGENT:

SAVINGS

INVESTMENTS

FIXED_DEPOSITS

LOANS

CREDIT_CARDS

INSURANCE

This mapping should be easy to modify.

============================================================
87. CONTEXT REDACTION
============================================================

Before AI provider call:

remove:

user_id

internal database IDs

authentication data

internal audit fields

private metadata

unnecessary timestamps

unless explicitly required.

The LLM should receive meaningful financial information, not database internals.

============================================================
88. FINANCIAL CONTEXT SHOULD BE READ-ONLY
============================================================

Agents should not modify the database through FinancialContext.

Context is a snapshot for analysis.

Any data modification must happen through explicit backend services/actions.

============================================================
89. DATA UPDATE FLOW
============================================================

Example:

User updates savings:

React Native

↓

PUT /financial-profile/savings

↓

Authentication

↓

Pydantic validation

↓

SavingsService

↓

SavingsRepository

↓

PostgreSQL

↓

success

Then the next AI request:

Copilot

↓

FinancialContextBuilder

↓

loads NEW savings value

Therefore the AI always sees current data.

============================================================
90. API DOCUMENTATION
============================================================

FastAPI OpenAPI documentation should clearly document:

request models

response models

validation

authentication

possible errors

Do not expose sensitive examples.

============================================================
91. LOGGING
============================================================

Log:

request ID

user ID hash or safe identifier if existing convention allows

endpoint

execution time

section

success/failure

Do NOT log:

password

OTP

PIN

CVV

API keys

JWT

raw financial profile

full AI context

unless explicitly required for secure debugging.

============================================================
92. FINAL FILE STRUCTURE
============================================================

Adapt to the existing project.

Preferred structure:

app/

financial_profile/

router.py

schemas.py

service.py

completion.py

summary.py

context.py

repositories/

profile_repository.py

income_repository.py

expense_repository.py

savings_repository.py

investment_repository.py

loan_repository.py

goal_repository.py

fd_repository.py

credit_card_repository.py

insurance_repository.py

tax_repository.py

models/

...

ai/

context/

financial_context.py

context_builder.py

context_requirements.py

agents/

...

Do NOT duplicate existing repositories/models.

============================================================
93. IMPLEMENTATION ORDER
============================================================

Implement in this exact order:

1. Inspect existing database models.
2. Inspect existing financial APIs.
3. Inspect existing authentication.
4. Inspect existing Financial Engines.
5. Inspect existing AI Context Builder.
6. Identify duplicates.
7. Extend existing models where appropriate.
8. Create migrations.
9. Create/update Pydantic schemas.
10. Implement repositories.
11. Implement services.
12. Implement completion service.
13. Implement profile summary service.
14. Implement FinancialContextBuilder.
15. Implement agent context requirements.
16. Integrate with existing Copilot.
17. Add API routes.
18. Add tests.
19. Run all backend tests.
20. Fix regressions.

============================================================
94. DO NOT IMPLEMENT FRONTEND
============================================================

The React Native screens already exist or are being implemented separately.

Only provide backend API contracts compatible with them.

Do not modify React Native code.

============================================================
95. FINAL ACCEPTANCE CRITERIA
============================================================

The implementation is complete ONLY when:

✓ New user can save financial profile sections.

✓ User can partially complete onboarding.

✓ Each section can be updated independently.

✓ Multiple loans are supported.

✓ Multiple goals are supported.

✓ Multiple FDs are supported.

✓ Multiple investment items are supported if needed.

✓ Profile completion is calculated by backend.

✓ Missing sections are returned.

✓ Last incomplete section is returned.

✓ No sensitive credentials are collected.

✓ Financial values use Decimal/NUMERIC.

✓ NULL and zero are handled correctly.

✓ All records belong to authenticated users.

✓ Cross-user access is impossible.

✓ Existing financial engines use the stored data.

✓ Existing Copilot can access real user financial data.

✓ Context is built dynamically from PostgreSQL.

✓ Context is current on every relevant Copilot request.

✓ Only relevant financial domains are loaded.

✓ Educational queries do not unnecessarily load financial data.

✓ Agents receive structured context.

✓ LLM does not calculate financial values.

✓ Missing financial data causes clarification instead of hallucination.

✓ Existing AI Controller is preserved.

✓ Existing LangGraph orchestrator is preserved.

✓ Existing provider fallback is preserved.

✓ Existing Copilot APIs continue working.

✓ Existing tests continue passing.

✓ New financial profile tests pass.

✓ AI context tests pass.

✓ Authentication ownership tests pass.

✓ No duplicate financial data is created when onboarding is saved repeatedly.

============================================================
96. FINAL ARCHITECTURE
============================================================

The final system must follow:

React Native
       │
       │ Financial Profile APIs
       ▼
FastAPI
       │
       ▼
Authentication
       │
       ▼
Financial Profile Services
       │
       ▼
Repositories
       │
       ▼
PostgreSQL
       │
       │
       ├───────────────┐
       │               │
       ▼               ▼
Financial Engines   Financial Context Builder
       │               │
       │               ▼
       │         Required Domains
       │               │
       │               ▼
       │        Agent-specific Context
       │               │
       └───────┬───────┘
               ▼
       Existing AI Controller
               │
               ▼
        Intent Classifier
               │
               ▼
             Planner
               │
               ▼
      LangGraph Orchestrator
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
    Budget   Goal      Tax
     Agent   Agent    Agent
       │       │        │
       └───────┼────────┘
               ▼
       Financial Engines
               │
               ▼
        AI Provider Router
               │
       Gemini / Groq / OpenRouter
               │
               ▼
        Response Builder
               │
               ▼
          React Native

============================================================
97. FINAL PRODUCT PRINCIPLE
============================================================

FinArivu must follow this rule:

DATABASE = SOURCE OF TRUTH

PYTHON FINANCIAL ENGINES = SOURCE OF CALCULATIONS

FINANCIAL CONTEXT BUILDER = SOURCE OF AI FINANCIAL CONTEXT

MULTI-AGENT SYSTEM = SOURCE OF DOMAIN REASONING/ORCHESTRATION

LLM = EXPLANATION + EDUCATION + NATURAL LANGUAGE

NEVER:

LLM → invent financial data

LLM → calculate financial values

LLM → directly query PostgreSQL

LLM → modify financial records

Instead:

PostgreSQL

↓

Verified Financial Data

↓

Deterministic Financial Engine

↓

Verified Result

↓

AI Agent

↓

LLM Explanation

This separation is mandatory.

============================================================
98. FINAL TASK
============================================================

Inspect the existing FinArivu backend deeply before modifying anything.

Determine:

1. Which financial tables already exist.
2. Which APIs already exist.
3. Which models can be reused.
4. Which financial engines already exist.
5. Which repositories already exist.
6. Which Context Builder already exists.
7. Which agents already exist.
8. Where duplicate functionality exists.
9. Which migrations are required.
10. How to integrate without breaking the existing Copilot.

Then implement the complete financial data storage and AI-context integration system.

Do not rebuild existing functionality.

Do not create duplicate architecture.

Do not introduce unnecessary infrastructure.

Use PostgreSQL as the single source of truth.

Make the implementation clean, simple, reliable, secure, testable, and ready for the React Native Financial Profile onboarding system.