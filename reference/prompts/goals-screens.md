Role: Expert React Native (Expo) UI Engineer & Motion Designer.
Task: Implement the complete Goals feature flow comprising three screens: `GoalsDashboardScreen.tsx`, `CreateGoalScreen.tsx`, and `GoalJourneyScreen.tsx`.

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Ensure styles are modular, semantic, and highly performant. Use `react-native-reanimated` for motion and `react-native-svg` for custom charts/paths.

Design Tokens & Global Constraints:
- Background: #F8FAFC (Pure Slate Light)
- Card Surface: #FFFFFF (White) with subtle premium shadow (shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2)
- Primary Blue: #0A4CC5 | Deep Blue: #083A96
- Gold: #F4B400 | Success Green: #16A34A | Warning Orange: #F59E0B
- Text: Primary (#0F172A), Secondary (#64748B)
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).
- Radii: Large Cards (24px), Inner Data Cards/Pills (12px to 16px), Buttons (16px).

---

Screen 1: GoalsDashboardScreen.tsx (Based on Goals Dashboard_2.png)
Architecture: `ScrollView` (showsVerticalScrollIndicator={false}).
1. Header: Avatar (40x40), center title "Goals Dashboard", right bell icon.
2. Greeting: "Good Morning, Mohan" (24pt, Bold), subtext "You are building your future."
3. Life Progress Hero Card: 
   - Large circular progress ring (thick primary blue stroke). Center text: "82%" (48pt, Bold), "LIFE PROGRESS" (10pt, uppercase).
   - Bottom floating pill: Soft blue background (#EEF5FF), AI icon, text "You are ahead of schedule on 2 goals." (Primary Blue text).
4. Goal Milestones (Horizontal Scroll):
   - Header "Goal Milestones" with "View All" link.
   - Horizontal `ScrollView` of cards. Each card: 
     - Top row: Icon in soft yellow box, Green "On Track" pill badge.
     - Middle: Title "Dream House", Target "₹20,00,000".
     - Bottom: Current value "₹15.2L", percentage "75%", and a mini horizontal progress bar.
5. Status Overview Row: 
   - 3 equal-width mini-cards: "3 ON TRACK" (Green), "1 ATTENTION" (Orange), "2 DONE" (Blue). Values are bold, labels are uppercase micro-text.
6. FinArivu Recommendation Card:
   - Gold border/accent. Title with lightbulb icon. 
   - Body text: "You can reach your Home Goal 6 months earlier..." (Highlight specific metrics in blue/green).
   - Button: Solid Gold, text "Apply Optimization".
7. Future Timeline:
   - Vertical timeline layout. Left side: colored dots with vertical connecting lines. Right side: Content.
   - Content format: Year pill (e.g., "2026"), Title (Bold), Expected date (Secondary text).
8. FAB: Bottom-right fixed '+' button (Primary Blue circle) triggering navigation to Create Goal.

---

Screen 2: CreateGoalScreen.tsx (Based on Create Goal_2.png)
Architecture: `KeyboardAvoidingView` + `ScrollView`.
1. Header: Back Arrow, "Create Goal" Title. 
2. Subtitle: "What are you planning for?" and brief descriptive text.
3. Hero Image/Category: 
   - A 16:9 placeholder image (borderRadius: 16) depicting the selected goal (e.g., modern house). 
   - Absolute positioned Gold pill badge at bottom left: "Home Goal".
4. Category Grid:
   - 4x2 grid of selectable category buttons (Home, Car, Vacation, etc.).
   - Each button: White surface, center icon, text label. Active state applies a Primary Blue 2px border and light blue background tint.
5. Form Inputs:
   - "GOAL NAME" (Input value: "New Dream Home").
   - "TARGET AMOUNT" (Input value: flex-row with "₹" and "20,00,000").
6. Target Date Slider:
   - White card. Title "March 2029" (Blue), "5 Years from now" (Gray).
   - Implement a custom slider track with a prominent circular thumb indicator. Below track: Year labels (2024, 2026, 2028...).
7. AI Summary Row:
   - Flex-row of 2 cards. Left: "MONTHLY SAVINGS ₹28,000/mo" (Soft blue bg). Right: "PROJECTED COMPLETION March 2029" (White bg).
8. AI Analysis Box:
   - Soft purple/blue tint (#F8FAFC to #F3F4F6 gradient). Gold AI icon. Text analyzing the realism of the goal (Green text for "realistic").
9. Bottom CTA: "Create Goal" (Primary Blue solid button with small rocket icon).

---

Screen 3: GoalJourneyScreen.tsx (Based on Goal Journey_2.png)
Architecture: `ScrollView`.
1. Header: Back Arrow, "Goal Journey".
2. Hero Journey Card:
   - Top: Title "Dream House Fund", Subtitle "Progress: 75% complete". Right: Green "↗ Increasing Momentum" pill.
   - Visual: Use `react-native-svg` to draw a continuous, winding bezier curve path representing the journey. Add solid blue dots for past milestones, a glowing gold dot for the current position, and a faded white/gray dot for the destination.
3. AI Acceleration Forecast Card:
   - White card with a 4px Gold left-border. Top header: Sparkles icon, "AI Acceleration Forecast".
   - Inner Stack:
     - Card 1: "CURRENT PACE" (Light gray bg), "January 2028".
     - Card 2: "OPTIMIZED PATH" (Light blue bg), "July 2027" (Primary Blue), "+6 Months" green pill, and descriptive subtext.
   - Button: Full-width Gold button "Unlock 10% Accelerator Plan >" (Black/Dark text).
4. Goal Story Card:
   - Bottom card. Left: Circular aspirational image thumbnail. Right: Editorial text explaining consistency, highlighting "12 months" (Blue) and "15%" (Green).

Execution Requirements:
- Build isolated components: `<TimelineItem />`, `<CategorySelectButton />`, `<GoalCard />`.
- Enforce strict `StyleSheet.create` usage at the bottom of each file.
- Add safe area bottom padding to ensure the UI is not obstructed by device home indicators.