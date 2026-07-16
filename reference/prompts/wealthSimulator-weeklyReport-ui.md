Role: Expert React Native (Expo) UI Engineer & Creative Developer.
Task: Implement two advanced interactive screens for the FinArivu AI app: `WealthSimulatorScreen.tsx` and `WeeklyReportStoryScreen.tsx`.

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Ensure styles are highly performant, modular, and semantically named. Use `react-native-reanimated` for all animations.

Design Tokens & Global Constraints:
- Background: #F8FAFC (Pure Slate Light)
- Card Surface: #FFFFFF (White) with subtle shadow (shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2).
- Primary Blue: #0A4CC5 | Deep Blue (Action/Headers): #083A96
- Gold: #F4B400 | Success Green: #16A34A | Danger Red: #DC2626
- Text: Primary (#0F172A), Secondary (#64748B).
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).

---

Screen 1: WealthSimulatorScreen.tsx (Based on Wealth Simulator_2.png)
Architecture: `ScrollView` (showsVerticalScrollIndicator={false}).
1. Header & Title: 
   - Top Header: Avatar, title "Wealth Simulator" (Primary Blue), right bell icon.
   - Page Title: "What If Simulator" (32pt, Bold), subtext "Visualize your future financial gravity..." (Secondary text).
2. Growth Parameters Card:
   - White surface, 24px radius. Title: "Growth Parameters" with filter icon.
   - 4 Custom Sliders: Monthly Savings (₹25,000), Annual Income Hike (10%), Expected Inflation (6%), Years to Goal (20 Years).
   - Slider UI: Use `@react-native-community/slider` or a custom pan-gesture view. Light blue inactive track, Primary Blue active track, and a solid Primary Blue circular thumb. Place the label on the left and the bold blue value on the right above each slider.
3. Investment Scenarios Selector:
   - Header: "INVESTMENT SCENARIOS" (10pt, uppercase).
   - Flex-row of 3 selectable rounded-square cards: "Low 8%", "Mid 12%", "High 15%".
   - Active state (Mid): Primary Blue border (2px) and Primary Blue text. Inactive: Light gray border, secondary text.
4. Projected Net Worth Visualization:
   - Large, centered circular layout. 
   - Outer rings: Render 2-3 thin, dashed concentric circles (Light Gray) using `react-native-svg` to simulate an expanding "galaxy".
   - Center Anchor: Dark Blue circular icon box containing a white wallet icon.
   - Top Floating Data: Text "PROJECTED NET WORTH", large value "₹1.37 Cr" (Primary Blue, 36pt, Bold), and a green trend pill "+240% vs Cash".
5. AI Recommendation Card:
   - Surface: Soft yellow background (#FFFBED) with a 1px solid Gold border.
   - Floating Icon: Gold magic wand icon in a yellow circle. Absolute positioned top-right watermark icon (Bot).
   - Text: "AI Recommendation" (Gold, Bold). Body: "If you save ₹10,000 more monthly: Projected Net Worth ₹2.4 Crore extra by Age 50." (Apply Primary Blue and Green colors to the numbers).
   - Button: Solid Dark Blue, text "Apply Strategy".
6. Breakdown Summary Cards:
   - 3 stacked vertical white cards: Total Principal (Orange icon box, ₹1.2 Cr), Estimated Returns (Green icon box, ₹1.94 Cr), Inflation Impact (Red icon box, ₹-42 L).

---

Screen 2: WeeklyReportStoryScreen.tsx (Based on Weekly Report Wrapped_2.jpg)
Architecture: Full-screen Instagram/WhatsApp-style Story UI.
1. Story Container & Navigation:
   - Use absolute positioning to fill the entire screen (hide standard navigation headers).
   - Top progress bar: A horizontal flex-row of segmented bars. Active bars are solid white, the current bar animates from 0 to 100% width over 5 seconds, inactive bars are translucent white.
   - Tap Navigation: The screen should be split into invisible left (30% width) and right (70% width) `Pressable` overlays to navigate prev/next slides.
   - Top Right: A small white 'X' icon to close the report.
2. Slide Themes (Implement as conditionally rendered views or a flatlist pager):
   - Slide 1 (Intro): Solid Deep Blue (#0A4CC5) background. Center Gold icon, "Your Financial Week", Date range.
   - Slide 2 (Spending): Split screen. Top/Left contains text "SPENT THIS WEEK ₹12,850". Bottom/Right features a rich background image of food (with a dark gradient overlay), text "Food & Dining ₹3,200".
   - Slide 3 (Savings): Dark Green (#064E3B) background. Center circular progress ring (Light Green stroke), "31% SAVED". Text "Excellent!".
   - Slide 4 (Goals): Deep Purple (#4C1D95) background. Target icon, "Emergency Fund", horizontal progress bar.
   - Slide 5 (Health Score): Light purple/white background. Center white elevated card displaying Health Score "782" and "+3 Points" (Green).
   - Slide 6 (AI Summary): White background. Center white elevated card with AI Bot icon. Title: "A healthy week with conscious choices.", followed by a paragraph of analytical text.
   - Slide 7 (Outro): Pure Black background. Center Gold Badge (Smart Saver). Two full-width buttons at the bottom: "Share Achievement" (Primary Blue) and "Download Report (PDF)" (Dark Gray).

Execution Requirements:
- Build a generic `<StorySlide />` wrapper to handle the layout, background color/image, and entrance animations (e.g., scaling up or fading in).
- For the `WealthSimulatorScreen`, ensure the sliders update state in real-time, and the "₹1.37 Cr" text animates its number count using `react-native-reanimated` when slider values change.
- Enforce strict `StyleSheet.create` at the bottom of the files. Provide detailed shadow offsets, opacities, and z-index handling for the story overlays.