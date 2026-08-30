# UX Principles

## Discoverability

- Actions should be visible, not hidden behind menus
- Use command palette (Cmd+K) for power users
- Show available actions on hover/selection
- Use empty states to guide users

## Feedback

Every user action must have feedback:

| Action | Feedback |
|--------|----------|
| Save | Toast: "Saved" |
| Delete | Confirmation dialog |
| Loading | Skeleton/spinner |
| Error | Inline error message |
| Success | Toast + state update |

## Error Prevention

- Validate before save, not after
- Show destructive action warnings
- Disable unavailable actions
- Confirm irreversible operations

## Progressive Disclosure

- Show essential options first
- Reveal advanced options on demand
- Use property panels for detailed config
- Avoid overwhelming forms

## Predictable Interaction

- Click opens/edits
- Hover reveals actions
- Drag reorders
- Right-click shows context menu
- Esc closes panels/modals

## User Efficiency

- Keyboard shortcuts for common actions
- Inline editing where possible
- Bulk operations for lists
- Recent items for quick access
