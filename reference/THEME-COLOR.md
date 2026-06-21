# 🎨 FINARIVU AI THEME SYSTEM

Goal:

Create a premium financial-tech experience that conveys:

- Trust
- Intelligence
- Wealth Growth
- Professionalism

---

# THEME ARCHITECTURE

Rules:

- No hardcoded colors
- Use ThemeContext
- Support:

  - Light
  - Dark
  - System

- Colors only from theme files

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

Based on FinArivu Logo

Royal Blue:
#0D47A1

Financial Gold:
#F4B400

Dark Navy:
#071C3F

Success Green:
#22C55E

Warning Orange:
#F59E0B

Danger Red:
#DC2626

White:
#FFFFFF

Black:
#000000

---

# COLORS

export const BaseColors = {

primary: '#0D47A1',

primaryDark: '#071C3F',

accent: '#F4B400',

success: '#22C55E',

warning: '#F59E0B',

danger: '#DC2626',

backgroundLight: '#F8FAFC',

surfaceLight: '#FFFFFF',

backgroundDark: '#0B1220',

surfaceDark: '#111827',

textPrimaryLight: '#0F172A',

textSecondaryLight: '#475569',

textPrimaryDark: '#F8FAFC',

textSecondaryDark: '#CBD5E1',

};

---

# LIGHT THEME

Focus:

- Banking App Feel
- Clean Analytics
- Premium Reports

Characteristics:

- White background
- Blue accents
- Gold highlights
- High readability

---

# DARK THEME

Focus:

- Bloomberg Terminal Inspired
- Modern Fintech Feel

Characteristics:

- Deep Navy Background
- Financial Charts
- Premium Dashboard Experience

---

# CHART COLORS

Income:
#22C55E

Expenses:
#DC2626

Investments:
#0D47A1

Goals:
#F4B400

Net Worth:
#14B8A6

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

---

# DASHBOARD DESIGN RULES

Cards:

- borderRadius: 16
- Elevation / Shadow
- Consistent Padding

Charts:

- Responsive
- Accessible
- Theme Aware

Lists:

- Alternating Row Colors
- Sticky Headers

---

# ACCESSIBILITY

Maintain:

- WCAG AA Contrast
- Keyboard Navigation
- Screen Reader Labels

Minimum Touch Target:

44x44

---

# THEME HOOK

Always use:

const { colors } = useTheme();

Never:

style={{
  color: '#0D47A1'
}}

Always:

style={{
  color: colors.primary
}}