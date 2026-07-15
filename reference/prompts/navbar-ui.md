Role: Expert React Native (Expo) UI Engineer & Motion Designer.
Task: Implement a custom, highly animated Bottom Navigation Bar component (`CustomBottomTabBar.tsx`) for the FinArivu AI app, strictly matching the provided design.

Design Tokens & Global Constraints:
- Surface: #FFFFFF (White) with a subtle, premium drop shadow (e.g., `shadow-lg shadow-slate-200`).
- Primary Brand Blue: #0A4CC5 (Used for the active tab pill and the center AI button).
- Inactive Text/Icon: #64748B (Slate 500).
- Active Text/Icon: #FFFFFF (White).
- Typography: Inter Font Family, 12pt Medium for tab labels.
- Icons: Use `Lucide-React-Native` with a strict 2px stroke width.

Architecture & State:
- The component should be designed as a custom tab bar for `@react-navigation/bottom-tabs`.
- It must render exactly 5 navigation items in this order:
  1. Home (Icon: Home)
  2. Insights (Icon: BarChart2 or LineChart)
  3. AI Copilot (Icon: Bot or Sparkles) - Center FAB.
  4. Goals (Icon: Target)
  5. Profile (Icon: User)

Component Specifications (Based on UI Design):
1. Main Container: 
   - A white, absolute-positioned container at the bottom of the screen.
   - Must have `rounded-t-3xl` top corners.
   - Must utilize `useSafeAreaInsets` from `react-native-safe-area-context` to dynamically add bottom padding for iOS home indicators.
   - Flex-row, `justify-between`, and `items-center` for standard tabs.

2. Standard Tabs (Home, Insights, Goals, Profile):
   - Layout: Vertical stack (Icon above Text).
   - Inactive State: Transparent background, slate icon, and slate text.
   - Active State: The icon and text color transition to white. The item is wrapped in a dynamic Blue pill background (`#0A4CC5`) with `rounded-2xl` corners.
   - Animation Requirement: Use `react-native-reanimated` and `moti`. When a tab becomes active, the blue background pill should seamlessly spring into place using `layout={LinearTransition.springify().damping(14)}`.

3. Center AI Copilot Button (Floating Action Button):
   - Layout: This button must break out of the standard flex flow. It is elevated and visually overlaps the top edge of the navbar container.
   - Styling: Perfect circle, solid Primary Blue background, with a thick (approx 6px) solid white border (`border-white`) to create a cutout effect against the background.
   - Icon: Large white AI/Bot icon centered inside.
   - Animation Requirement: Implement a continuous, subtle slow-breathing scale animation (scaling between 0.98 and 1.02) to indicate the AI is "alive" and listening. Apply a tactile bounce effect using `withSpring` `onPressIn` and `onPressOut`.

Execution Requirements:
- Write the complete TypeScript implementation.
- Use `NativeWind` class strings for styling.
- Ensure the tab bar does not jump or flicker during state changes.
- Modularize the single Tab Item into its own sub-component (`TabBarItem`) to keep the main component clean.