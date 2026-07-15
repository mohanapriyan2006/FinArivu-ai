Role: Expert React Native (Expo Go) UI Engineer & Motion Designer.
Task: Write production-ready code for two entry components: `SplashScreen.tsx` and `OnboardingScreen.tsx` for FinArivu AI. 

Design Tokens & Global Constraints:
- Background Canvas: #F8FAFC (Pure Slate Light)
- Cards / Elevated Surfaces: #FFFFFF (20px border-radius, soft minimal shadows)
- Primary Blue: #0A4CC5 | Accent Gold: #F4B400 | AI Surface tint: #EEF5FF
- Typography: Inter Font Family. Strict hierarchy (H1: Bold, Subtitle: Regular text-slate-500)
- Structural Grid: Screen Padding: 24, Internal Gap: 16
- Icons: Lucide / Feather icon sets via @expo/vector-icons (2px stroke width exclusively)

Animation Specifications (Using react-native-reanimated & moti):
1. Entrance Staggering: Text layouts and action buttons must feature a spring-based fade-in-up effect on mount (duration: 400ms, offset dynamic).
2. Ambient AI Glow: The active AI elements should possess an infinite loop breathing pulse animation (opacity scaling between 0.85 and 1.0, duration 2500ms).
3. Pagination Transitions: Page indicator switching on onboarding must animate its layout width fluidly using layout transitions.

Component 1: SplashScreen.tsx (Based on splash screen_2.png)
- Layout: Full-screen layout utilizing safe area bounds. 
- Top Header: Minimalist vertical layout centering the FinArivu AI brand logo mark asset and text title.
- Hero Messaging: Main title "Your AI Personal CFO" in deep slate bold, paired with subtitle "Track. Plan. Grow. Smart financial intelligence for modern professionals."
- Feature Chips Row: A flex-row grid containing 3 text-pill layout chips:
  1. "Secure" (Features a small lock icon)
  2. "Smart Insights" (Features a small bar-chart icon)
  3. "AI Powered" (Features an outline spark/stars icon)
- Call To Actions:
  - Primary button: Solid colored Primary Blue button with text "Get Started >" providing a smooth Scale-down press effect (0.97).
  - Inline navigational link below it: "Already have an account? Sign In".
- Footer Text: Baseline legal row indicating "Privacy Policy • Terms of Service • Security Disclosure" with full touch targets of 44x44.

Component 2: OnboardingScreen.tsx (Based on Onboarding - Health_2.png)
- Layout: Flex columns with an explicit header pinning the logo mark on the top-left and an explicit absolute "Skip" text button on the top-right.
- The Abstract AI Illustration Canvas:
  - Build a high-fidelity visual mock structure representing a modern UI analytics panel inside a clean white card container.
  - Inside the card: Include a minimal horizontal bar chart using varying shades of Blue, an adjacent secondary colored block with an inner Gold element, and clean loading skeleton text-lines.
  - Position an "AI ANALYSIS READY" badge pill across the illustration utilizing the Accent Gold background color with a soft custom pulse.
- Text Content Block:
  - Header text: Centered typography block spelling out "Know Your Financial Health".
  - Body caption: "Understand where your money goes and how healthy your finances really are."
- Pagination Controls: 
  - Centered row indicating three micro-dots. The active index indicator needs to expand smoothly horizontally to form a capsule pill width.
- Primary Action: 
  - Full-width dark Primary Blue container element reading "Continue →". Handle onPress layout states using interactive micro-scaling hooks.

Please produce the complete TypeScript file implementations, modularized cleanly, utilizing NativeWind class strings and reanimated animation blocks.