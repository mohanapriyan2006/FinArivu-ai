You are a Senior React Native Product Designer and Senior React Native Engineer specializing in premium personal-finance applications.

You are working on the existing FinArivu AI mobile application.

The current Pulse screen is NOT conceptually correct.

DO NOT make small cosmetic changes to the existing Pulse screen.

Redesign the Pulse screen around a new product concept:

============================================================
PULSE = PERSONAL FINANCE CONTROL CENTER
============================================================

Pulse is NOT primarily an analytics dashboard.

Pulse is the user's central place to:

- View financial areas
- Track financial activity
- Add financial information
- Modify financial information
- Monitor progress
- Manage goals
- Track investments
- Manage expenses
- Review liabilities
- Access financial tools
- See what needs attention
- Quickly perform common financial actions

The experience should feel like a calm, intelligent personal finance control center.

It must NOT look like:

- airplane controls
- enterprise admin dashboard
- stock trading terminal
- dense analytics dashboard
- technical monitoring console

The design should feel:

- clean
- premium
- calm
- intuitive
- personal
- trustworthy
- modern
- finance-focused
- action-oriented

============================================================
1. TECHNOLOGY CONSTRAINT
============================================================

FRONTEND ONLY.

Use:

- React Native
- Expo
- TypeScript
- Existing project navigation
- Existing theme system
- React Native StyleSheet.create()

Do NOT modify:

- FastAPI
- Python
- PostgreSQL
- backend APIs
- database
- AI infrastructure

Do NOT introduce:

- Redux
- Zustand
- MobX
- Firebase
- NativeWind
- Tailwind
- new CSS frameworks
- unnecessary dependencies

Reuse existing components, hooks, theme, icons and navigation wherever possible.

============================================================
2. FIRST INSPECT THE EXISTING PROJECT
============================================================

Before coding, inspect:

- Current PulseScreen
- Bottom navigation
- Dashboard
- Expense screens
- Budget screens
- Goal screens
- Investment screens
- Loan screens
- Profile screens
- Financial Profile screens
- ThemeContext
- existing reusable Card components
- Button components
- typography
- spacing
- navigation structure
- existing data/services

Identify existing functionality that can be reused.

Do NOT duplicate existing screens unnecessarily.

============================================================
3. NEW PRODUCT MENTAL MODEL
============================================================

Think of Pulse as:

                  PULSE
                    │
        ┌───────────┼────────────┐
        │           │            │
       VIEW        TRACK        ACT
        │           │            │
        ▼           ▼            ▼
     finances    progress      update
     status      activity      records
                    │
                    ▼
                 CONTROL

The user should immediately understand:

"What can I manage from here?"

============================================================
4. SCREEN PURPOSE
============================================================

The Pulse screen should answer:

1. What financial areas do I have?
2. Which areas need attention?
3. What can I quickly manage?
4. What changed recently?
5. What can I update?
6. Where can I go next?

It should NOT try to show every financial metric.

Detailed analytics belong in the respective feature screens.

============================================================
5. TOP HEADER
============================================================

Create a clean header:

Pulse

Subtitle:

"Your financial control center"

Optional right-side:

search

or

settings/filter

Do NOT overload the header.

Avoid decorative charts.

============================================================
6. QUICK ACTION AREA
============================================================

At the top, provide a compact quick-action row.

Examples:

+ Expense

+ Goal

+ Investment

+ Loan

Use horizontally scrollable action chips/cards if necessary.

Keep the number small.

Maximum:

4 quick actions visible.

Example:

┌──────────────┐
│ + Expense    │
└──────────────┘

┌──────────────┐
│ + Goal       │
└──────────────┘

┌──────────────┐
│ + Investment │
└──────────────┘

┌──────────────┐
│ + More       │
└──────────────┘

Every action must navigate to a real existing screen or existing flow.

Do not create decorative buttons.

============================================================
7. CORE SECTION — MY FINANCES
============================================================

Create a primary section:

"MY FINANCES"

This is the heart of Pulse.

Use clean rows/cards.

Suggested areas:

Expenses

Budget

Savings

Investments

Goals

Loans & EMIs

Credit Cards

Insurance

Tax

Net Worth

Do NOT display all of them as giant cards.

Use compact control rows.

Example:

────────────────────────────

MY FINANCES

💳 Expenses
Track spending
This month ₹42,500
                         ›

📊 Budget
4 categories tracked
                         ›

🎯 Goals
2 active goals
68% average progress
                         ›

📈 Investments
₹8.5L total
                         ›

🏦 Loans & EMIs
2 active loans
₹32,000 / month
                         ›

────────────────────────────

Keep each row compact.

============================================================
8. CATEGORY ROW DESIGN
============================================================

Create a reusable:

FinanceControlRow

Structure:

Icon

Title

Small status/value

Optional progress indicator

Chevron

Example:

┌────────────────────────────────────┐
│  ◉   Expenses                      │
│      ₹42,500 this month        ›    │
└────────────────────────────────────┘

OR:

┌────────────────────────────────────┐
│  🎯   House Goal                   │
│      ₹18L / ₹50L              ›    │
│      ━━━━━━━━━━━━━░░░░             │
└────────────────────────────────────┘

Avoid excessive card nesting.

============================================================
9. CONTROL ACTIONS
============================================================

Every finance section should conceptually support:

VIEW

ADD

EDIT

TRACK

For example:

Expenses:

View Expenses

Add Expense

Edit Categories

Track Budget

Goals:

View Goals

Create Goal

Update Progress

Edit Goal

Investments:

View Investments

Add Investment

Update Value

View Allocation

Loans:

View Loans

Add Loan

Update EMI

View Debt Progress

The Pulse screen does NOT need to expose every action directly.

Instead:

Tap the category

↓

Open its dedicated feature screen.

Long lists of buttons are NOT allowed.

============================================================
10. "NEEDS ATTENTION" SECTION
============================================================

This is an important part of Pulse.

Create:

"Needs Attention"

ONLY show this section if there are actual items requiring attention.

Examples:

⚠ Food spending is above budget

→ View budget

🎯 House goal is behind schedule

→ Review goal

💳 Credit card balance increased

→ View card

🏦 EMI due soon

→ View loans

If there is nothing important:

DO NOT SHOW THE SECTION.

Do not create fake alerts.

Do not fill the UI unnecessarily.

============================================================
11. RECENT ACTIVITY
============================================================

Create:

"Recent Activity"

Show only meaningful financial changes.

Examples:

Expense added

₹1,250
Dining
Today

Goal updated

House Fund
+₹10,000

Investment updated

Mutual Funds
₹25,000

Loan payment

Home Loan
₹22,000

Keep it compact.

Maximum 5 items.

Provide:

"View all"

if the existing application has an activity screen.

============================================================
12. GOALS CONTROL
============================================================

Goals deserve special treatment because they are action-oriented.

Create a compact:

"Goals" section.

Example:

GOALS

House
₹18L / ₹50L
━━━━━━━━━━━━░░
Target 2032

Emergency Fund
₹1.2L / ₹2L
━━━━━━━━━━░░░

[ View Goals ]

Do not create multiple huge cards.

Maximum 2–3 visible goals.

============================================================
13. INVESTMENT CONTROL
============================================================

Do NOT turn Pulse into a stock-trading interface.

Investment section should be simple:

INVESTMENTS

Total
₹8.5L

This month
+₹12,500

Optional allocation:

MF     55%
Stocks 25%
PPF    12%
Other   8%

[ View Investments ]

The user should be able to:

View

Add

Update

Track

through the investment feature.

Do not show complex market charts on Pulse.

============================================================
14. EXPENSE CONTROL
============================================================

Show:

EXPENSES

This month:

₹42,500

vs last month:

+8%

Optional:

Top category:

Food ₹8,200

Then:

[ View Expenses ]

[ + Add Expense ]

Do not show a large 7-day analytics chart.

Detailed spending analysis belongs in the Expense screen.

============================================================
15. BUDGET CONTROL
============================================================

Show compact status:

BUDGET

₹42,500 / ₹50,000

85% used

━━━━━━━━━━━━━━━━░

2 categories need attention

[ View Budget ]

No complex charts.

============================================================
16. SAVINGS CONTROL
============================================================

Show:

SAVINGS

₹2.5L

Emergency fund:

₹1.5L / ₹2L

━━━━━━━━━━━━━━░

[ View Savings ]

If emergency fund is not configured:

Show:

"Set emergency target"

as an optional action.

============================================================
17. DEBT CONTROL
============================================================

Show:

LOANS & EMIs

2 active loans

₹32,000 monthly EMI

Outstanding:

₹18.4L

[ View Loans ]

Optional attention state:

"EMI burden is high"

Only if the backend/financial engine eventually provides this.

For frontend-only implementation, use existing mock/service data if available.

Do NOT invent financial warnings.

============================================================
18. CREDIT CARD CONTROL
============================================================

Show only if the user has added credit cards.

Example:

CREDIT CARDS

Outstanding
₹35,000

Monthly spend
₹28,000

[ View Cards ]

If no credit cards:

Do not show a large empty card.

Instead:

"Add a credit card"

can appear under an optional section.

============================================================
19. EMPTY STATES
============================================================

Empty states must be useful.

Example:

INVESTMENTS

"You haven't added any investments yet."

[ Add Investment ]

Goals:

"Set your first financial goal."

[ Create Goal ]

Loans:

"No loans added."

[ Add Loan ]

Do not show:

₹0

unless the user explicitly entered zero.

============================================================
20. PROFILE COMPLETION
============================================================

If financial profile completion is below the configured threshold:

Show a small card near the bottom or top:

"Complete your financial profile"

"68% complete"

"Add a few more details to improve your Personal CFO insights."

[ Continue Setup ]

Do not dominate the Pulse screen.

Do not show if completion is above threshold.

Reuse the existing Financial Profile completion logic.

============================================================
21. SEARCH / FILTER
============================================================

Do NOT add complicated filtering initially.

If useful, add a simple:

search

or

"Manage" button.

Possible filter:

All

Expenses

Goals

Investments

Loans

Other

But only implement if the existing information architecture benefits from it.

Prefer simplicity.

============================================================
22. PULSE HOME LAYOUT
============================================================

Recommended structure:

┌─────────────────────────────────────┐
│ Pulse                               │
│ Your financial control center       │
└─────────────────────────────────────┘

Quick Actions

[+ Expense] [+ Goal] [+ Investment] [+ More]

─────────────────────────────────────

NEEDS ATTENTION
only if required

⚠ Food spending is above budget    ›

─────────────────────────────────────

MY FINANCES

Expenses
₹42,500 this month                 ›

Budget
85% used                           ›

Savings
₹2.5L                              ›

Investments
₹8.5L                              ›

Goals
2 active                           ›

Loans & EMIs
₹32,000 monthly                   ›

─────────────────────────────────────

RECENT ACTIVITY

Expense added
₹1,250 · Dining

Goal contribution
₹10,000 · House

Investment updated
₹25,000 · Mutual Fund

─────────────────────────────────────

[ Complete Financial Profile ]
only when needed

============================================================
23. DO NOT USE THE CURRENT PULSE ANALYTICS DESIGN
============================================================

Remove/rethink the current:

Cash Flow 30D card

Income vs Spend giant card

Spending Velocity chart

7-Day Analysis chart

Core Vectors dashboard

Large analytical graphs

These are useful analytics but they do NOT define Pulse.

Move such analytics to:

Dashboard

Expense Analysis

Cash Flow

Budget Analysis

Financial Health

Reports

depending on existing application structure.

============================================================
24. VISUAL HIERARCHY
============================================================

Pulse should have:

1. Header
2. Quick actions
3. Needs attention
4. My Finances
5. Recent activity
6. Profile completion if necessary

Do not create 8–10 large sections.

The user should understand the screen within 3 seconds.

============================================================
25. DESIGN STYLE
============================================================

Use the existing FinArivu theme.

Desired visual characteristics:

- white/light surfaces in light mode
- dark surfaces in dark mode
- subtle borders
- moderate corner radius
- clear typography
- restrained icons
- generous spacing
- minimal shadows
- strong hierarchy

Avoid:

- excessive gradients
- neon colors
- excessive glow
- oversized icons
- excessive pills
- dense dashboards
- excessive charts
- decorative data visualization

============================================================
26. COLOR SEMANTICS
============================================================

Use existing theme tokens.

Semantic colors:

Primary:

main FinArivu brand color

Success:

positive financial status

Warning:

needs attention

Danger:

critical financial state

Neutral:

normal status

Do NOT hardcode arbitrary colors.

Use:

useTheme()

============================================================
27. DARK MODE
============================================================

Pulse must work correctly in:

Light

Dark

System

Verify:

background

cards

text

icons

borders

progress bars

warning states

empty states

buttons

all respect the existing theme.

============================================================
28. RESPONSIVE MOBILE LAYOUT
============================================================

Optimize for:

small phones

normal phones

large phones

Use:

SafeAreaView

ScrollView

contentContainerStyle

responsive spacing

Do not hardcode screen heights.

Avoid horizontal overflow.

============================================================
29. BOTTOM NAVIGATION
============================================================

Keep the existing bottom navigation.

Pulse remains the central finance control destination.

Do not redesign the entire navigation.

Ensure the Pulse tab clearly communicates:

"Manage / control your finances."

If the current icon does not represent Pulse appropriately, reuse an existing suitable icon from the project.

Do not introduce a completely unrelated icon style.

============================================================
30. REAL NAVIGATION
============================================================

Every major Pulse section must navigate to the real existing screen.

Examples:

Expenses
→ Expense screen

Budget
→ Budget screen

Goals
→ Goals screen

Investments
→ Investment screen

Loans
→ Loans screen

Savings
→ Savings screen if available

Insurance
→ Insurance screen if available

Tax
→ Tax screen if available

Profile
→ Financial Profile screen

Do NOT create fake placeholder screens.

If a target screen does not exist:

Create the minimum navigation stub only if required by the existing project architecture.

Clearly mark it as pending backend/data integration.

============================================================
31. QUICK ACTION BEHAVIOR
============================================================

Examples:

+ Expense

→ open existing Add Expense flow.

+ Goal

→ open existing Create Goal flow.

+ Investment

→ open existing Add Investment flow.

+ More

→ show a compact bottom sheet:

Add:

Expense

Goal

Investment

Loan

Savings

FD

Insurance

Credit Card

Do not create a giant action grid.

Maximum 2 columns if using a grid.

============================================================
32. BOTTOM SHEET
============================================================

If a "More" action menu is needed:

Use a clean bottom sheet.

Example:

Add to FinArivu

Expense             Goal

Investment          Loan

Savings             Fixed Deposit

Insurance           Credit Card

[ Cancel ]

Use simple icons.

Do not make it look like a settings panel.

============================================================
33. INTERACTION FEEDBACK
============================================================

Interactions should feel polished.

Use:

- subtle press feedback
- small scale/opacity changes
- smooth navigation
- optional layout animation

Do NOT over-animate.

Pulse is a financial tool, not a game.

============================================================
34. DATA SOURCE
============================================================

For this task:

FRONTEND ONLY.

Do not implement backend data fetching.

If existing services already provide data:

reuse them.

If real data is unavailable:

use a clearly isolated local mock/view-model layer.

Do NOT scatter fake values throughout components.

Create:

pulseViewModel.ts

or equivalent.

This will later be replaced with FastAPI data.

============================================================
35. NO FAKE FINANCIAL INSIGHTS
============================================================

Do NOT create fake warnings such as:

"Your spending is too high"

unless real existing data supports it.

Do NOT invent:

investment gains

loan warnings

budget percentages

goal progress

financial health values.

If data is unavailable:

show an appropriate empty state.

============================================================
36. REUSABLE COMPONENTS
============================================================

Create only useful reusable components.

Recommended:

PulseHeader

PulseQuickActions

PulseSection

FinanceControlRow

AttentionCard

GoalMiniCard

RecentActivityRow

ProfileCompletionCard

AddFinanceBottomSheet

Do not create unnecessary abstraction layers.

============================================================
37. TYPESCRIPT TYPES
============================================================

Create strong types.

Example:

type PulseFinanceItem = {
  id: string;
  type:
    | "expense"
    | "budget"
    | "savings"
    | "investment"
    | "goal"
    | "loan"
    | "credit_card"
    | "insurance"
    | "tax";

  title: string;
  subtitle?: string;
  value?: string;
  status?: "normal" | "warning" | "attention";
};

No any.

No unsafe casts.

============================================================
38. ACCESSIBILITY
============================================================

Every interactive element must have:

accessibilityRole

accessibilityLabel

accessibilityHint when useful

Minimum touch target:

44x44

Examples:

"Open expenses"

"Create financial goal"

"View investments"

"Complete financial profile"

============================================================
39. PERFORMANCE
============================================================

Do not perform expensive calculations directly inside render.

Use:

useMemo

only when justified.

Avoid unnecessary re-renders.

Use FlatList for long activity lists.

Pulse itself should remain lightweight.

============================================================
40. SCROLL BEHAVIOR
============================================================

Use:

ScrollView

for the main Pulse screen if content remains reasonably small.

If recent activity becomes long:

use FlatList or optimized list structure.

Avoid nested vertical ScrollViews.

============================================================
41. ERROR STATES
============================================================

If existing financial data service fails:

show a small non-blocking state.

Example:

"Some financial data couldn't be loaded."

[Retry]

Do not crash the Pulse screen.

Do not display fabricated values as fallback.

============================================================
42. LOADING STATE
============================================================

Create a clean skeleton/loading state.

Do not use a full-screen spinner.

Use subtle placeholders for:

quick actions

finance rows

activity rows

Keep loading under approximately the same visual structure as the final UI.

============================================================
43. EMPTY PULSE STATE
============================================================

For a completely new user:

Show:

"Your financial control center"

"Add your first financial details to start tracking your money."

Quick actions:

+ Expense

+ Goal

+ Investment

+ More

And:

"Complete your financial profile"

[Set up now]

Do not show fake analytics.

============================================================
44. EXISTING USER STATE
============================================================

If financial data exists:

Show the relevant sections.

Do not show empty sections unnecessarily.

Example:

User has:

expenses

goals

investments

but no loans.

Pulse should show:

Expenses

Goals

Investments

and optionally:

"+ Add another financial area"

Do not display a huge:

"Loans = ₹0"

card.

============================================================
45. INFORMATION DENSITY
============================================================

The current Pulse screen contains too much analytical information.

Reduce information density.

Target:

Approximately 5–7 primary finance controls.

Each should be understandable in:

less than 2 seconds.

The user should not need to interpret charts.

============================================================
46. PRODUCT LANGUAGE
============================================================

Use human language.

Prefer:

"Your investments"

instead of:

"Investment Portfolio Metrics"

"Loans & EMIs"

instead of:

"Liability Exposure"

"Spending"

instead of:

"Spending Velocity"

"Goals"

instead of:

"Goal Vector"

"Needs attention"

instead of:

"Risk Alerts"

Avoid technical financial jargon.

============================================================
47. MICROCOPY
============================================================

Examples:

Header:

"Your financial control center"

Quick action:

"Add expense"

"My Finances"

"Everything you're tracking in one place."

Needs Attention:

"Needs your attention"

Recent:

"Recent activity"

Profile:

"Complete your financial profile"

Use concise text.

============================================================
48. REMOVE UNNECESSARY ANALYTICS
============================================================

Do not include:

large cash flow charts

large bar charts

velocity charts

complex financial graphs

multiple KPI cards

unless the user explicitly navigates to a detailed analysis screen.

Pulse is for:

CONTROL

not:

DEEP ANALYSIS.

============================================================
49. FRONTEND ARCHITECTURE
============================================================

Suggested:

src/features/pulse/

screens/

PulseScreen.tsx

components/

PulseHeader.tsx

PulseQuickActions.tsx

FinanceControlRow.tsx

NeedsAttention.tsx

RecentActivity.tsx

ProfileCompletionCard.tsx

AddFinanceBottomSheet.tsx

hooks/

usePulse.ts

utils/

pulseViewModel.ts

types/

pulse.ts

Adapt this to the existing project structure.

Do not duplicate existing shared components.

============================================================
50. TESTING
============================================================

Test:

Pulse loads

Pulse loading state

Pulse empty state

Pulse with data

Quick action navigation

Finance row navigation

More bottom sheet

Profile completion card

Needs attention visibility

Recent activity rendering

Dark theme

Light theme

Small screen

Large screen

No-data handling

Service failure

============================================================
51. TYPESCRIPT CHECK
============================================================

Run:

npx tsc --noEmit

Fix every error.

No:

any

@ts-ignore

@ts-expect-error

unsafe casts

============================================================
52. FINAL ACCEPTANCE CRITERIA
============================================================

The new Pulse screen is complete only when:

✓ Pulse feels like a personal finance control center.

✓ Pulse is NOT an analytics dashboard.

✓ User can quickly add financial information.

✓ User can access existing financial areas.

✓ User can view financial status.

✓ User can track goals.

✓ User can manage expenses.

✓ User can manage investments.

✓ User can manage loans.

✓ User can access savings.

✓ User can access other financial areas.

✓ Quick actions are useful.

✓ Every action actually works.

✓ No fake navigation.

✓ No fake financial values.

✓ No unnecessary charts.

✓ No excessive cards.

✓ No airplane-control style interface.

✓ No dense enterprise dashboard.

✓ Empty sections are handled elegantly.

✓ Needs Attention appears only when relevant.

✓ Recent Activity appears only when useful.

✓ Financial Profile completion appears only when needed.

✓ Existing navigation remains intact.

✓ Existing theme remains intact.

✓ Dark mode works.

✓ Light mode works.

✓ UI works on different phone sizes.

✓ No backend changes.

✓ No unnecessary dependencies.

✓ TypeScript passes.

✓ Existing frontend tests pass.

============================================================
53. FINAL DESIGN PRINCIPLE
============================================================

Remember:

PULSE IS THE PLACE WHERE THE USER CONTROLS THEIR FINANCES.

Not:

"Here are some charts."

Instead:

"What are you managing?"

"What needs attention?"

"What can you update?"

"What changed?"

"What do you want to do?"

The ideal user experience is:

OPEN PULSE

↓

SEE FINANCIAL AREAS

↓

SEE WHAT NEEDS ATTENTION

↓

TAKE ACTION

↓

RETURN TO FINANCIAL LIFE

Keep it simple, calm, useful and human.

Do not make Pulse look like an airplane cockpit. 😄

============================================================
54. FINAL TASK
============================================================

Inspect the existing Pulse implementation and related financial screens.

Then completely redesign Pulse according to this specification.

Preserve existing functionality where appropriate.

Reuse existing navigation and components.

Implement the UI and interactions fully on the frontend.

Do not modify the backend.

Do not invent financial data.

Do not add unnecessary infrastructure.

After implementation:

1. Run TypeScript checks.
2. Run frontend tests.
3. Verify all navigation.
4. Verify empty state.
5. Verify populated state.
6. Verify quick actions.
7. Verify bottom sheet.
8. Verify dark mode.
9. Verify light mode.
10. Verify small-screen layout.
11. Fix all issues before completing.