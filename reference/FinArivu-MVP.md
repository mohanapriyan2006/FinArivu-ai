# 1. COMPLETE PRODUCT BLUEPRINT

## Product Positioning

**FinArivu AI**
AI Personal CFO for Indian Salaried Professionals

Provides:

* Financial Tracking
* Budget Planning
* Goal Planning
* Retirement Planning
* Tax Intelligence
* Net Worth Tracking
* Financial Education

Does NOT provide:

* Stock Recommendations
* Buy/Sell Signals
* Portfolio Management
* Investment Advisory

---

# MVP FEATURES

## Phase 1 Only

### Core Data

1. Authentication
2. User Profile
3. Income Tracking
4. Expense Tracking
5. Expense Categorization

### Planning

6. Financial Health Score
7. Budget Analysis
8. Goal Planning
9. Retirement Calculator
10. Tax Calculator

### Analytics

11. Net Worth Dashboard
12. Insights Dashboard
13. Weekly Financial Report

### AI

14. Financial Education Chatbot

---

# 2. SYSTEM ARCHITECTURE

## High-Level Architecture

```text
+----------------------+
|   React Native App   |
|    Expo SDK + TS     |
+----------+-----------+
           |
           |
           v
+----------------------+
|      FastAPI         |
|    REST Backend      |
+----------+-----------+
           |
           |
    ----------------
    |              |
    v              v

+---------+   +-----------+
| Multi   |   |PostgreSQL |
| AI APIs |   | Database  |
|Groq/Gem/|
|OpenRouter|
+---------+   +-----------+

           |
           v

+----------------------+
| Rule Engines         |
| Financial Score      |
| Budget Engine        |
| Tax Engine           |
| Retirement Engine    |
+----------------------+
```

---

# Frontend Architecture

```text
App.tsx

navigation/

├── AppNavigator.tsx
├── MainTabNavigator.tsx
├── AuthNavigator.tsx

screens/

├── auth/
│   ├── SignInScreen.tsx
│   └── SignUpScreen.tsx
├── onboarding/
│   └── OnboardingScreen.tsx
├── dashboard/
│   └── DashboardScreen.tsx
├── income/
│   └── IncomeScreen.tsx
├── expenses/
│   └── ExpensesScreen.tsx
├── budgets/
│   └── BudgetScreen.tsx
├── goals/
│   └── GoalsScreen.tsx
├── retirement/
│   └── RetirementScreen.tsx
├── tax/
│   └── TaxScreen.tsx
├── networth/
│   └── NetWorthScreen.tsx
├── reports/
│   └── ReportsScreen.tsx
├── chat/
│   └── ChatScreen.tsx
└── profile/
    └── ProfileScreen.tsx

components/

├── charts
├── forms
├── cards
├── lists
├── chatbot
├── layout

services/

├── api.ts
├── auth.ts
├── income.ts
├── expenses.ts
```

---

# Backend Architecture

```text
app/

├── auth/
├── users/
├── income/
├── expenses/
├── budget/
├── goals/
├── retirement/
├── tax/
├── networth/
├── insights/
├── reports/
├── chatbot/

core/

├── config.py
├── security.py
├── database.py

engines/

├── health_score.py
├── budget_engine.py
├── goal_engine.py
├── retirement_engine.py
├── tax_engine.py
```

---

# AI Architecture

```text
User Question
      |
      v

Guardrail Layer

      |
      v

Intent Classifier

      |
      v

Allowed?
  /      \
Yes       No
 |         |
 v         v

GPT      Refuse

 |
 v

Response Filter

 |
 v

User
```

---

# 3. DATABASE DESIGN

## users

```sql
users
```

| Column     | Type      |
| ---------- | --------- |
| id         | UUID PK   |
| clerk_id   | VARCHAR   |
| email      | VARCHAR   |
| created_at | TIMESTAMP |

Indexes

```sql
INDEX(clerk_id)
INDEX(email)
```

---

## profiles

```sql
profiles
```

| Column         | Type    |
| -------------- | ------- |
| id             | UUID    |
| user_id        | UUID FK |
| full_name      | VARCHAR |
| age            | INT     |
| city           | VARCHAR |
| monthly_income | DECIMAL |
| retirement_age | INT     |

---

## income

```sql
income
```

| Column      | Type    |
| ----------- | ------- |
| id          | UUID    |
| user_id     | UUID    |
| amount      | DECIMAL |
| source      | VARCHAR |
| income_date | DATE    |

Indexes

```sql
INDEX(user_id)
INDEX(income_date)
```

---

## expense_categories

```sql
expense_categories
```

| id | UUID |
| name | VARCHAR |

Seed Data

```text
Food
Rent
Travel
Utilities
Healthcare
Entertainment
Education
Shopping
Insurance
Other
```

---

## expenses

```sql
expenses
```

| Column       | Type    |
| ------------ | ------- |
| id           | UUID    |
| user_id      | UUID    |
| category_id  | UUID    |
| amount       | DECIMAL |
| description  | TEXT    |
| expense_date | DATE    |

Indexes

```sql
INDEX(user_id)
INDEX(expense_date)
```

---

## budgets

```sql
budgets
```

| Column        | Type    |
| ------------- | ------- |
| id            | UUID    |
| user_id       | UUID    |
| category_id   | UUID    |
| monthly_limit | DECIMAL |

---

## goals

```sql
goals
```

| Column         | Type    |
| -------------- | ------- |
| id             | UUID    |
| user_id        | UUID    |
| goal_name      | VARCHAR |
| target_amount  | DECIMAL |
| target_date    | DATE    |
| current_amount | DECIMAL |

---

## assets

```sql
assets
```

Types

```text
Cash
Bank
Mutual Fund
Stock
Property
Gold
```

Columns

```sql
id
user_id
asset_type
value
```

---

## liabilities

```sql
id
user_id
liability_type
amount
```

Types

```text
Home Loan
Car Loan
Credit Card
Personal Loan
```

---

## net_worth_history

```sql
id
user_id
net_worth
snapshot_date
```

---

## financial_health_scores

```sql
id
user_id
score
savings_score
debt_score
goal_score
budget_score
emergency_score
created_at
```

---

## ai_conversations

```sql
id
user_id
message
role
created_at
```

---

## weekly_reports

```sql
id
user_id
report_json
generated_at
```

---

# 4. FINANCIAL HEALTH SCORE ENGINE

Score = 100

Weights

```text
Savings Rate       30
Emergency Fund     20
Debt Ratio         20
Goal Progress      15
Expense Discipline 15
```

---

## Savings Rate

```text
Savings Rate =
(Income - Expense) / Income
```

Score

```text
>=30% → 30

20-29% → 25

10-19% → 15

<10% → 5
```

---

## Emergency Fund

```text
Emergency Fund Months =
Emergency Assets /
Monthly Expenses
```

Score

```text
>=6 months → 20

3-5 months → 15

1-2 months → 10

<1 month → 5
```

---

## Debt Ratio

```text
Debt Ratio =
Debt / Annual Income
```

Score

```text
<20% → 20

20-50% → 15

50-100% → 10

>100% → 5
```

---

## Goal Progress

```text
Current / Target
```

Score

```text
>75% = 15

50-75% = 10

25-50% = 5

<25% = 2
```

---

## Expense Discipline

```text
Budget Usage
```

```text
<90% = 15

90-100% = 10

100-110% = 5

>110% = 2
```

Final

```python
score =
savings +
emergency +
debt +
goal +
budget
```

---

# 5. BUDGET ANALYSIS ENGINE

Inputs

```text
Monthly Income
Expenses
Budget Limits
```

Algorithm

```python
for category:

usage =
spent / budget

if usage > 1:
    overspending
```

Overspending Detection

```text
Budget = 5000

Spent = 6500

Overspend = 1500
```

Recommendation

```text
Reduce Food spending by ₹1500
```

Educational wording:

```text
Your spending exceeded your planned budget.
Consider reviewing recurring expenses.
```

---

# 6. GOAL PLANNING ENGINE

Examples

```text
House
Car
Marriage
Vacation
Emergency Fund
```

Formula

```text
Monthly Contribution

=
Target Amount
/
Months Remaining
```

Example

```text
Target = ₹10,00,000

Timeline = 5 years

Months = 60

Monthly Savings

= 10,00,000 / 60

= ₹16,667
```

Progress

```text
Current / Target
```

---

# 7. RETIREMENT CALCULATOR

Inputs

```text
Current Age
Retirement Age
Monthly Expenses
Inflation
```

Formula

Future Expense

```text
FV

=
Expense ×
(1+inflation)^years
```

Corpus

```text
Retirement Corpus

=
Annual Expense × 25
```

Example

```text
Monthly Expense

₹50,000

Age 30

Retire 60

Inflation 6%
```

Future Expense

```text
≈ ₹2.87L/month
```

Corpus

```text
≈ ₹8.6 Crore
```

---

# 8. TAX CALCULATOR (INDIA)

Separate Engine

Never use LLM.

Rule Engine Only.

```python
tax_engine.py
```

Support

### Old Regime

```text
80C
80D
HRA
```

### New Regime

Current slabs configurable in DB/config.

Flow

```text
Income

↓

Regime

↓

Apply Slabs

↓

Calculate Tax

↓

Compare

↓

Show Better Regime
```

---

# 9. NET WORTH ENGINE

Formula

```text
Net Worth

=
Total Assets
-
Total Liabilities
```

Assets

```text
Cash
Bank
Property
Stocks
Mutual Funds
Gold
```

Liabilities

```text
Loans
Credit Cards
```

History Tracking

Every month:

```sql
INSERT INTO net_worth_history
```

Graph

```text
X = Month

Y = Net Worth
```

Use Recharts.

---

# 10. AI CHATBOT

System Prompt

```text
You are FinArivu AI.

Role:
Financial Education Assistant.

Allowed:

Explain budgeting
Explain taxes
Explain retirement planning
Explain savings concepts
Explain financial terms

Not Allowed:

Stock recommendations
Buy/Sell signals
Portfolio advice
Investment recommendations

If asked, politely refuse and explain why.
```

Guardrail Keywords

```text
buy stock
sell stock
multibagger
best stock
target price
intraday
swing trade
options
futures
```

Response

```text
I cannot provide investment advice.

I can explain the concept instead.
```

---

# 11. WEEKLY REPORT GENERATOR

Sections

### Spending Summary

```text
Total Expense
Top Categories
```

### Savings Summary

```text
Income
Savings
Savings Rate
```

### Goals

```text
Progress %
```

### Health Score

```text
Current
Last Week
Change
```

### Recommendations

Educational only.

---

# 12. SECURITY DESIGN

Authentication

```text
Clerk
JWT
Refresh Tokens
```

API Security

```text
Rate Limiting
100 req/min
```

Passwords

```text
Handled by Clerk
```

Encryption

Sensitive Financial Data

```text
AES-256
```

HTTPS

```text
SSL Everywhere
```

Compliance

Indian DPDP Act

Store:

```text
User Consent
Privacy Policy Acceptance
```

Audit Tables

```sql
user_consents
audit_logs
```

---

# 13. DEPLOYMENT

Frontend

```text
Vercel
```

Backend

```text
Railway
```

Database

```text
PostgreSQL
```

Storage

```text
Cloudinary (future)
```

---

# CI/CD

```text
GitHub

↓

Push Main

↓

GitHub Actions

↓

Run Tests

↓

Deploy Vercel

↓

Deploy Railway
```

---

# 14. WEEK-BY-WEEK ROADMAP

## Month 1

### Week 1

* Architecture
* DB Design
* UI Wireframes

### Week 2

* Clerk Authentication
* User Profile

### Week 3

* Income APIs
* Expense APIs

### Week 4

* Expense Categories
* Dashboard

---

## Month 2

### Week 5

* Budget Module

### Week 6

* Financial Health Score

### Week 7

* Goals Module

### Week 8

* Insights Dashboard

---

## Month 3

### Week 9

* Retirement Calculator

### Week 10

* Tax Calculator

### Week 11

* Net Worth Module

### Week 12

* Report Generator

---

## Month 4

### Week 13

* Chatbot

### Week 14

* Security Hardening

### Week 15

* Testing

### Week 16

* Deployment
* Documentation
* Final PPT
* Demo Video

---

# 15. MVP BUILD ORDER (CRITICAL)

Build exactly in this order:

```text
1. Authentication
2. Profile
3. PostgreSQL Setup
4. Income Tracking
5. Expense Tracking
6. Categories
7. Dashboard
8. Budget Module
9. Financial Health Score
10. Goal Planning
11. Retirement Calculator
12. Tax Calculator
13. Net Worth
14. Insights Dashboard
15. Weekly Reports
16. AI Chatbot
17. Testing
18. Deployment
```

This sequence minimizes dependencies, reduces AI complexity, keeps the project within a 4-month student timeline, and aligns with the legally safer "AI Personal CFO / Financial Planning Copilot" positioning recommended in your project analysis and legal review. 
