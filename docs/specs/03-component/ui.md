# UI — Component

## Pages

### Components List

**Route:** `/components`

**Layout:** Workspace (sidebar + canvas)

**Components:**
- AppSidebar
- ComponentList (card grid)
- EmptyState

**States:**
- Loading: Skeleton cards
- Empty: "No components yet — Build reusable document blocks"
- Error: Toast with retry
- Success: Card grid populated

### Component Builder

**Route:** `/components/:id`

**Layout:** Three-panel builder

```
┌──────────────┬──────────────────────────────────┬──────────────┐
│ INSERT       │                                  │ PROPERTIES   │
│              │                                  │              │
│ Text         │         DOCUMENT CANVAS          │ Component    │
│ Dynamic Text │                                  │              │
│ Image        │      ┌────────────────────┐      │ Name         │
│ Table        │      │                    │      │ Mode         │
│              │      │   Content Area     │      │              │
│              │      │                    │      │ Requirements │
│              │      │                    │      │              │
└──────────────┴──────────────────────────────────┴──────────────┘
```

### Component Create

**Route:** `/components/create`

**Layout:** Same as builder (empty canvas)

## Information Hierarchy

```
1. Breadcrumb: Components / [Name]
2. Status Badge + Version
3. Action Buttons: Preview, Save, Publish
4. Three-panel layout: Insert | Canvas | Properties
```

## Three-Panel Layout

### Left Panel — Insert Tools

- Text block
- Dynamic text (token)
- Image / Dynamic image
- Table
- Divider

### Center Panel — Document Canvas

- Tiptap rich text editor
- Dynamic tokens rendered as chips/badges
- Click token → select in properties panel
- Drag to reorder blocks

### Right Panel — Properties

**When nothing selected:**
- Component name
- Display name
- Description
- Mode: Single / Collection

**When token selected:**
- Token name
- Data type
- Required toggle

**When in Collection mode:**
- Source table selector
- Item alias
- Filter expression

## Data Requirements Panel

```
Data Requirements

┌───────────────────────────────────────────┐
│ nama        Text          Required    ☑   │
│ nip         Text          Required    ☑   │
│ jabatan     Text          Optional    ☐   │
└───────────────────────────────────────────┘

                         + Add requirement
```

## Navigation

- Breadcrumb: Components / [Name]
- Keyboard: Cmd+S save, Cmd+K command palette

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop | Three-panel builder |
| Tablet | Two-panel (canvas + drawer) |
| Mobile | Full-screen canvas, bottom sheet properties |

## Loading State

- Canvas: Skeleton blocks
- Properties: Skeleton form

## Empty State

### No Components

**Message:** "No components yet"
**Description:** "Build reusable document blocks that can be used across your templates."
**Action:** "[+ Create Component]"

### Empty Canvas

**Message:** "Start building"
**Description:** "Add text, dynamic tokens, or tables from the insert panel."
**Action:** (none — guided by insert panel)

## Error State

- API Error: Toast
- Validation Error: Inline in properties panel
- Save Error: Toast with retry

## Accessibility

- Keyboard: Tab through insert tools, canvas, properties
- Screen reader: Announce block types, token names
- Focus: Visible focus on canvas elements
- ARIA: aria-label on insert buttons, aria-selected on canvas blocks
