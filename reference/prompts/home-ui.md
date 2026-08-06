You are a Senior React Native UI Engineer specializing in Android-first performance, Reanimated, and custom pixel-perfect UI development. 

Your task is to build the `HomeScreen.tsx` component for FinArivu AI. This is a complete, pixel-perfect implementation based on the newly provided UI designs ("Home.png" and "Home - dark.png"). 

---

### 1. TECHNICAL STACK & RULES
*   **Framework:** React Native + Expo (TypeScript).
*   **Styling:** Pure React Native `StyleSheet` ONLY. Absolutely NO Tailwind CSS or NativeWind.
*   **Theme:** Consume colors dynamically from our custom `useTheme()` hook. 
*   **Animations:** Use `react-native-reanimated` for the background electric wave effect.
*   **Glassmorphism:** Use `expo-blur` (`BlurView`) to achieve the frosted glass effect on the cards over the animated background.
*   **Safe Area:** Ensure the screen correctly implements `SafeAreaView` for Android status bars.

---

### 2. VISUAL ARCHITECTURE & LAYOUT

#### A. The Animated Background (Electric Wave)
*   The background must NOT be static. It features an "electric wave animated effect." 
*   **Implementation:** Create a subtle, continuously translating gradient or animated SVG path using `react-native-reanimated` that flows behind the content. 
*   In Dark Mode, the wave should use deep `#0B1220` with moving accents of our primary `#4F46E5`. In Light Mode, it should be a clean white/slate-50 base with very soft lavender/indigo wave movements.

#### B. Hero Section (Top)
*   **Subtitle:** "CURRENT PORTFOLIO VALUE" (Uppercase, letter spacing ~1px, muted text color, font size 12px, bold).
*   **Main Value:** "$1,428,950.00". The dollar sign and whole numbers are large (approx. 40px) and bold. The decimal portion (".00") must be slightly smaller and visually muted (lower opacity or lighter color).
*   **Pill Badge:** Centered directly below the value. It has a soft indigo background (`rgba` of primary color) with text "📈 +2.4% Today" in the primary indigo color (`#4F46E5`).

#### C. The Assets & Liabilities Cards (Glassmorphism)
*   The cards sit on top of the animated electric wave background, so they must utilize `BlurView` with a slight tint (dark or light depending on theme) and a subtle 1px semi-transparent border to create a premium glassmorphic effect.
*   **Card Styling:** Border radius of 24px. Padding of 20px. 
*   **Card Data Structure (Render a list of these):**
    1.  **Checking:** Icon (Bank), Title "Checking", Label "Assets" (top right, muted). Value "$45,200.00". Subtitle "Primary Account" (Indigo text).
    2.  **Crypto:** Icon (Bitcoin), Title "Crypto", Label "Assets". Value "$124,500.00". Subtitle "+12.5% this week" (Success Green text).
    3.  **Credit Cards:** Icon (Card), Title "Credit Cards", Label "Liabilities". Value "-$4,250.00". Subtitle "Next payment in 4 days" (Muted text).
    4.  **Mortgage Loan:** Icon (House/Money), Title "Mortgage Loan", Label "Liabilities". Value "-$485,000.00". Subtitle "3.2% Fixed Rate" (Muted text).

#### D. Card Internal Layout (Flexbox)
*   **Top Row:** Circular icon container (left), Title text (middle-left), Type label (right-aligned, small, muted).
*   **Middle Row:** Large, bold amount text (24px).
*   **Bottom Row:** Subtitle text (13px, colored based on the data context).

---

### 3. IMPLEMENTATION REQUIREMENTS
1.  Begin by writing the code for the `AnimatedWaveBackground` component using `react-native-reanimated`. Optimize it so it does not cause frame drops on Android.
2.  Next, write the `GlassCard` reusable component using `expo-blur`.
3.  Finally, write the `HomeScreen` assembling the hero section and a `FlashList` or `ScrollView` of the asset/liability cards.
4.  Ensure all spacing follows the strict 4/8/12/16/20/24 scale.

Output the complete, production-ready TypeScript code for `HomeScreen.tsx`.