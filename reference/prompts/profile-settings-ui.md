Role: Expert React Native (Expo) UI Engineer.
Task: Implement the `NotificationsScreen.tsx` and `ProfileScreen.tsx` for the FinArivu AI app based on the provided reference designs.

CRITICAL CONSTRAINT: 
DO NOT use NativeWind, Tailwind CSS, or any utility-class framework. You must strictly use React Native's `StyleSheet.create({})` for all styling. Create modular, clean, and highly performant style definitions. Code must be production-ready and broken into reusable sub-components.

Design Tokens & Global Constraints:
- Background: #F8FAFC (Pure Slate Light)
- Card Surface: #FFFFFF (White) with subtle shadow (shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2)
- Primary Blue: #0A4CC5 | Deep Blue (Action/Headers): #083A96
- Gold: #F4B400 | Success Green: #16A34A | Warning Orange: #F59E0B | Danger Red: #DC2626
- Text: Primary (#0F172A), Secondary (#64748B), Micro/Timestamp (#94A3B8)
- Typography: Inter Font Family (Weights: 400, 500, 600, 700).
- Radii: Large Cards (24px), Inner Data Cards/Icons (12px-16px), Buttons (16px).

---

Screen 1: NotificationsScreen.tsx (Based on Notifications_2.png)
Architecture: Use a `SectionList` or `ScrollView` grouped by date categories.
1. Header: Back Arrow, title "Notifications" (Primary Blue, 20pt, Bold), right icon (3 vertical dots).
2. Section Headers: "TODAY", "YESTERDAY", "THIS WEEK" (12pt, Uppercase, SemiBold, Secondary text, generous top margin).
3. Standard Notification Card:
   - White surface, 16px border radius, padding 16px.
   - Top right absolute positioned element: Unread indicator (Small Primary Blue dot) and Timestamp (e.g., "2h ago").
   - Left: Icon container with a soft tinted background (e.g., light blue for health, light orange for alerts).
   - Content: Title (Bold, 15pt), Body text (13pt, Secondary text).
   - In-text highlights: Use Green/Orange for specific numbers (e.g., "+2 points", "85%").
   - Optional Footer: Action text (e.g., "VIEW SCORE >") or a progress bar (e.g., Orange track for Budget Alert).
4. AI Insight Notification Card:
   - Soft yellow/gold background surface (#FFFBED) instead of white.
   - Gold sparkle icon in a slightly darker yellow container.
   - Primary Action Button: Solid dark gold/brown button, text "Optimize Spending".
5. Footer: Centered micro-text "TOGGLE VIEW" at the bottom of the list.

---

Screen 2: ProfileScreen.tsx (Based on Profile_2.png)
Architecture: `ScrollView` (showsVerticalScrollIndicator={false}).
1. Header: Back Arrow, title "Profile" (Primary Blue, 20pt, Bold), right icon (Settings Gear).
2. Hero Section:
   - Avatar: Large circular image (80x80). Bottom-right overlapping blue circle with a white pencil edit icon.
   - Name: "Mohanapriyan" (20pt, Bold).
   - Badges: Flex-row containing a Gold pill ("★ AI Personal CFO Member") and secondary text "Member Since: 2026".
3. Profile Completion Card:
   - Center aligned. Large circular progress ring (Dark Blue stroke). Inside text: "92%" (32pt, Bold), "COMPLETE" (10pt).
   - Subtext and a "Complete Now" text link (Primary Blue, SemiBold).
4. Core Stats Stack (Health, Net Worth, Goals):
   - 3 separate white cards stacked vertically.
   - Each card features a 4px wide solid colored left border: Blue (Health), Green (Net Worth), Gold (Goals).
   - Layout: Title (Secondary text) and Value (Bold, 24pt) on the left. Status text (e.g., "Excellent" in green, "+14% YoY") inline. Right-aligned tinted icon (Shield, Wallet, Target).
5. Financial Journey AI Card:
   - Soft blue background (#EEF5FF).
   - Top left: Dark Blue AI icon. Top right absolute position: Faint, oversized watermark icon (Gear/Head).
   - Text: "Your Financial Journey", followed by body text highlighting metrics in Primary Blue ("12 points", "2 financial milestones").
   - Button: Primary Blue solid button "View Milestones".
6. Account Management List:
   - Section Title: "Account Management" (14pt, SemiBold).
   - 4 List Items: Personal Information, Financial Preferences, Connected Accounts, Notifications.
   - Each item: Soft gray/blue icon box, Title (15pt, SemiBold), Subtitle (12pt, Secondary text), Right Chevron.
7. Security & Logout Section:
   - Flex-row checkmarks: "Verified Email", "Verified Mobile" (Green check icons). Center checkmark: "Profile Secured".
   - Logout Button: Red exit icon, text "Logout Account" (Danger Red, SemiBold, centered).

Execution Requirements:
- Build reusable UI components: `<NotificationItem />`, `<ProfileStatCard />`, `<SettingsListItem />`.
- Enforce strict `StyleSheet` usage at the bottom of the files. Use semantic naming (e.g., `unreadDot`, `statCardLeftBorder`).
- Ensure proper safe area padding at the bottom for the floating navigation bar.
- Use `react-native-svg` for the circular progress rings.