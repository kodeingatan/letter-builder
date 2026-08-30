# Design System

## Design Language

**"Professional Workspace"** — Not an admin panel. Not a dashboard. A productivity application.

Character:
- Modern
- Professional
- Calm
- Dense but breathable
- Contextual
- Visual
- Keyboard-friendly
- Desktop-first
- Responsive

## Foundation

### Color

**Primary:** Blue (with semantic tokens)

```
color.primary          — Primary actions, links, focus
color.primary.hover    — Hover state
color.primary.active   — Active/pressed state
color.primary.soft     — Soft background (e.g., selected row)
```

**Semantic:**
```
color.success          — Success states
color.warning          — Warning states
color.danger           — Error, destructive actions
color.info             — Informational
color.neutral          — Text, borders, backgrounds
```

### Surface System

```
background.canvas      — Page background
background.surface     — Card/panel background
background.subtle      — Subtle differentiation
background.elevated    — Popover, dropdown
background.hover       — Hover state
background.selected    — Selected item
background.active      — Active state
```

### Typography

```
Display                — Hero text
Heading 1              — Page title
Heading 2              — Section title
Heading 3              — Subsection title
Body Large             — Emphasized body
Body                   — Default body
Body Small             — Secondary text
Caption                — Timestamps, metadata
Label                  — Form labels
Mono                   — Code, table names, expressions
```

### Spacing (4px base grid)

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

### Radius

```
radius.sm              — Small elements (badges, chips)
radius.md              — Inputs, buttons
radius.lg              — Cards, panels
radius.xl              — Dialogs, modals
radius.full            — Avatars, circular elements
```

### Elevation

```
elevation.none         — Flat
elevation.sm           — Subtle lift (cards)
elevation.md           — Dropdown, popover
elevation.lg           — Dialog, modal
```

## Component Library

**Base:** Nuxt UI primitives

**Custom layers:**
```
Nuxt UI → Design Tokens → App Components → Feature Components
```

## Icon System

**Lucide Vue Next** — consistent, minimal icon set
