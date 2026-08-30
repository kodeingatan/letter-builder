# UI — Render Engine

## Pages

No dedicated pages. Render Engine is used internally by:

- **Template Builder** — Live preview
- **Administration Builder** — Instance preview
- **Document Viewer** — Rendered output

## Preview Integration

### In Template Builder

When "Preview" is clicked:

```
┌─────────────────────┬─────────────────────┐
│ Editor              │ Live Preview        │
│                     │                     │
│ Template content    │ Rendered HTML       │
│ with blocks         │ with resolved data  │
│                     │                     │
│                     │ Errors shown below  │
└─────────────────────┴─────────────────────┘
```

### In Administration Instance

When viewing an instance:

```
┌──────────────────────────────────────────┐
│ Instance: WF-001                         │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ DOCUMENT PREVIEW                     │ │
│ │                                      │ │
│ │ [Rendered HTML]                      │ │
│ │                                      │ │
│ │ Errors: None                         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [Approve] [Reject] [Download PDF]        │
└──────────────────────────────────────────┘
```

## Error Display

When rendering has errors:

```
┌──────────────────────────────────────────┐
│ ⚠ Render Warnings                       │
│                                          │
│ • Component "footer" not found           │
│ • Variable "alamat" undefined            │
│                                          │
│ [Continue with errors] [Cancel]          │
└──────────────────────────────────────────┘
```

## Loading State

During rendering:

```
┌──────────────────────────────────────────┐
│ ⏳ Rendering document...                 │
│                                          │
│ ████████████████░░░░ 75%                 │
│                                          │
│ Resolving components...                  │
└──────────────────────────────────────────┘
```
