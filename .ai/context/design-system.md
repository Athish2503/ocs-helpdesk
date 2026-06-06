# OCS Helpdesk Design System v1

## Brand Foundation

Primary Brand Color

```css
#5FC0F9
```

Brand Personality

* Professional
* Trustworthy
* Modern
* Efficient
* Friendly
* Enterprise-ready

Avoid:

* Neon colors
* Overly playful gradients
* Glassmorphism everywhere
* Excessive animations

---

# Color System

## Primary Scale

```css
primary-50:  #F0FAFF
primary-100: #D9F3FE
primary-200: #B3E7FD
primary-300: #8DDCFB
primary-400: #67D0FA
primary-500: #5FC0F9
primary-600: #38B1F7
primary-700: #129FF0
primary-800: #0D7FC0
primary-900: #085F90
```

---

## Success

```css
success-50:  #ECFDF3
success-100: #D1FADF
success-500: #12B76A
success-700: #027A48
```

Used For:

* Ticket resolved
* Successful actions
* Active systems

---

## Warning

```css
warning-50:  #FFFAEB
warning-100: #FEF0C7
warning-500: #F79009
warning-700: #B54708
```

Used For:

* Pending tickets
* SLA warnings
* User attention

---

## Error

```css
error-50:  #FEF3F2
error-100: #FEE4E2
error-500: #F04438
error-700: #B42318
```

Used For:

* Failed actions
* Validation errors
* Critical tickets

---

## Neutral Scale

```css
gray-50:  #F9FAFB
gray-100: #F3F4F6
gray-200: #E5E7EB
gray-300: #D1D5DB
gray-400: #9CA3AF
gray-500: #6B7280
gray-600: #4B5563
gray-700: #374151
gray-800: #1F2937
gray-900: #111827
```

---

# Theme System

## Light Theme

Background

```css
background: #FFFFFF
surface: #F9FAFB
card: #FFFFFF
```

Text

```css
primary-text: #111827
secondary-text: #4B5563
muted-text: #9CA3AF
```

Borders

```css
#E5E7EB
```

---

## Dark Theme

Background

```css
background: #0F172A
surface: #111827
card: #1E293B
```

Text

```css
primary-text: #F8FAFC
secondary-text: #CBD5E1
muted-text: #94A3B8
```

Borders

```css
#334155
```

---

## Midnight Theme

For power users.

```css
background: #020617
surface: #0F172A
card: #111827

accent: #5FC0F9
```

---

## OCS Blue Theme

Brand-centric theme.

```css
background: #F7FBFE
surface: #FFFFFF
accent: #5FC0F9
highlight: #D9F3FE
```

---

# Typography

Font Family

```css
Inter
```

Fallback

```css
Inter, Segoe UI, sans-serif
```

---

## Scale

```css
Display: 48px
H1: 36px
H2: 30px
H3: 24px
H4: 20px
Body: 16px
Small: 14px
Caption: 12px
```

---

# Border Radius

```css
xs: 4px
sm: 6px
md: 8px
lg: 12px
xl: 16px
2xl: 20px
```

Default:

```css
12px
```

---

# Shadows

## Small

```css
0 1px 2px rgba(0,0,0,0.05)
```

## Medium

```css
0 4px 12px rgba(0,0,0,0.08)
```

## Large

```css
0 10px 30px rgba(0,0,0,0.12)
```

---

# Buttons

## Primary

Background

```css
#5FC0F9
```

Hover

```css
#38B1F7
```

Active

```css
#129FF0
```

Text

```css
#FFFFFF
```

---

## Secondary

```css
Background: Transparent
Border: Primary-500
Text: Primary-600
```

---

## Ghost

```css
Transparent
```

Hover

```css
Primary-50
```

---

## Danger

```css
Error-500
```

---

# Inputs

Height

```css
44px
```

Border Radius

```css
12px
```

Focus

```css
2px Primary-500 Ring
```

---

# Ticket Status Colors

Open

```css
#F79009
```

Assigned

```css
#5FC0F9
```

In Progress

```css
#129FF0
```

Waiting Customer

```css
#F79009
```

Resolved

```css
#12B76A
```

Closed

```css
#6B7280
```

Escalated

```css
#F04438
```

---

# Micro Interactions

## Buttons

Hover

* Scale 1.02

Tap

* Scale 0.98

Duration

```css
150ms
```

---

## Cards

Hover

```css
translateY(-2px)
```

Shadow increase

```css
small -> medium
```

---

## Sidebar

Expand

```css
200ms ease
```

Collapse

```css
180ms ease
```

---

## Ticket Status Change

Use:

* Fade
* Color transition

Avoid:

* Bounce
* Spin
* Elastic effects

---

# Loading States

Use Skeletons

Never use:

* Full page spinners
* Blocking loaders

---

# Dashboard Layout

Sidebar

```css
280px
```

Top Bar

```css
72px
```

Content Width

```css
max-width: 1440px
```

---

# Design Principles

1. Information First
2. Fast Navigation
3. Enterprise Simplicity
4. Accessibility
5. Keyboard Friendly
6. Minimal Cognitive Load

The interface should feel like Linear, Notion, and Jira had a surprisingly sensible child.
