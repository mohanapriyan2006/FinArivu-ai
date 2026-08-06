# 🎨 FINARIVU AI THEME SYSTEM

Goal:

Create a premium financial-tech experience that conveys:

* Trust
* Intelligence
* Wealth Growth
* Professionalism

---

# THEME ARCHITECTURE

Rules:

* No hardcoded colors
* Use ThemeContext
* Support:
* Light
* Dark
* System


* Colors only from theme files

---

# FILE STRUCTURE

src/

├── theme/
│
├── colors.ts
├── light.ts
├── dark.ts
├── typography.ts
├── index.ts
│
├── contexts/
│
└── ThemeContext.tsx

├── hooks/

└── useTheme.ts

---

# BRAND COLORS

Based on FinArivu AI "Cognitive Lavender" Aesthetic

Digital Lavender (Primary):
#5B4EFA

Royal Blue (Secondary):
#3B82F6

Success Emerald:
#10B981

Warning Amber:
#F59E0B

Danger Rose:
#F43F5E

Deep Navy (Text Hero):
#0B112B

Pure White:
#FFFFFF

Pitch Black:
#000000

---

# COLORS

export const BaseColors = {

primary: '#5B4EFA',

primarySoft: '#EBEBFF',

secondary: '#3B82F6',

success: '#10B981',

warning: '#F59E0B',

danger: '#F43F5E',

backgroundLight: '#FAFAFF',

surfaceLight: '#FFFFFF',

borderLight: '#E2E6FA',

backgroundDark: '#090A10',

surfaceDark: '#121420',

borderDark: '#23263B',

textHeroLight: '#0B112B',

textPrimaryLight: '#1E293B',

textSecondaryLight: '#64748B',

textHeroDark: '#FFFFFF',

textPrimaryDark: '#E2E8F0',

textSecondaryDark: '#8B949E',

};

---

# LIGHT THEME (Cognitive Lavender)

Focus:

* Ethereal AI Companion Feel
* Clean, Breathable Analytics
* Soft Atmospheric Gradients

Characteristics:

* Icy, ultra-cool white background
* Vibrant lavender/indigo accents
* Soft borders and wash backgrounds for badges
* High readability with deep navy typography

---

# DARK THEME (Deep Nebula)

Focus:

* Futuristic Terminal Inspired
* High-end SaaS Dashboard Experience

Characteristics:

* Deep space/violet-black background
* Glowing indigo and neon electric blue charts
* Slate-purple elevated surfaces
* Pure white hero text for maximum contrast

---

# CHART COLORS

Income:
#10B981

Expenses:
#F43F5E

Investments:
#5B4EFA

Goals:
#F59E0B

Net Worth:
#3B82F6

---

# TYPOGRAPHY

Primary Font:

Inter

Fallback:

System UI

Font Weights:

400 Regular
500 Medium
600 SemiBold
700 Bold
800 ExtraBold (For Hero Values)

---

# DASHBOARD DESIGN RULES

Cards:

* borderRadius: 24 (Updated for premium, softer look)
* Elevation / Shadow: Subtle, blurred drop shadows (glassmorphic tint where applicable)
* Consistent Padding: 20px base padding

Charts:

* Responsive
* Accessible
* Theme Aware
* Animated drawing (Reanimated)

Lists:

* Alternating Row Colors / Soft border dividers
* Sticky Headers

---

# ACCESSIBILITY

Maintain:

* WCAG AA Contrast
* Keyboard Navigation
* Screen Reader Labels

Minimum Touch Target:

44x44

---

# THEME HOOK

Always use:

const { colors } = useTheme();

Never:

style={{
color: '#5B4EFA'
}}

Always:

style={{
color: colors.primary
}}