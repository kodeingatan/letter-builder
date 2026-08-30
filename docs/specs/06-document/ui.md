# UI — Document

## Pages

### Documents List

**Route:** `/documents`

**Layout:** Workspace (sidebar + canvas)

### Document View

**Route:** `/documents/:id`

### Document Settings

**Route:** `/documents/settings`

## Documents List

```
┌─────────────────────────────────────────────────────┐
│ Documents                            Filter: [▼ All] │
│ Search: [..............................]             │
├─────────────────────────────────────────────────────┤
│ ▸ SK-2026-001 │ Surat Keputusan │ 2026-08-30 │ ✓   │
│ ▸ SK-2026-002 │ Surat Tugas     │ 2026-08-29 │ ✓   │
│ ▸ ST-2026-001 │ Surat Tugas     │ 2026-08-28 │ ✓   │
└─────────────────────────────────────────────────────┘
```

### Filters

- Search by name
- Filter by template
- Filter by workflow
- Filter by date range
- Status filter (generated / failed)

## Document View

**Route:** `/documents/:id`

```
┌──────────────────────────────────────────────────────┐
│ SK-2026-001: Surat Keputusan              [Download] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │                                                  │ │
│ │                 DOCUMENT CONTENT                 │ │
│ │                                                  │ │
│ │   KOP SURAT                                      │ │
│ │                                                  │ │
│ │   Nomor: SK/2026/001                             │ │
│ │                                                  │ │
│ │   Yang bertanda tangan di bawah ini:             │ │
│ │                                                  │ │
│ │   ...                                            │ │
│ │                                                  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ METADATA                                         │ │
│ │ Template: Surat Keputusan                        │ │
│ │ Workflow: Proses SK                              │ │
│ │ Generated: 2026-08-30 10:00                      │ │
│ │ Status: Generated                                │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ [View PDF] [Print]                                   │
└──────────────────────────────────────────────────────┘
```

## Document Settings

**Route:** `/documents/settings`

```
┌──────────────────────────────────────────────────────┐
│ Document Settings                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Page Size:   [A4 ▼]                                 │
│                                                      │
│ Margins:                                           │
│   Top:    [ 20 ] mm                                 │
│   Right:  [ 15 ] mm                                 │
│   Bottom: [ 20 ] mm                                 │
│   Left:   [ 15 ] mm                                 │
│                                                      │
│ Header:  [ ................................... ]     │
│ Footer:  [ ................................... ]     │
│                                                      │
│ [Save Settings]                                      │
└──────────────────────────────────────────────────────┘
```

## Viewer Features

- HTML rendering in iframe or div
- Zoom in/out
- Full screen
- Print button
- Download PDF button

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop | Full viewer |
| Tablet | Viewer with scroll |
| Mobile | PDF viewer |

## Loading / Empty / Error States

- Loading: Skeleton document
- Empty: "No documents generated yet"
- Failed: "Document generation failed" with retry
