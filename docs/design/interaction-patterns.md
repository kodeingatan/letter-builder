# Interaction Patterns

## Pattern 1: Workspace Navigation

```
Sidebar (resource list)
    │
    ├── Click resource → Open in canvas
    │
    ├── Right-click → Context menu (edit, duplicate, delete)
    │
    └── Drag → Reorder
```

## Pattern 2: Builder Canvas

```
Left Panel (insert tools)
    │
    ├── Click item → Insert into canvas
    │
Center Canvas (document/content)
    │
    ├── Click element → Select + show properties
    │
    ├── Drag → Reorder/move
    │
    └── Double-click → Edit inline
    │
Right Panel (properties)
    │
    └── Edit selected element properties
```

## Pattern 3: Command Palette (Cmd+K)

```
Open palette
    │
    ├── Type query → Filter results
    │
    ├── Select action → Execute
    │
    └── Esc → Close
```

## Pattern 4: Form Submission

```
Fill form
    │
    ├── Real-time validation → Inline errors
    │
    ├── Submit → Validate all
    │
    ├── Success → Toast + navigate/update
    │
    └── Error → Toast + highlight fields
```

## Pattern 5: Destructive Action

```
Click delete
    │
    ├── Show confirmation dialog
    │
    ├── Show dependencies (if any)
    │
    ├── Confirm → Execute + toast
    │
    └── Cancel → Close dialog
```

## Pattern 6: Drag and Drop

```
Start drag
    │
    ├── Show drag preview
    │
    ├── Show drop indicator
    │
    ├── Drop → Reorder/insert
    │
    └── Esc → Cancel drag
```

## Pattern 7: Split View (Editor + Preview)

```
┌─────────────────────┬─────────────────────┐
│ Editor              │ Live Preview        │
│                     │                     │
│ Edit content        │ Rendered output     │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

## Pattern 8: Step Wizard

```
Step 1 → Step 2 → Step 3 → Complete
  │         │         │
  │         │         └── Fill data
  │         └── Fill data
  └── Fill data
```

With progress indicator and back/next navigation.
