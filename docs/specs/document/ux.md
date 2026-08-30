# UX — Document

## User Flow

### View Document

```
Navigate to Documents
    │
    ├── Search/filter documents
    │
    ├── Click document row
    │
    ▼
Document view opens
    │
    ├── Content displayed
    ├── Metadata shown
    │
    ├── Click "Download PDF" → file downloads
    ├── Click "Print" → print dialog opens
    │
    ▼
Close
```

### Download PDF

```
Click "Download PDF"
    │
    ├── Browser downloads PDF
    │
    ▼
PDF opened in default viewer
```

### Generate Document

```
Workflow final step approved
    │
    ├── System generates HTML
    ├── System generates PDF
    │
    ├── Document appears in list
    │
    ▼
Staff can view/download
```

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Generate | Loading | "Generating document..." |
| Generated | Toast | "Document generated" |
| Download | File save | PDF downloaded |
| Failed | Error | "Generation failed, retry" |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+P | Print |
| Cmd+S | Download PDF |
| Escape | Close viewer |
