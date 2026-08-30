# UX — Render Engine

## User Flow

### Preview in Template Builder

```
Click "Preview" in Template builder
    │
    ├── System invokes render engine
    ├── Shows loading indicator
    │
    ├── Render completes
    │       │
    │       ├── Success: Preview shown in split panel
    │       └── Errors: Error list shown below preview
    │
    ▼
Close preview
```

### Generate on Workflow Completion

```
Final step approved
    │
    ├── System invokes render engine
    ├── Shows "Generating document..." toast
    │
    ├── Render completes
    │       │
    │       ├── Success: Document created, shown in list
    │       └── Failure: Error notification, document marked failed
    │
    ▼
Staff can view/download
```

### Handle Render Errors

```
Render encounters error
    │
    ├── Error collected (not thrown)
    ├── Warning shown in preview
    │
    ├── User decides:
    │       │
    │       ├── Fix issue and re-render
    │       └── Continue with errors (if allowed)
    │
    ▼
Render completes with warnings
```

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Start render | Loading | "Rendering..." |
| Render complete | Toast | "Document generated" |
| Render error | Error panel | List of errors |
| PDF generated | Toast | "PDF ready for download" |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+P | Preview |
| Escape | Close preview |
