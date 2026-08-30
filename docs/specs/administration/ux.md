# UX — Administration

## User Flow

### Create Workflow

```
Click "+ Create Administration"
    │
    ▼
Empty builder opens
    │
    ├── Enter name in properties panel
    ├── Add Step 1
    │       ├── Select template
    │       ├── Select role
    │       ├── (optional) Add condition
    │       │
    ├── Add Step 2
    │       ├── Select template
    │       ├── Select role
    │
    ├── Add Step 3
    │       ├── ...
    │
    ▼
Click "Publish" → Toast "Workflow published"
```

### Execute Workflow

```
Staff clicks "Execute" on a Published Workflow
    │
    ▼
Instance created → First step assigned
    │
    ├── Staff opens instance
    ├── Fills in data
    ├── Previews document
    ├── Clicks "Approve" → advances to next step
    │
    ├── Next staff opens instance
    ├── Reviews data
    ├── Clicks "Approve" → final step
    │
    ├── Final staff reviews and approves
    │
    ▼
Workflow complete → Document generated
```

### Reject Workflow

```
Staff opens instance
    │
    ├── Reviews data
    ├── Clicks "Reject"
    │       │
    │       ├── Enter reason
    │       ├── Enter comment
    │       │
    │       ▼
    │   Instance marked Rejected
    │   Notification sent (future)
    │
    ▼
Workflow ends
```

### Track Progress

```
Staff opens instance
    │
    ├── Sees step progress: ✓ → ● → ○
    ├── Sees current step name and role
    ├── Sees history of actions
    │
    ▼
Knows exactly where document is
```

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Execute | Toast | "Instance created" |
| Approve | Toast | "Step approved" |
| Reject | Toast | "Step rejected" |
| Complete | Toast | "Workflow complete" |
| Validation error | Form error | Shows which field invalid |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+S | Save |
| Cmd+Enter | Approve |
| Cmd+Backspace | Reject |
| Escape | Close panel |
