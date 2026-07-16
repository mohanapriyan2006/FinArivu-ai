Role: Expert React Native (Expo) UI Engineer & Data Viz Specialist.
Task: Implement three deep-dive insight screens for the FinArivu AI app: `BudgetAnalysisScreen.tsx`, `NetWorthScreen.tsx`, and `TaxIntelligenceScreen.tsx`.

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Create modular, clean, and highly performant style definitions. Code must be production-ready and broken into reusable sub-components.

Design Tokens & Global Constraints:
- Background: #F8FAFC (Pure Slate Light)
- Card Surface: #FFFFFF (White) with subtle shadow (shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3)
- Primary Blue: #0A4CC5 | Dark Blue: #083A96
- Gold: #F4B400 | Success Green: #16A34A | Warning Orange: #F59E0B | Danger Red: #DC2626 | Alert Red Tint: #FEF2F2
- Text: Primary (#0F172A), Secondary (#64748B)
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).
- Radii: Large Cards (24px), Inner Data Cards/Pills (12px-16px), Buttons (16px).

Motion & Animation Specifications (react-native-reanimated):
- Screen Entrance: Implement staggered `FadeInUp` for list items and cards.
- Progress Bars & Gauges: Must animate from 0 to their target values using `withSpring` or `withTiming` on mount.

---

Screen 1: BudgetAnalysisScreen.tsx (Based on Budget Analysis_2.png)
Architecture: `ScrollView` (showsVerticalScrollIndicator={false}).
1. Header: Avatar, center title "Insights", right bell icon.
2. Monthly Budget Health Card: Title, "87% On Track" (Bold, 24pt), Green "Good" pill badge. Include a horizontal progress bar (Blue fill, light gray track) and a bottom descriptive text.
3. Spending Ecosystem Card: 
   - A custom segmented donut chart or stacked bar component representing spending.
   - Center value "Total Spend: ₹42,850".
   - Legend grid below it: 2 columns, colored dots matching the chart (Housing, Food, Transport, Health, Others).
4. Overspending Alert Card:
   - Soft red background (#FEF2F2) with 1px solid red border.
   - Warning icon, Title "Food Spending", huge red text "+22% Above Average".
5. AI Smart Tip Card:
   - Soft yellow background. Floating gold AI icon.
   - Text tip with highlighted metric "4.2%" in green. Primary Blue "Apply Plan" button.
6. Weekly Spending Journey:
   - Horizontal scroll or flex-row of 4 mini-cards (Week 1 to 4).
   - Each contains: Amount, Status Dot (Blue, Red, Green), and Status Text (Frugal, Peak, Normal, Optimized).
7. Notable Adjustments List: 
   - Icon leading, title, subtitle, and trailing saved amount (Green) or cost (Gray).

---

Screen 2: NetWorthScreen.tsx (Based on Net Worth Analysis_2.png)
Architecture: `ScrollView` (showsVerticalScrollIndicator={false}).
1. Header: Avatar, center title "Networth Analysis", right bell icon.
2. Hero Net Worth Card: 
   - Clean white card with abstract watermark shapes in the background.
   - Gold AI Insight badge. Text "Total Net Worth", Value "₹12.8 Lakh" (Primary Blue, 32pt, Bold), Green pill "+11.2% this year".
3. Growth Timeline Card: 
   - Implement a bezier line chart (react-native-svg).
   - Top right: "Last 12 Months" toggle pill. Bottom: X-axis month labels.
4. Asset Breakdown Grid:
   - 2-column flex-wrap layout.
   - 6 Cards (Mutual Funds, Property, Stocks, Gold, Bank, Cash). 
   - Each card: Soft colored icon box, Title (Secondary text), Value (Bold, 16pt), Trend percentage (+ in green, - in red).
5. Liabilities List:
   - Stacked cards with a soft red icon box. Values in red text (e.g., "₹24,500").
6. Floating Bottom CTA: Absolute positioned full-width button at the bottom: "Ask AI to Optimize Wealth" (Primary Blue, White text, AI icon).

---

Screen 3: TaxIntelligenceScreen.tsx (Based on Tax Intelligence_2.png)
Architecture: `ScrollView` (showsVerticalScrollIndicator={false}).
1. Header: Avatar, center title "Tax Intelligence", right bell icon.
2. Hero Savings Card (Dark Blue):
   - "Potential Tax Savings: ₹18,500" (White, Bold).
   - Visual: Implement a 3-tier SVG inverted funnel (Gross Income -> Deductions -> Taxable Income -> Tax Due) using distinct block colors (Blue, Gold, Dark Blue).
3. Tax Saving Insight Card: Gold theme, insight text, "Compare Regimes >" clickable link.
4. Tax Health Score: Circular gauge chart displaying "72" (Excellent).
5. Regime Comparison Section:
   - Segment toggle: "FY 2024-25" / "FY 2023-24".
   - Old Regime Card: Gray border. Rows for Base Tax, Deductions Benefit (Green text), Effective Tax.
   - New Regime Card: Primary Blue border. "RECOMMENDED" badge overlapping top right. "Simplified" sub-badge. Highlighted savings in blue.
6. Deduction Explorer List:
   - List of items (80C, 80D, NPS, House Rent).
   - Each item has a title, status text (Maxed Out, Action Needed), and a horizontal progress bar indicating limit utilization. Red bar for "Action Needed", Green for "Maxed Out".
7. Bottom CTA: "Generate Tax Optimization Report" (Primary Blue solid button).

Execution Requirements:
- Build isolated, highly reusable components for standard elements (e.g., `<ProgressBar />`, `<MetricCard />`, `<IconBadge />`).
- Enforce strict `StyleSheet` usage at the bottom of the files. Use clear semantic naming for your style objects (e.g., `regimeCardActive`, `funnelContainer`).
- Add safe area bottom padding to ensure the UI isn't blocked by the device home indicator or the floating nav bar.