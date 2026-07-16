Role: Expert React Native (Expo Go) UI Engineer.
Task: Implement the `HomeScreen.tsx` component for FinArivu AI based on the provided "Home_2.png" design. 

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Ensure modular, clean, and highly performant style definitions.

Design Tokens & Global Constraints:
- Background: #F8FAFC (Pure Slate Light)
- Card Surface: #FFFFFF (White) with subtle shadows (e.g., shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10)
- Primary Blue: #0A4CC5 | Dark Blue (Hero Card): #083A96
- Gold: #F4B400 | Success Green: #16A34A | Danger Red: #DC2626
- Text: Primary (#0F172A), Secondary (#64748B)
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).
- Radii: Large Cards (24px), Small Cards/Pills (16px), Buttons (18px).
- Layout: 24px horizontal screen padding, 24px gap between major vertical sections.

Screen Architecture & Specifications:
The screen must be wrapped in a `ScrollView` (with `showsVerticalScrollIndicator={false}`) and a `SafeAreaView`.

1. Header Section:
   - Flex-row, space-between, items-center.
   - Left: Circular User Avatar (40x40) alongside text "Welcome !" (24pt, Bold, Primary Blue).
   - Right: Outline Notification Bell icon (Primary Blue).

2. Financial Health Score (Hero Card):
   - Solid Primary Blue to Dark Blue vertical gradient background (or solid Dark Blue #083A96 if gradients are unavailable), borderRadius: 24.
   - Background watermark: Add a subtle, low-opacity (10%) right-aligned line chart SVG to the background.
   - Content:
     - "FINANCIAL HEALTH SCORE" (Uppercase, 12pt, Light Blue tint).
     - Score "84/100" (40pt, Bold, White) with a small Green pill badge ("Excellent") aligned to its right.
     - Trend text: "↗ +4 from last month" (White, 14pt).
     - Button: White background pill button, text "View Details →" (Primary Blue, 14pt, SemiBold).

3. Net Worth Card:
   - White surface, borderRadius: 24, padding: 20.
   - Title: "Net Worth" (Secondary text).
   - Value: "₹12.8 Lakh" (28pt, Bold) with trend "+8.4% vs prev. month" (Green text for percentage).
   - Chart: Integrate a smooth, bezier curve line chart spanning the width of the card. Use `react-native-svg` or `react-native-wagmi-charts`.

4. Monthly Snapshot Cards (Income, Expense, Savings):
   - Three stacked rectangular cards.
   - Each has a colored left-border accent (width: 4px): Green for Income, Red for Expense, Blue for Savings.
   - Flex-row, space-between. 
   - Left side: Label (e.g., "INCOME") and Amount (e.g., "₹85,000" in Bold).
   - Right side: Soft-tinted circular icon container matching the category color (e.g., Wallet, Cash, Piggy Bank).

5. AI Insight Card:
   - Surface: Soft yellow/gold tint background (#FFFBED) with a 1px solid Gold (#F4B400) border.
   - Header: Gold AI icon in a solid gold rounded box, text "FinArivu Insight", and a micro "SMART" badge.
   - Body: "You saved 18% more this month compared to last month. This keeps you on track for your Home Fund goal."
   - Footer link: "View Insight ↗" (Gold, SemiBold).

6. Goals Preview Card:
   - Header: "Goals Preview" (Bold) and right-aligned "MANAGE ALL" (Primary Blue, Text Button).
   - List 3 goals (House Fund - 75%, Emergency Fund - 60%, Vacation - 40%).
   - Progress Bars: Implement a custom progress bar component with a track color (Light Slate) and fill color (Primary Blue), height 8px, rounded ends.

7. Recent Transactions Card:
   - Header: "Recent Transactions" and right-aligned "VIEW ALL".
   - Table Header Row: "MERCHANT", "CATEGORY", "DATE", "AMOUNT" (10pt, Uppercase, Secondary text).
   - Render 4 transaction rows. Each row contains:
     - Icon container (soft blue or gray background).
     - Merchant Name (Bold) and Category (Secondary text).
     - Date (e.g., "Oct 24").
     - Amount (Red for negative/expense, standard for neutral).

Execution Requirements:
- Break down the layout into sub-components (e.g., `HeroCard`, `SnapshotList`, `GoalRow`, `TransactionItem`) within the same file or assumed separate files to keep the main render method clean.
- Ensure all styling is strictly defined in `const styles = StyleSheet.create({...})` at the bottom of the file.
- Add generous bottom padding to the ScrollView to account for the overlapping Bottom Navigation Bar.