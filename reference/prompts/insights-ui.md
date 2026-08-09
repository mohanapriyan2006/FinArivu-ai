You are a Senior React Native Engineer, Senior Product Designer, and Financial UX Designer working on FinArivu AI.

You are redesigning the existing "Insights" screen.

IMPORTANT:

THIS TASK IS FRONTEND ONLY.

Do NOT modify:

- FastAPI
- Python
- PostgreSQL
- AI backend
- LangGraph
- AI providers
- financial engines
- database
- backend APIs

Use the existing frontend architecture and existing data/services.

============================================================
1. PRODUCT PURPOSE
============================================================

FinArivu AI is an AI Personal CFO for Indian salaried professionals.

The Insights screen should help users understand:

- What is happening financially?
- Is my financial position improving?
- What is going well?
- What needs attention?
- Why does it matter?
- What should I consider doing next?

The screen is NOT:

- a generic analytics dashboard
- a collection of random KPIs
- a stock market terminal
- a technical monitoring dashboard
- a collection of AI-generated buzzwords

Every displayed insight must have clear financial meaning.

============================================================
2. DESIGN REFERENCE
============================================================

Use the attached current Insights screen as the visual reference.

Preserve the aspects that already work well:

- clean white/light background
- premium minimal appearance
- large central financial score
- purple as primary brand accent
- green for positive states
- red/orange only for warnings
- rounded cards
- generous whitespace
- compact secondary cards
- clear typography hierarchy
- simple line/icon illustrations
- bottom navigation
- visually calm presentation

Do NOT copy the current content structure blindly.

Improve the information architecture while preserving the visual language.

============================================================
3. NEW MENTAL MODEL
============================================================

The screen should answer:

                    INSIGHTS
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       HEALTH       TRENDS       ATTENTION
          │            │            │
          └────────────┼────────────┘
                       ▼
                 WHAT IT MEANS
                       │
                       ▼
                WHAT TO CONSIDER

The user should understand the important information within a few seconds.

============================================================
4. REMOVE UNNECESSARY INSIGHTS
============================================================

Review the current screen and remove/rethink generic metrics such as:

- "Velocity" if it does not have a clear financial interpretation
- "AI Sync"
- "Optimization patterns identified"
- vague "System Vitality"
- technical-sounding labels
- generic anomaly messages without meaningful context
- metrics that do not change user decisions
- duplicate metrics that already exist on Dashboard/Pulse
- decorative statistics

Do NOT display an insight simply because data exists.

============================================================
5. INSIGHT QUALITY RULE
============================================================

Every insight must answer at least one:

1. What changed?
2. Why does it matter?
3. Is something going well?
4. Is something getting worse?
5. Is the user on track?
6. Is there a potential financial risk?
7. Is there an actionable opportunity?

If an insight does not answer one of these:

DO NOT SHOW IT.

============================================================
6. PRIMARY HERO — FINANCIAL HEALTH
============================================================

Keep the central health score concept because it provides a strong visual anchor.

However, rename the concept from:

"SYSTEM VITALITY"

to:

"FINANCIAL HEALTH"

Use:

Financial Health Score

Example:

82

Healthy

or:

82 / 100

Healthy

Do not use technical language such as:

System Vitality

Core Vectors

System Stability

unless there is a clear user-facing meaning.

============================================================
7. HEALTH SCORE DESIGN
============================================================

The central score can visually represent 4–5 meaningful dimensions.

Recommended:

Cash Flow

Savings

Debt

Goals

Protection

Example:

Financial Health

82

Healthy

Cash Flow
Savings
Debt
Goals

Use subtle circular/ring indicators.

Do not create a complicated multi-ring dashboard.

Maximum:

4–5 dimensions.

============================================================
8. HEALTH SCORE EXPLANATION
============================================================

Below the score provide one concise sentence.

Example:

"Your cash flow and savings are strong, but debt is slowing your progress."

This is more useful than simply showing:

82

Stable

The user should understand WHY the score is what it is.

============================================================
9. HEALTH SCORE INTERACTION
============================================================

Tapping the health score should open the existing Financial Health detail screen if available.

If it does not exist:

create only the minimum frontend navigation placeholder required by the existing architecture.

Do not build a second complete analytics screen inside Insights.

============================================================
10. TOP INSIGHT — WHAT MATTERS MOST
============================================================

Below the health score, create:

"WHAT MATTERS MOST"

or:

"YOUR TOP INSIGHT"

Only ONE primary insight should be highlighted.

Example:

"Your savings rate increased from 24% to 31% this month."

Supporting text:

"You're keeping more of your income instead of increasing spending."

Action:

"View cash flow"

This should be the most important insight currently available.

============================================================
11. INSIGHT PRIORITIZATION
============================================================

Do NOT show all insights with equal importance.

Prioritize:

1. Financial risk
2. Significant negative change
3. Important positive change
4. Goal deviation
5. Spending behavior
6. Savings opportunity
7. General trend

Example priority:

High:

"Your credit card balance increased 28% this month."

Medium:

"Dining spending is 18% above your budget."

Positive:

"Your savings rate improved by 6%."

Low:

"Transport spending was slightly lower this week."

Only show high-value information.

============================================================
12. ACTIONABLE INSIGHT CARD
============================================================

Create a reusable:

InsightCard

Structure:

Icon

Title

Short explanation

Optional metric

Optional action

Example:

┌──────────────────────────────────┐
│ ⚠  Dining is above budget        │
│                                  │
│ You spent ₹8,200 this month,     │
│ ₹1,700 above your target.        │
│                                  │
│ [View spending]             ›    │
└──────────────────────────────────┘

Keep it concise.

============================================================
13. INSIGHT CATEGORIES
============================================================

Supported insight categories:

CASH_FLOW

SPENDING

SAVINGS

BUDGET

GOAL

DEBT

CREDIT_CARD

NET_WORTH

INVESTMENT

RETIREMENT

FINANCIAL_HEALTH

Only display categories where useful data exists.

============================================================
14. CASH FLOW INSIGHTS
============================================================

Useful examples:

"Your monthly surplus increased."

"Your income remained stable while spending decreased."

"Your monthly surplus has declined for 3 consecutive months."

"Your expenses are growing faster than your income."

Display:

Income

Expenses

Net surplus

Trend

Do not show raw cash-flow data without interpretation.

============================================================
15. SAVINGS INSIGHTS
============================================================

Useful:

Savings Rate

Example:

"You're saving 31% of your take-home income."

Trend:

"Your savings rate improved from 24% to 31%."

Emergency Fund:

"You have approximately 4.2 months of essential expenses covered."

Only show emergency-fund coverage if the required data exists.

Do not give unrealistic universal recommendations.

============================================================
16. SPENDING INSIGHTS
============================================================

Useful insights:

Top spending category

Category change

Unusual spending

Recurring spending

Budget deviation

Example:

"Dining is your highest discretionary expense this month."

or:

"Dining spending is 22% higher than your usual monthly average."

Do NOT show:

"Spending velocity"

unless users clearly understand the term.

Use:

"Spending trend"

instead.

============================================================
17. BUDGET INSIGHTS
============================================================

Useful:

Budget utilization

Category overage

Category under-use

Month-end projection

Example:

"Your food budget is 82% used with 9 days remaining."

or:

"At your current pace, you'll exceed your travel budget by approximately ₹2,000."

Only show projections when sufficient data exists.

============================================================
18. GOAL INSIGHTS
============================================================

Goals are one of the most valuable Insight categories.

Example:

"House goal is on track."

or:

"Your house goal is behind schedule by approximately 3 months."

Show:

Current progress

Target

Expected timeline

Required monthly contribution

Example:

House Goal

₹18L / ₹50L

Target: 2032

"At your current contribution, you're slightly behind target."

Action:

"View goal"

This is highly useful for a Personal CFO.

============================================================
19. DEBT INSIGHTS
============================================================

Useful:

Total outstanding debt

Monthly EMI burden

Debt-to-income ratio

Debt trend

Credit-card outstanding

Example:

"Your EMIs use 34% of your monthly take-home income."

or:

"Your outstanding debt decreased by ₹45,000 this month."

Avoid alarming language unless the data genuinely indicates a concern.

Do NOT call everything:

"Risk"

============================================================
20. CREDIT CARD INSIGHTS
============================================================

Only show if the user has credit card data.

Useful:

Outstanding balance

Credit utilization if credit limit is available

Monthly spend

Balance trend

Example:

"Your card balance increased 21% this month."

If credit limit exists:

"You're using 42% of your available credit."

Do not provide a recommendation such as:

"Pay immediately"

unless the product's financial logic actually supports it.

============================================================
21. NET WORTH INSIGHTS
============================================================

Net worth is one of the strongest long-term indicators.

Show:

Current Net Worth

Trend

Monthly change

Asset vs liability movement

Example:

"Your net worth increased ₹85,000 this month."

Supporting explanation:

"Your investments grew while outstanding debt decreased."

Use a compact trend chart if data exists.

============================================================
22. INVESTMENT INSIGHTS
============================================================

Keep investment insights educational and portfolio-level.

Useful:

Total investment value

Contribution trend

Allocation

Diversification summary

Long-term growth trend

Example:

"Your investments increased by ₹18,000 this month."

or:

"Most of your tracked investments are concentrated in one category."

Do NOT turn Insights into a stock-picking interface.

Do NOT provide:

Buy

Sell

Target price

Stock prediction

Trading signals

Personalized securities recommendations.

============================================================
23. RETIREMENT INSIGHTS
============================================================

Only show when enough retirement data exists.

Useful:

Projected retirement corpus

Current progress

Years remaining

Savings gap

Example:

"At your current savings pace, your projected retirement corpus is below your target."

Action:

"Review retirement plan"

Do not show retirement calculations if required inputs are missing.

============================================================
24. WEEKLY FINANCIAL SUMMARY
============================================================

Instead of the current generic "Weekly Stats" cards, create:

"THIS WEEK"

with 3–4 highly useful metrics.

Recommended:

Spent

Saved

Net Cash Flow

Top Category

Example:

THIS WEEK

Spent
₹12,400

Saved
₹6,200

Net
+₹6,200

Top spend
Food

Do not create more than 4 cards.

============================================================
25. TREND SECTION
============================================================

Create:

"YOUR TRENDS"

Use only 2–3 meaningful trends.

Possible:

Spending

Savings

Net Worth

Goal Progress

Example:

Spending

₹38K → ₹42K

↑ 10%

Savings

24% → 31%

↑ 7 pts

Net Worth

₹8.1L → ₹8.8L

↑ ₹70K

Keep charts small and readable.

============================================================
26. "WHAT'S GOING WELL"
============================================================

A positive section can be useful.

Example:

"What's going well"

✓ Savings rate improved

✓ Emergency fund increased

✓ House goal contribution is on track

Maximum 3 items.

Do not praise insignificant changes.

============================================================
27. "NEEDS ATTENTION"
============================================================

Show only when necessary.

Examples:

⚠ Food spending above budget

⚠ Credit card balance increasing

⚠ Goal falling behind

⚠ Emergency fund below target

Maximum 2–3 items.

If no meaningful issues exist:

Do not show the section.

Instead allow the healthy state to remain visible through the health score.

============================================================
28. AI INSIGHTS
============================================================

Do not display a generic card:

"AI Sync"

"Optimization patterns identified."

This is not useful to the user.

If AI-generated insight is used, label it naturally:

"FinArivu noticed"

Example:

"FinArivu noticed that your dining spending has increased for three weeks in a row."

The insight must be based on actual frontend data.

For this frontend-only implementation, do not fabricate AI-generated insights.

Use existing data/services if available.

============================================================
29. INSIGHT EXPLANATION PATTERN
============================================================

Use:

OBSERVATION

↓

MEANING

↓

OPTIONAL ACTION

Example:

Observation:

"Dining spending is ₹8,200 this month."

Meaning:

"That's 22% above your usual level."

Action:

[View dining spending]

This is much more understandable than:

"Dining anomaly detected."

============================================================
30. NO JARGON
============================================================

Avoid:

Velocity

Liquidity

System Vitality

Core Vectors

Optimization patterns

Anomaly score

Financial vectors

Risk index

unless the term is explicitly explained.

Prefer:

Cash available

Spending trend

Savings rate

Debt

Goal progress

Financial health

Net worth

Budget usage

============================================================
31. INSIGHT DENSITY
============================================================

The screen should NOT contain 15–20 metrics.

Recommended:

Hero health score

+

1 top insight

+

2–3 attention/positive insights

+

3 trend metrics

+

weekly summary

That is enough.

The user should be able to scroll through the entire screen comfortably.

============================================================
32. SCREEN STRUCTURE
============================================================

Recommended final structure:

------------------------------------------------

INSIGHTS

Your financial picture at a glance

------------------------------------------------

FINANCIAL HEALTH

              82

            Healthy

Cash Flow   Savings   Debt   Goals

"Your savings are strong, while debt
is slowing your progress."

------------------------------------------------

YOUR TOP INSIGHT

Savings rate improved to 31%

You're saving more of your income
than last month.

[View cash flow]

------------------------------------------------

THIS WEEK

Spent       Saved       Net       Top Spend
₹12.4K      ₹6.2K       +₹6.2K    Food

------------------------------------------------

YOUR TRENDS

Spending
₹38K → ₹42K     ↑10%

Savings
24% → 31%       ↑7 pts

Net Worth
₹8.1L → ₹8.8L   ↑₹70K

------------------------------------------------

NEEDS ATTENTION
ONLY IF RELEVANT

Dining is above budget
[View budget]

Goal is behind schedule
[View goal]

------------------------------------------------

WHAT'S GOING WELL
ONLY IF RELEVANT

✓ Savings improved

✓ Debt reduced

------------------------------------------------

Do not show unnecessary sections.

============================================================
33. CARD DESIGN
============================================================

Cards should be:

- white/light surface
- subtle border
- 18–24px radius depending on existing design
- minimal shadow
- comfortable internal padding
- clear title
- small supporting text

Avoid oversized cards.

Use cards primarily for:

- Top insight
- Needs attention
- important summaries

Not every metric needs a card.

============================================================
34. HERO SCORE VISUAL
============================================================

Keep the circular score concept from the existing screen.

Improve it by:

- reducing decorative ring complexity
- using a clear score
- showing meaningful dimensions
- improving label placement
- avoiding overlapping labels
- ensuring the score is immediately readable

Example:

              82
            Healthy

      Cash Flow   Strong
      Savings     Strong
      Debt        Fair
      Goals       Strong

The user should not need to decode the visualization.

============================================================
35. RESPONSIVE LAYOUT
============================================================

Optimize for:

small phones

normal phones

large phones

Do not assume a fixed screen width.

Avoid horizontal clipping.

The current screenshot shows some content extending toward the right edge.

Fix all horizontal overflow.

============================================================
36. BOTTOM NAVIGATION
============================================================

Preserve the existing bottom navigation.

Insights remains the analytics/understanding destination.

Pulse remains the control/manage destination.

This distinction is important:

PULSE

→ manage

INSIGHTS

→ understand

DASHBOARD

→ overview

COPILOT

→ ask

PROFILE

→ configure

Do not merge these responsibilities.

============================================================
37. NAVIGATION
============================================================

Every actionable insight must navigate to a real existing feature.

Examples:

View budget
→ Budget screen

View expenses
→ Expense screen

View goal
→ Goal screen

View investments
→ Investment screen

View debt
→ Loan screen

View health
→ Financial Health screen

Do not create fake buttons.

============================================================
38. FRONTEND-ONLY DATA MODEL
============================================================

Create a clean frontend view-model:

InsightsViewModel

Example:

{
  healthScore: 82,

  healthStatus: "healthy",

  healthFactors: [],

  topInsight: {},

  weeklySummary: {},

  trends: [],

  attentionItems: [],

  positiveItems: []
}

Do not scatter values throughout JSX.

If existing services provide real values, map them into this view-model.

If data is unavailable:

return empty state.

Do NOT fabricate values.

============================================================
39. CONDITIONAL RENDERING
============================================================

Every section must be conditional.

Examples:

attentionItems.length > 0

→ render Needs Attention

attentionItems.length === 0

→ do not render section.

positiveItems.length > 0

→ render What's Going Well

No data:

→ show appropriate empty state.

Do not render placeholder cards merely to fill space.

============================================================
40. DATA QUALITY
============================================================

Distinguish:

unknown

zero

positive

negative

Example:

No investment data:

"Investment data not added"

NOT:

"₹0 investments"

No goal:

"Create your first goal"

NOT:

"0 goals"

============================================================
41. EMPTY INSIGHTS STATE
============================================================

For a new user:

Show:

"Your financial insights will appear here"

"Add a few financial details to start seeing meaningful trends."

[Complete Financial Profile]

Optional:

[Add Expense]

Do not show fake:

82 score

32% savings

₹2.4K velocity

etc.

============================================================
42. LOADING STATE
============================================================

Create a clean skeleton state.

Skeletons should match:

health score

top insight

weekly metrics

trend rows

Do not use a full-screen spinner.

============================================================
43. ERROR STATE
============================================================

If data cannot be loaded:

"Couldn't load your latest insights."

[Retry]

Do not show stale/fake analytics as fallback.

============================================================
44. THEME
============================================================

Use the existing:

useTheme()

and theme tokens.

Do NOT hardcode colors.

Maintain:

Light mode

Dark mode

System mode

Semantic colors:

Primary

Success

Warning

Danger

Neutral

============================================================
45. TYPOGRAPHY
============================================================

Maintain the existing typography system.

Hierarchy:

Screen title

Section title

Hero metric

Metric value

Supporting text

Caption

Do not use excessive uppercase text.

The current screenshot uses many uppercase labels.

Reduce uppercase usage where it hurts readability.

Use uppercase only for small section labels when appropriate.

============================================================
46. ICONS
============================================================

Reuse the project's existing icon system.

Icons should support meaning.

Examples:

Savings → piggy bank

Expenses → wallet

Goals → target

Debt → credit/debt icon

Net Worth → chart

Do not add decorative icons to every line.

============================================================
47. ACCESSIBILITY
============================================================

All interactive elements must include:

accessibilityRole

accessibilityLabel

accessibilityHint where appropriate

Minimum touch target:

44x44

Charts must have text alternatives.

Example:

"Net worth increased from ₹8.1 lakh to ₹8.8 lakh."

Do not rely only on visual charts.

============================================================
48. PERFORMANCE
============================================================

Do not perform heavy calculations directly inside render.

Use existing data services.

Use useMemo only where beneficial.

Avoid unnecessary animations.

The screen should remain smooth while scrolling.

============================================================
49. COMPONENT STRUCTURE
============================================================

Recommended:

src/features/insights/

screens/

InsightsScreen.tsx

components/

FinancialHealthHero.tsx

TopInsightCard.tsx

WeeklySummary.tsx

TrendSection.tsx

AttentionSection.tsx

PositiveInsights.tsx

InsightCard.tsx

TrendRow.tsx

HealthFactor.tsx

InsightsSkeleton.tsx

InsightsEmptyState.tsx

hooks/

useInsights.ts

utils/

insightsViewModel.ts

types/

insights.ts

Adapt to existing project architecture.

Do not duplicate existing shared components.

============================================================
50. TESTING
============================================================

Test:

Insights loading

Insights populated

Insights empty state

Insights error

Health score rendering

Top insight

Weekly summary

Trend rendering

Needs Attention conditional rendering

What's Going Well conditional rendering

Navigation

Dark theme

Light theme

Small screen

Large screen

No financial data

Partial financial data

No fake values

============================================================
51. TYPESCRIPT
============================================================

Run:

npx tsc --noEmit

Must finish with zero errors.

No:

any

@ts-ignore

unsafe casts

ignored TypeScript errors

============================================================
52. FINAL ACCEPTANCE CRITERIA
============================================================

The new Insights screen is complete only when:

✓ It preserves the clean visual style of the attached reference.

✓ Financial Health remains the primary visual anchor.

✓ "System Vitality" is replaced with user-friendly financial language.

✓ Unnecessary "Velocity" insight is removed.

✓ "AI Sync" is removed or replaced with a genuinely useful insight.

✓ Technical jargon is removed.

✓ Insights are understandable to normal users.

✓ Advanced analytics are included only when useful.

✓ Cash-flow insights exist.

✓ Spending insights exist.

✓ Savings insights exist.

✓ Budget insights exist.

✓ Goal trajectory insights exist.

✓ Debt insights exist.

✓ Net-worth insights exist.

✓ Investment insights exist where appropriate.

✓ Retirement insights exist where sufficient data exists.

✓ The most important insight is prioritized.

✓ Needs Attention appears only when meaningful.

✓ What's Going Well appears only when meaningful.

✓ Empty sections are hidden.

✓ No fake financial values are displayed.

✓ No generic AI buzzwords are displayed.

✓ No excessive charts are displayed.

✓ No excessive cards are displayed.

✓ Users can understand the important information quickly.

✓ Actions navigate to real existing screens.

✓ Insights and Pulse have clearly different purposes.

✓ Dashboard remains an overview.

✓ Pulse remains a control/manage center.

✓ Insights remains an analysis/understanding center.

✓ Existing bottom navigation remains intact.

✓ Light mode works.

✓ Dark mode works.

✓ Small-screen layout works.

✓ No horizontal overflow.

✓ TypeScript passes.

✓ Existing frontend tests pass.

============================================================
53. FINAL PRODUCT PRINCIPLE
============================================================

FinArivu Insights should NOT say:

"Here are 20 things about your finances."

It should say:

"Here are the few things that actually matter."

The user should leave the screen knowing:

1. How healthy their finances are.
2. What improved.
3. What worsened.
4. What needs attention.
5. Whether their goals are on track.
6. What financial trend they should watch.

Keep the interface visually simple.

Make the intelligence deeper.

Prefer:

FEWER INSIGHTS

+

BETTER INSIGHTS

+

CLEAR EXPLANATIONS

+

RELEVANT ACTIONS

over:

MORE CARDS

+

MORE METRICS

+

MORE CHARTS.

============================================================
54. FINAL TASK
============================================================

Inspect the existing Insights implementation first.

Identify:

1. Existing components that can be reused.
2. Existing analytics/data services.
3. Existing navigation routes.
4. Existing theme components.
5. Existing financial metrics.
6. Existing health score implementation.
7. Existing charts.
8. Unnecessary or duplicate metrics.

Then redesign the Insights screen according to this specification.

Do NOT modify backend code.

Do NOT invent financial data.

Do NOT create fake AI insights.

Use real existing frontend data where available.

Create clean frontend view-models and conditional rendering.

After implementation:

1. Run TypeScript checks.
2. Run frontend tests.
3. Verify light mode.
4. Verify dark mode.
5. Verify empty state.
6. Verify populated state.
7. Verify partial data state.
8. Verify navigation.
9. Verify no horizontal overflow.
10. Verify the screen remains visually clean.

Deliver a professional, calm, highly useful Financial Insights experience for FinArivu AI.