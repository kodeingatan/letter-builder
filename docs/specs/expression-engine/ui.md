# UI — Expression Engine

## Pages

No dedicated pages. Expression Engine is used internally by:

- **Template Builder** — Binding expressions, condition expressions
- **Component Builder** — Computed requirement expressions
- **Administration Builder** — Step condition expressions

## Expression Editor Component

**Used in:** Template data panel, Component properties, Administration step properties

```
┌──────────────────────────────────────┐
│ Expression                           │
│ ┌──────────────────────────────────┐ │
│ │ {{harga}} * {{jumlah}} > 1000000│ │
│ └──────────────────────────────────┘ │
│ Variables: harga, jumlah             │
│ Type: boolean                        │
└──────────────────────────────────────┘
```

## Variable Reference Picker

**Trigger:** Click "@" or "{{" in expression editor

```
┌─────────────────────────────────────┐
│ Insert Variable                     │
│ Search fields...                    │
├─────────────────────────────────────┤
│ ▣ pegawai.nama                      │
│ ▣ pegawai.nip                       │
│ ▣ pegawai.jabatan                   │
│ ▣ current_date                      │
│ ▣ user.name                         │
└─────────────────────────────────────┘
```

## Validation Indicator

- Green check: Valid expression
- Red X: Invalid expression with error message
- Yellow warning: Deprecated syntax

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| {{ | Open variable picker |
| @ | Open variable picker |
| Tab | Accept suggestion |
| Escape | Close picker |
