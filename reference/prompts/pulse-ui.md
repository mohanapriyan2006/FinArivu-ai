You are a Senior React Native UI Engineer specializing in Android-first performance, Reanimated, custom charts, and pixel-perfect UI development. 

Your task is to build the `PulseScreen.tsx` component for FinArivu AI. This must be a pixel-perfect implementation based on the provided UI designs ("Pulse.png" and "Pulse-dark.png").

---

### 1. TECHNICAL STACK & RULES
*   **Framework:** React Native + Expo (TypeScript).
*   **Styling:** Pure React Native `StyleSheet` ONLY. Absolutely NO Tailwind CSS or NativeWind.
*   **Theme:** Consume colors dynamically from our custom `useTheme()` hook.
*   **Typography:** The numbers on this screen utilize a distinct monospace/tabular aesthetic. Apply `fontVariant: ['tabular-nums']` and appropriate font weights to numeric values.
*   **Animations:** Use `react-native-reanimated` for the bar charts, horizontal progress bars, and circular progress rings to draw/fill on mount.
*   **Safe Area & Android:** Ensure `SafeAreaView` is implemented for Android status bars. Use Android `elevation` for card shadows and optimize the scroll view for 60fps.

---

### 2. VISUAL ARCHITECTURE & LAYOUT

#### A. Header Section
*   **Layout:** Flex row, space-between, centered vertically.
*   **Left:** Circular avatar/bot icon (dark background with indigo tint).
*   **Center:** Title "Cognitive Finance" (bold, text-primary, size 18px).
*   **Right:** Settings gear icon (muted color).

#### B. Card 1: CASH FLOW (30D)
*   **Header:** "CASH FLOW (30D)" (uppercase, muted, tracking/letter-spacing, size 12px). Top-right: Trend text "📈 +14.2%" in primary indigo.
*   **Body (Two Columns):**
    *   Use a subtle, 1px vertical divider between the columns.
    *   **Left (INCOME):** Label "INCOME" (muted, 10px). Value "$12,450" (large, bold, ~28px) with the ".00" placed on a new line or styled significantly smaller/muted to match the design.
    *   **Right (SPEND):** Label "SPEND" (muted, 10px). Value "$8,124", ".50" (styled identical to Income).
*   **Footer:** Label "NET RUN RATE" on the left (muted), and the value "+$4,325.50" on the right (bold, primary indigo color, size 16px).

#### C. Card 2: SPENDING VELOCITY (7-Day Analysis)
*   **Header:** "SPENDING VELOCITY" (muted, uppercase, 12px). Top-right: A soft pill badge with a calendar icon and "This Week".
*   **Title:** "7-Day Analysis" (bold, prominent, monospaced/technical font style, size 20px).
*   **The Chart (Custom SVG or Reanimated):**
    *   Do NOT use a generic chart library unless it can perfectly match the design. 
    *   It is a dense bar chart with varying heights grouped by days (MON-SUN). 
    *   **The Limit Line:** A horizontal dashed line (Gold/Warning color) spans the chart, labeled "BUDGET LIMIT" on the right side.
    *   **Dynamic Coloring:** The bars are primarily Indigo. However, any bar component that crosses the "BUDGET LIMIT" line MUST change color to Gold/Warning (`#F59E0B`).
    *   **X-Axis:** "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN" (monospaced, uppercase, small, muted, evenly spaced below the bars).

#### D. Card 3: CORE VECTORS (Budget Tracking)
*   **Header:** "CORE VECTORS" (muted, uppercase, 12px).
*   **List Items (Horizontal Progress):**
    *   Layout: Icon container (soft background matching the state color) on the left, Title/Value row above a horizontal progress bar.
    *   **Item 1 (Housing):** Icon (Home), Title "Housing", Value "$3,200". Bar is primary indigo, filled ~80%.
    *   **Item 2 (Dining - Warning):** Icon (Fork/Knife). Title "Dining (Warning)" (text is Warning Orange). Value "$1,450" (Warning Orange). Bar is Warning Orange, filled ~95%.
    *   **Item 3 (Transport):** Icon (Bus/Car), Title "Transport", Value "$450". Bar is primary indigo, filled ~30%.
    *   *Note:* The unfilled track of the progress bars should be a very faint, semi-transparent base color.

#### E. Card 4: TARGET SEQUENCES (Goals)
*   **Header:** "TARGET SEQUENCES" (muted, uppercase, 12px).
*   **List Items (Circular Progress Cards):**
    *   These items look like nested cards with subtle borders.
    *   **Left Side:** A circular SVG progress ring (indigo). Inside the ring, display the percentage (e.g., "65%", "32%").
    *   **Right Side:** Title ("Emergency Fund", "Q3 Tax Reserve") in bold text-primary. Subtitle showing progress amount ("$15,000 / $25,000") in muted text.

---

### 3. IMPLEMENTATION REQUIREMENTS
1.  **Component Structure:** Create local subcomponents for `CashFlowCard`, `VelocityChartCard`, `VectorProgressBar`, and `TargetSequenceRing` to keep the main screen file clean.
2.  **Animations:** Use `react-native-reanimated` so the bar chart columns grow from height 0 to their target heights, and the horizontal/circular progress bars animate their stroke/width on mount.
3.  **Android Optimization:** Ensure all SVGs (`react-native-svg`) are optimized. The layout should use a standard `ScrollView` with `contentContainerStyle` padding to allow scrolling past the bottom nav bar.

Output the complete, production-ready TypeScript code for `PulseScreen.tsx` and its local subcomponents.