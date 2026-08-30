# UX — Template

## User Flow

### Create Template

```
Click "+ Create Template"
    │
    ▼
Empty builder opens
    │
    ├── Enter name in properties panel
    ├── Add static text content in canvas
    ├── Insert Components from left panel
    │       │
    │       ▼
    │   Component block appears in canvas
    │   Requirements shown in right panel
    │
    ├── Bind each requirement to data source
    │
    ▼
Click "Save" → Toast "Template saved"
```

### Insert Component

```
Click "+ Component" in left panel
    │
    ▼
Component picker opens (command palette)
    │
    ├── Search/select component
    │
    ▼
Component block inserted in canvas
    │
    └── Right panel shows requirements + binding UI
```

### Bind Data

```
Component block selected
    │
    ▼
Right panel shows requirements
    │
    ├── For each requirement:
    │       │
    │       ├── Select source type (Global Table / Manual / Expression / System)
    │       ├── Select table/field
    │       │
    │       └── Binding saved
    │
    ▼
All requirements bound → green checkmark
```

### Configure Loop

```
Insert loop block OR set Component to collection mode
    │
    ▼
Loop configuration in right panel
    │
    ├── Select source table
    ├── Enter item alias
    │
    ▼
Canvas shows: "↻ REPEAT: employee"
```

### Configure Condition

```
Insert condition block from left panel
    │
    ▼
Condition block appears in canvas
    │
    ├── Enter expression in right panel
    │       │
    │       └── "status == 'active'"
    │
    ▼
Content inside block only renders when condition is true
```

### Preview

```
Click "Preview"
    │
    ▼
Split-screen preview opens
    │
    ├── Left: editor
    ├── Right: rendered output
    │
    ├── Tokens resolved to sample data
    ├── Components rendered
    ├── Loops expanded
    ├── Conditions evaluated
    │
    ▼
Close preview
```

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Save | Toast | "Template saved" |
| Publish | Toast | "Template published (vN)" |
| Unbound requirement | Warning badge | "3 requirements unbound" |
| Binding complete | Green check | "All bindings complete" |
| Preview | Split panel | Live rendered output |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+S | Save |
| Cmd+P | Preview |
| Cmd+K | Command palette |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Escape | Close panel |
| Delete | Delete selected block |
