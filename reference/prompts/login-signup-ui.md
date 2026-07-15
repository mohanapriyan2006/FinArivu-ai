> **Role:** You are an expert React Native (Expo) UI Engineer specializing in high-fidelity, premium mobile interfaces.
> **Task:** Implement two critical authentication screens (`LoginScreen.tsx` and `RegisterScreen.tsx`) for **FinArivu AI**, an AI Personal CFO application.
> **Design Philosophy & Architecture:**
> * **Aesthetic:** The design must reflect an "Apple Wallet meets Notion" aesthetic with generous whitespace, high-fidelity typography, and an editorial layout.
> 
> 
> * **State Management & Auth:** Integrate placeholders for `Clerk` authentication hooks (`useSignIn`, `useSignUp`) for seamless JWT and refresh token handling.
> 
> 
> * **Theming:** Implement a strict `ThemeContext` architecture. You must absolutely avoid hardcoded colors in the component files.
> 
> 
> * **Accessibility:** Ensure all interactive elements maintain a minimum touch target size of 44x44.
> 
> 
> 
> 
> **Global Design Tokens to Implement:**
> * **Primary Brand Color:** `#4F46E5` (Use this for primary buttons, active states, and logo accents).
> * **Financial Gold:** `#F4B400` (Use for AI-driven highlights and premium badges).
> 
> 
> * **Surface Colors:** Light mode utilizes `#F8FAFC` for the background and `#FFFFFF` for elevated cards.
> 
> 
> * **Typography:** Use the `Inter` font family exclusively, mapping to 400 (Regular), 500 (Medium), 600 (SemiBold), and 700 (Bold) weights.
> 
> 
> * **Radii:** Use a uniform `20px` border radius for all premium rounded cards and input fields.
> 
> 
> 
> 
> **Screen 1 Specification: LoginScreen (`login_2.png`)**
> 1. **Header:** A simple left-aligned back arrow. Center the FinArivu AI logo below it.
> 2. **Typography:**
> * Title: "Welcome Back" (Bold, high contrast).
> * Subtitle: "Sign in to access your financial dashboard." (Regular, secondary text color).
> 
> 
> 3. **Form Elements:**
> * Email Input: Include a leading outline mail icon.
> * Password Input: Include a leading outline lock icon and a trailing "Forgot Password?" text button above it. Include a trailing eye icon inside the input for password visibility toggling.
> 
> 
> 4. **Actions:**
> * Primary CTA: Large, full-width "Sign In" button using the Primary Brand Color.
> * Divider: "OR" centered with subtle horizontal lines.
> * Social Auth: Two outline buttons for "Google" and "Apple" with respective icons.
> 
> 
> 5. **Footer:**
> * Navigation text: "Don't have an account? Create Account".
> * Security Badge: A soft green (`#22C55E` with low opacity background) pill containing a lock icon and "Your financial data is encrypted and protected.".
> 
> 
> 
> 
> 
> 
> **Screen 2 Specification: RegisterScreen (`create account_2.png`)**
> 1. **Header:** Left-aligned back arrow. Centered logo. Title: "Start Your Financial Journey" (34pt SemiBold).
> 
> 
> 2. **Trust Badges (Top Section):**
> * Three horizontal, elevated white cards.
> * Badge 1: Blue lock icon, "Bank-grade encryption".
> * Badge 2: Green chart icon, "Private financial analytics".
> * Badge 3: Gold AI icon, "AI-powered insights".
> 
> 
> 
> 
> 3. **Form Section ("Create your FinArivu account."):**
> * Inputs: Full Name, Email Address, Password, Confirm Password. (Ensure clean, minimal borders with a soft focus state).
> * Checkbox: "I agree to the Terms of Service and Privacy Policy" (Links should use the primary color).
> 
> 
> 4. **Actions:**
> * Primary CTA: "Create Account →" (include right arrow icon).
> 
> 
> 5. **Footer:**
> * Security assurance text with a small shield icon indicating data is never sold.
> 
> 
> 
> 
> **Execution Requirements:**
> * Use `NativeWind` (Tailwind classes) for styling to ensure rapid, scalable UI engineering.
> * Use `@expo/vector-icons` (Lucide or Feather) with a strict 2px stroke width for all iconography to maintain the premium feel.
> * Wrap the main scrollable areas in a `KeyboardAvoidingView` and `ScrollView` to ensure inputs are never blocked by the device keyboard.
> 
> 
> Please generate the exact TypeScript code for these two screens and the associated Theme Context provider.

---