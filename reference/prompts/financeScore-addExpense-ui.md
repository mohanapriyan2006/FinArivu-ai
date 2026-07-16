Role: Expert React Native (Expo) UI Engineer.
Task: Implement two critical screens for the FinArivu AI app: `FinancialHealthScreen.tsx` and `QuickAddExpenseScreen.tsx`, based on the provided UI designs. 

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Create modular, clean, and highly performant style definitions.

Design Tokens & Global Constraints:
- Background: #F8FAFC (Pure Slate Light)
- Card Surface: #FFFFFF (White) with subtle shadow (shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2)
- Primary Blue: #0A4CC5 | Dark Blue (Hero/Header): #083A96
- Gold: #F4B400 (Accents/Buttons) | Success Green: #16A34A | Warning Orange: #F59E0B | Danger Red: #DC2626
- Text: Primary (#0F172A), Secondary (#64748B)
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).
- Radii: Large Cards (24px), Small Cards/Inputs (16px), Buttons (18px).

---

Screen 1: FinancialHealthScreen.tsx (Based on Financial Health_2.png)
Architecture: `ScrollView` (showsVerticalScrollIndicator={false}) inside a `SafeAreaView`.

1. Header: Left Avatar (40x40), Center Title "Financial Health" (20pt, Bold, Primary Blue), Right Notification Bell.
2. Hero Score Card: 
   - White card, centered content.
   - Top right absolute badge: Green pill, text "↗ +4 pts".
   - Center: Large circular progress ring (Green stroke, light gray track). Inside text: "84" (48pt, Bold), "EXCELLENT" (12pt, Light slate).
   - Bottom text: "Your financial health is in the top 5%..." (Green text for "top 5%").
3. AI Insight Card ("Why Your Score Improved"): 
   - Soft yellow bg (#FFFBED), Gold left-border accent (4px width). 
   - Gold AI icon, title, and descriptive body text.
4. Score Breakdown Card: 
   - Title: "Score Breakdown" with chart icon.
   - 5 rows: Savings Score (Blue), Emergency Fund (Orange), Debt Ratio (Green), Goal Progress (Green), Budget Discipline (Orange). 
   - Implement a reusable `<ProgressBarRow />` component that accepts label, score string (e.g., "28/30"), and fill color.
5. Action Plan Card: 
   - Title: "Action Plan" with lightbulb icon.
   - 3 List Items: Soft tinted icon boxes (Blue, Red, Green), Title, Subtitle, and right chevron.
   - Bottom: Pale yellow quote box with italicized text.
6. Trend Chart Card: 
   - Title: "12-Month Health Trend" with segmented toggle (Score / Net Worth).
   - Line chart rendering (use react-native-svg) with a solid blue line and a light blue bottom gradient. X-axis labels (Jul, Aug, Sep, Oct, Nov).
7. Bottom CTA Card: 
   - Dark Blue (#083A96) background. White text for title and body.
   - CTA Button: Solid Gold background, text "Learn Wealth Strategies" (Dark Blue text, Bold).
8. Floating Action Button (FAB): Absolute positioned, bottom right. Dark Blue circle, white '+' icon. This triggers navigation to the Quick Add screen.

---

Screen 2: QuickAddExpenseScreen.tsx (Based on Add Expense_2.png)
Architecture: `KeyboardAvoidingView` + `ScrollView`. 

1. Header: Back Arrow, Title "Quick Add" (Primary Blue), Right Lightning Bolt icon.
2. Top Amount Section: 
   - Solid Dark Blue (#083A96) background filling the top 30% of the screen.
   - "ENTER AMOUNT" (12pt, Light Blue tint, uppercase).
   - Flex-row with "₹" symbol and large "0" (48pt, White, Bold).
3. Main Form Surface: 
   - White container that overlaps the blue background (marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24).
   - "Select Category" Grid: 2 rows of 4 square buttons. Each button has a soft-tinted background (e.g., pale red for Food, pale blue for Travel) and matching icon. Active state should highlight the border.
   - Form Inputs: 3 fields (Merchant Name, Date, Notes). 
     - Styling: Height 52px, border 1px solid #E2E8F0, borderRadius 16px, paddingHorizontal 16px.
     - Include left-aligned icons inside the inputs (Store, Calendar, Menu-lines).
4. Bottom CTA: 
   - Fixed at bottom (or end of scroll): Large Primary Blue button, text "+ Add Expense" (White, SemiBold, 16pt).

Execution Requirements:
- Break down the screens into modular sub-components (e.g., `BreakdownRow`, `ActionItem`, `CategoryButton`) to keep the main files clean.
- Ensure all styling is strictly defined in `const styles = StyleSheet.create({...})` at the bottom of the files.
- Apply semantic naming for your stylesheet objects (e.g., `heroCardContainer`, `inputWrapper`).