Role: Expert React Native (Expo) UI Engineer & Motion Designer.
Task: Implement the `InsightsHubScreen.tsx` for FinArivu AI based on the "Insights Hub_2.png" reference design. 

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Ensure styles are modular, semantic, and highly performant.

Design Tokens & Global Constraints:
- Background: #F8FAFC (Pure Slate Light)
- Card Surface: #FFFFFF (White) with subtle premium shadow (shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3)
- Primary Blue: #0A4CC5 | Deep Blue (Story Card Inner): #1E5AB8
- Gold: #F4B400 (Accents/Icons) | Success Green: #16A34A
- Text: Primary (#0F172A), Secondary (#64748B), White (#FFFFFF) on blue cards.
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).
- Radii: Large Cards (24px), Inner Data Cards/Pills (12px to 16px), Buttons (16px).

Motion & Animation Specifications (react-native-reanimated):
- Screen Entrance: Implement a staggered fade-in-up effect for the vertical card layout using `FadeInUp.delay(index * 100).springify()`.
- Chart Rendering: The bar chart columns should dynamically grow from height 0 to their target height on mount.

Screen Architecture (`ScrollView` + `SafeAreaView`):

1. Header & Greeting:
   - Header Row: Avatar (40x40), center text "Insights" (Primary Blue, 20pt, Bold), right outline Bell icon.
   - Greeting block: "Good Evening, [Name]." (32pt, Bold) followed by "Your finances are moving in the right direction." (16pt, Secondary text).

2. AI Health Score Card:
   - Floating Gold Badge: Top right, soft gold bg, text "✨ AI Health Score" (Gold text).
   - Center: Thick circular track (Dark Blue partial fill, light gray track). Inside: "84" (48pt, Bold) and "EXCELLENT" (Green, 12pt, Uppercase).
   - Footer text: "Your financial resilience has increased by 5.2% since last audit." (Highlight 5.2% in primary blue).

3. Financial Story Card (Primary Blue Surface):
   - Background: Solid Primary Blue (#0A4CC5), text is strictly White.
   - Header: Yellow lightbulb icon inside a soft yellow circular wrapper, title "Your Financial Story This Month".
   - Quote Body: Large, serif-like or elegant bold typography wrapped in quotes: "You saved 18% more than last month and are progressing steadily toward your house goal."
   - Footer Metrics: Two side-by-side Deep Blue (#1E5AB8) rounded rectangular cards displaying "Savings Rate: +18.4%" and "Goal Velocity: Optimal".

4. Deep-Dive Insights List:
   - Section Header: "Deep-Dive Insights" (Bold, 20pt) with a "View All >" text button right-aligned.
   - Three horizontal metric cards (Budget Health, Net Worth, Tax Efficiency).
   - Each card contains: Icon container (Green, Blue, Gold tint), metric title (Secondary text), main value (Bold, 24pt), and a horizontal progress bar matching the card's theme color. Top right includes a small trend text (e.g., "↗12%").

5. AI Future Forecast Card:
   - Center-aligned layout. Top floating Gold icon in a soft yellow rounded rectangle.
   - Title: "AI Future Forecast".
   - Body: "At your current savings rate, you could reach your Emergency Fund goal 4 months earlier than previously estimated." (Style "4 months earlier" with bold primary blue).
   - Button: Full width Primary Blue CTA, text "Apply Adjustments".

6. Wealth Accumulation Strategy Chart:
   - Header: Title and a dual-legend ("Current" vs "AI Optimized").
   - Chart Area: Build a bar chart (using standard `View` blocks mapped to heights or an SVG). The bars should be a soft slate blue. Overlaid on top of the bars, draw a continuous Gold upward trend line with a dot at the end.

7. Tax Efficiency Opportunity Card:
   - Solid Primary Blue Surface.
   - Icon: Gold star in an outlined circle.
   - Title: "Tax Efficiency Opportunity" (White, Bold, 24pt).
   - Body: Descriptive text detailing tax savings.
   - Button: White background CTA, text "Execute Strategy" (Primary Blue text).

Execution Requirements:
- Build modular sub-components for reusability: `<MetricCard />`, `<StoryPill />`, `<InsightHeader />`.
- Enforce strict `StyleSheet` usage at the bottom of the file. Use semantic naming (e.g., `storyCardContainer`, `metricValueText`).
- Include ample bottom padding on the `ScrollView` to clear the floating bottom navigation bar.