You are a Senior React Native UI Engineer specializing in Android-first performance, Reanimated, and custom pixel-perfect UI development. 

Your task is to build the `InsightsScreen.tsx` component for FinArivu AI. This must be a pixel-perfect implementation based on the provided UI designs ("Insights.png" and "Insights-dark.png"), with an additional "Weekly Stats" enhancement at the bottom.

---

### 1. TECHNICAL STACK & RULES
*   **Framework:** React Native + Expo (TypeScript).
*   **Styling:** Pure React Native `StyleSheet` ONLY. Absolutely NO Tailwind CSS or NativeWind.
*   **Theme:** Consume colors dynamically from our custom `useTheme()` hook. 
*   **Animations:** Use `react-native-reanimated` for the circular gauge draw animation and floating elements.
*   **Safe Area & Android:** Ensure `SafeAreaView` is correctly implemented for Android status bars. Use Android `elevation` for card shadows and optimize layout for 60fps scrolling.

---

### 2. VISUAL ARCHITECTURE & LAYOUT

#### A. Header Section
*   **Layout:** Flex row, space-between, centered vertically.
*   **Left:** Circular user avatar or a futuristic bot icon (purple/indigo tint).
*   **Center:** Title "Cognitive Finance" in the primary indigo color, bold, size 18px.
*   **Right:** Settings gear icon (muted color).

#### B. Hero Section: System Vitality Gauge
*   **Title:** "SYSTEM VITALITY" centered above the gauge (uppercase, tracking/letter-spacing: 1.5px, muted text, size 12px).
*   **The Gauge (SVG & Reanimated):** 
    *   Draw inspiration from "Insights-dark.png". It consists of 2-3 thin, concentric circular tracks.
    *   Center Text: Large "82" in Success Green (`#16A34A`), bold, size 56px. Below it, "STABLE" (muted, size 14px, uppercase).
    *   **Floating Badges:** Attached to the outer ring, implement two small, dark pill badges: "Liquidity" (top right, with a green status dot) and "Debt" (bottom left, with a green status dot). Use `withRepeat` and `withSequence` from Reanimated to give these badges a very subtle, slow floating/breathing effect.

#### C. Asymmetrical Masonry Grid (The Cards)
*   Based on "Insights-dark.png", build a two-column flex layout.
*   **Left Column (Anomaly Card):**
    *   Takes up ~50% width. Taller height.
    *   Icon: Red warning triangle.
    *   Title: "Anomaly" (bold, size 18px).
    *   Description: "Unusual subscription charge detected." (muted, size 14px).
    *   Footer: "Action Req ->" in Danger Red (`#DC2626`).
    *   Background Effect: Use a soft radial gradient or a blurred absolute view to create a subtle red glow inside the card.
*   **Right Column (Velocity & AI Sync Cards):**
    *   Takes up ~50% width. Contains two vertically stacked cards.
    *   **Top Card (Velocity):** Upward trend icon. Title "Velocity". Value "+$2.4k" (White/TextPrimary, bold, 20px). Subtitle "+12% vs last week" (Success Green, 12px).
    *   **Bottom Card (AI Sync):** Sparkles icon. Title "AI Sync". Text "Optimization patterns identified." (muted). Add a subtle indigo/purple glow to the background.

#### D. Enhancement: Weekly Stats Section (New Addition)
*   Below the masonry grid, add a "WEEKLY STATS" section to provide more depth.
*   **Layout:** A horizontal, scrollable list (`ScrollView` horizontal) of small, square stat tiles (size ~120x120).
*   **Tile 1 (Savings Rate):** Icon (Piggy bank), Title "Savings Rate", Value "32%", Subtitle "Target: 30%".
*   **Tile 2 (Top Spend):** Icon (Shopping bag), Title "Top Category", Value "Dining", Subtitle "₹12,450".
*   **Tile 3 (Cash Burn):** Icon (Fire), Title "Cash Burn", Value "Low", Subtitle "Stable runway".

---

### 3. IMPLEMENTATION REQUIREMENTS
1.  **Component Structure:** Break this into `VitalityGauge`, `InsightCard` (reusable for the masonry grid), and `StatTile`.
2.  **Animations:** The concentric rings of the `VitalityGauge` must animate from 0 to their respective values on component mount using Reanimated. 
3.  **Layout Logic:** For the asymmetrical grid, use a parent `View` with `flexDirection: 'row'`, containing two child `View`s each with `flex: 1`. 
4.  **Styling:** Strictly use `StyleSheet.create`. All cards must have a border radius of 24px and use subtle borders (`borderWidth: 1`, `borderColor: theme.colors.border`) to achieve the premium dark mode look.

Output the complete, production-ready TypeScript code for `InsightsScreen.tsx` and its local subcomponents.