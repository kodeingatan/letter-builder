# UX — [Feature Name]

## User Flow

```
[Start]
    │
    ▼
[Step 1]
    │
    ├── [Branch A] → [Step 2a]
    │
    └── [Branch B] → [Step 2b]
    │
    ▼
[End]
```

## Interactions

### [Interaction 1]

**Trigger:** [What triggers it]
**Action:** [What happens]
**Feedback:** [What user sees]

### [Interaction 2]

**Trigger:** [What triggers it]
**Action:** [What happens]
**Feedback:** [What user sees]

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Create | Toast | "Created successfully" |
| Update | Toast | "Saved" |
| Delete | Dialog + Toast | Confirmation → "Deleted" |
| Error | Inline + Toast | Show error message |

## Empty States

### No [Resources] Yet

**Message:** "No [resources] yet"
**Description:** "[Helpful description]"
**Action:** "[Create button]"

### Search No Results

**Message:** "No results found"
**Description:** "Try a different search term"

## Loading States

- Initial load: Skeleton/spinner
- Submitting: Button loading state
- Background: Subtle indicator

## Error Handling

| Error Type | Display | Action |
|-----------|---------|--------|
| Network | Toast | Retry button |
| Validation | Inline | Highlight fields |
| Permission | Page | Contact admin |
| Not found | Page | Go back |

## Confirmation

### Destructive Actions

**Trigger:** Delete button
**Dialog:** "Are you sure you want to delete [item]?"
**Warning:** "This action cannot be undone"
**Actions:** Cancel / Delete

### With Dependencies

**Dialog:** "This [item] is used by [X] other resources"
**Warning:** "Deleting may break these resources"
**Actions:** Cancel / Delete Anyway

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+K | Command palette |
| Cmd+S | Save |
| Esc | Close panel |
| Delete | Delete selected |
