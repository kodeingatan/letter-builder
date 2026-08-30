# UX — Component

## User Flow

### Create Component

```
Click "+ Create Component"
    │
    ▼
Empty builder opens
    │
    ├── Enter name in properties panel
    ├── Add content in canvas
    │       │
    │       ├── Type text
    │       ├── Insert dynamic token → popup: select/enter name
    │       │
    │       ▼
    │   Tokens appear as chips in canvas
    │
    ├── Add requirements in properties panel
    │       │
    │       └── Each token auto-suggests matching requirement
    │
    ▼
Click "Save"
    │
    └── Toast "Component saved"
```

### Insert Dynamic Token

```
Click "Dynamic Text" in insert panel OR type {{ in canvas
    │
    ▼
Token popup appears
    │
    ├── Select existing requirement
    │   OR
    ├── Enter new token name
    │       │
    │       └── Auto-create requirement
    │
    ▼
Token chip appears in canvas
```

### Configure Collection Mode

```
Select "Collection" mode in properties
    │
    ▼
Loop configuration section appears
    │
    ├── Select source table (Global Table)
    ├── Enter item alias (e.g., "employee")
    │
    ▼
Canvas shows loop indicator
    │
    └── "↻ REPEAT: employee" banner
```

### Preview Component

```
Click "Preview"
    │
    ▼
Preview drawer opens
    │
    ├── Shows rendered content with sample data
    ├── Tokens replaced with placeholder values
    │
    ▼
Close preview
```

### Publish Component

```
Click "Publish"
    │
    ▼
Component saved as new version
    │
    └── Toast "Component published (v2)"
```

## Interactions

### Token Insert

**Trigger:** Click "Dynamic Text" or type {{
**Action:** Open token selector popup
**Feedback:** Token chip appears in canvas

### Token Select

**Trigger:** Click token chip in canvas
**Action:** Select token, show in properties panel
**Feedback:** Token highlighted, properties updated

### Canvas Edit

**Trigger:** Click in canvas
**Action:** Focus for typing
**Feedback:** Cursor appears, toolbar active

### Drag Reorder

**Trigger:** Drag handle on block
**Action:** Reorder blocks
**Feedback:** Drop indicator, ghost preview

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Save | Toast | "Component saved" |
| Publish | Toast | "Component published (vN)" |
| Delete token | Inline | Requirement warning if orphaned |
| Validation error | Inline | Properties panel errors |

## Empty States

### No Components

**Message:** "No components yet"
**Description:** "Build reusable document blocks that can be used across your templates."
**Action:** "[+ Create Component]"

### Empty Canvas

**Message:** "Start building"
**Description:** "Add text, dynamic tokens, or tables from the insert panel."

## Loading States

- Initial load: Skeleton canvas blocks
- Saving: Button spinner
- Preview loading: Skeleton preview

## Error Handling

| Error Type | Display | Action |
|-----------|---------|--------|
| Network | Toast | Retry |
| Validation | Inline | Fix in properties |
| Duplicate name | Inline | Change name |

## Confirmation

### Delete Component

**Trigger:** Delete button
**Dialog:** "Delete '[name]'?"
**Warning:** "This component is used by [N] templates." (if applicable)
**Actions:** Cancel / Delete

### Publish with Orphaned Tokens

**Trigger:** Publish with token without matching requirement
**Dialog:** "Some tokens don't have data requirements"
**Actions:** Cancel / Publish Anyway

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+S | Save |
| Cmd+K | Command palette |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Escape | Close panel/drawer |
| Delete | Delete selected block |
