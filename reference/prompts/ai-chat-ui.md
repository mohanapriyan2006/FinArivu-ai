Role: Expert React Native (Expo) UI Engineer & Generative UI Specialist.
Task: Implement the `AIChatScreen.tsx` (The AI Personal CFO) for the FinArivu AI app based on the provided "FinArivu AI_2.png" reference design.

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Ensure styles are modular, semantic, and highly performant. 

Design Tokens & Global Constraints:
- Screen Background: #F8FAFC (Pure Slate Light)
- AI Message Surface: #EEF5FF (Light Blue Tint) with border #C7DDFE (Soft Blue).
- User Message Surface: #FFFFFF (White) with subtle shadow.
- Primary Blue (Brand & Buttons): #0A4CC5 | Dark Blue (Charts/Header): #083A96
- Text: Primary (#0F172A), Secondary (#64748B), Accent Red (#DC2626 for trends).
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).

Architecture Requirements:
- The screen must use a `KeyboardAvoidingView` (behavior="padding" on iOS, "height" on Android) wrapped around a `SafeAreaView`.
- The chat feed must use a `FlatList` (inverted=false or true depending on your data structure preference) to handle long conversations efficiently.

1. Header Component (`ChatHeader`):
   - Background: #FFFFFF, borderBottomWidth: 1, borderBottomColor: #E2E8F0.
   - Left: Circular dark blue icon box with a white AI/Bot icon.
   - Center: Title "FinArivu AI" (Bold, 16pt), Subtitle "MOHAN'S PERSONAL CFO" (10pt, Uppercase, Gray).
   - Right: Search Icon (Outline, Gray).

2. AI Message Bubble (Rich Generative UI Component):
   - Alignment: Left-aligned, spanning roughly 85% of screen width.
   - Surface: `#EEF5FF` background, `16px` border radius, `1px` solid `#C7DDFE` border.
   - Greeting Text: "Good morning, Mohan. I've analyzed your recent activity. Your recurring subscriptions increased by 12% last month."
   - Inner Metric Cards: A flex-row of two white cards (borderRadius: 12). 
     - Left Card: Label "Subscription Total", Value "$248.50" (Primary Blue).
     - Right Card: Label "Trend", Value "+12.4%" (Red).
   - Inner Chart Component: 
     - A simple bar chart rendering 5 vertical bars. 
     - The first 4 bars are a muted light blue/gray (#D3E4FD). 
     - The 5th bar (representing the current month) is solid Dark Blue (#083A96) and taller than the rest.
   - Action Chip: Rendered *below* the main bubble. White pill with a 1px solid Primary Blue border. Text "View Subscriptions" (Primary Blue, 12pt, SemiBold).

3. User Message Bubble:
   - Alignment: Right-aligned, max width 80%.
   - Surface: #FFFFFF, 1px solid #E2E8F0, slight drop shadow (elevation: 1).
   - Border Radius: 16px all around EXCEPT the bottom-right corner (which should be 4px to create a tail effect).
   - Text: "Can you suggest where I can cut back to reach my vacation goal faster?" (Primary text color, 14pt).

4. Floating Input Area (`ChatInput`):
   - Position: Fixed at the bottom above the keyboard/safe area. 
   - Container: White pill-shaped container (`borderRadius: 999`), heavy premium drop shadow (`shadowOpacity: 0.1, shadowRadius: 15`).
   - Left: Plus (+) attachment icon (Gray).
   - Center: `TextInput` element. Placeholder "Message your CFO..." (Gray).
   - Right: Microphone icon (Gray) next to a solid Dark Blue circular Send button featuring an Up-Arrow icon (White).

Execution Requirements:
- Build a generic `<ChatMessage />` wrapper component that can conditionally render either plain text or "Rich Cards" (like the bar chart) based on a `type` prop (`'ai'` vs `'user'`).
- Use `react-native-reanimated` to add a subtle fade-in and slide-up animation when new messages mount.
- Enforce strict `StyleSheet.create` at the bottom of the file. Use semantic naming (e.g., `aiBubbleContainer`, `inputCapsule`).