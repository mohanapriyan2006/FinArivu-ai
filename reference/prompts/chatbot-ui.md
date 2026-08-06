You are a Senior React Native UI Engineer specializing in Android-first performance, Reanimated, and custom UI development. 

Your task is to build the `CopilotScreen.tsx` component for FinArivu AI. Base the structural design on the provided references ("AiChat.png" and "AiChat-dark.png"), but prioritize a functional "Claude-style" interactive workspace over rigid pixel-matching. 

---

### 1. TECHNICAL STACK & RULES
*   **Framework:** React Native + Expo (TypeScript).
*   **Styling:** Pure React Native `StyleSheet` ONLY. Absolutely NO Tailwind CSS or NativeWind.
*   **Theme:** Consume colors dynamically from our custom `useTheme()` hook.
*   **Animations:** Use `react-native-reanimated` for a breathing/pulsing AI thinking indicator and smooth layout transitions when new messages appear.
*   **Android-First Keyboard:** You MUST implement flawless keyboard handling for Android. Use `KeyboardAvoidingView` (with `behavior="height"` or `padding` tuned for Android) or `react-native-keyboard-controller` so the floating input rests perfectly above the keyboard without jank.

---

### 2. VISUAL ARCHITECTURE & LAYOUT

#### A. Header Section
*   **Layout:** Flex row, centered vertically.
*   **Left:** Small circular avatar (AI bot icon or user avatar).
*   **Center:** Title "AI Copilot" (bold, primary text).
*   **Right:** Settings gear icon.

#### B. Chat Feed (The Workspace)
*   Use a `FlatList` or `ScrollView` (inverted or auto-scrolling to bottom).
*   **User Message:** Right-aligned or centered italicized quote (e.g., *"Calculate my Q3 estimated tax liability based on recent activity."*). Text should be slightly muted to keep focus on the AI.
*   **AI Thinking State:** An animated component. Design a 3-petal geometric shape or a simple glowing orb that uses Reanimated to pulse (scale and opacity) infinitely while "loading". Text beside it: "Calculating potential tax liabilities..." (primary indigo color).
*   **AI Artifact (Interactive UI Card):**
    *   Instead of a boring text bubble, the AI outputs a native UI card directly in the chat feed.
    *   **Container:** A SurfaceCard with a border radius of 24px and subtle shadow/elevation.
    *   **Header:** Small bank/pillar icon with text "Q3 Tax Estimate (Calculated)".
    *   **Hero Value:** "ESTIMATED LIABILITY" (small, muted label) above a large, bold value: "$8,420.00".
    *   **Breakdown Row:** A subtle inner container or separator showing:
        *   "Short-term Gains" ... "+$24.5k" (Success Green)
        *   "Deductions" ... "-$1.2k" (Danger Red)
    *   **Action Button:** A full-width `PrimaryButton` at the bottom of the card reading "Prepare Payment" or "View Detail Report".

#### C. Floating Input Area (Bottom)
*   **Position:** Anchored to the bottom, floating slightly above the tab bar (or keyboard when active).
*   **Style:** Pill-shaped container (fully rounded borders). Use a blurred dark/light background or a solid surface color with a 1px border.
*   **Layout:**
    *   Left: A circular '+' button (for attachments/actions).
    *   Center: `TextInput` placeholder "Ask a question or type command...".
    *   Right: A circular send button (solid primary indigo background with an up-arrow or send icon).

---

### 3. IMPLEMENTATION REQUIREMENTS
1.  **Component Structure:** Build local subcomponents: `UserMessage`, `ThinkingIndicator` (with Reanimated loop), `TaxArtifactCard`, and `FloatingInput`.
2.  **State Management:** Mock a simple state `messages` array that includes standard text, the "thinking" state, and an "artifact" type to demonstrate how the UI conditionally renders the custom card.
3.  **Android Optimization:** Ensure the `TextInput` doesn't cause layout jumps. Add appropriate padding at the bottom of the `FlatList` content container so the last message isn't hidden behind the floating input.

Output the complete, production-ready TypeScript code for `CopilotScreen.tsx` and its local subcomponents.