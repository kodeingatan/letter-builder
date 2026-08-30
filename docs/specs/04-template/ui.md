# UI — Template

## Pages

### Templates List

**Route:** `/templates`

**Layout:** Workspace (sidebar + canvas)

**Components:**
- TemplateList (card grid)
- EmptyState

### Template Builder

**Route:** `/templates/:id`

**Layout:** Three-panel builder

```
┌──────────────┬──────────────────────────────────┬──────────────┐
│ BLOCKS       │          DOCUMENT               │ DATA         │
│              │                                  │              │
│ Components   │ ┌────────────────────────────┐   │ Bindings     │
│ Text         │ │        KOP SURAT           │   │              │
│ Image        │ ├────────────────────────────┤   │ Template     │
│ Table        │ │                            │   │ Data         │
│ Variable     │ │ {{component}}              │   │              │
│ Loop         │ │                            │   │              │
│ Condition    │ │ [Component: Daftar Pegawai]│   │              │
│              │ │                            │   │              │
│              │ └────────────────────────────┘   │              │
└──────────────┴──────────────────────────────────┴──────────────┘
```

### Template Create

**Route:** `/templates/create`

## Three-Panel Layout

### Left Panel — Blocks

- Static text
- Dynamic text (variable)
- Image / Dynamic image
- Table
- Component (opens picker)
- Loop block
- Condition block
- Page break

### Center Panel — Document Canvas

- Tiptap editor
- Component blocks rendered as named containers
- Loop blocks show repeat indicator
- Condition blocks show condition badge
- Click block → show in properties panel

### Right Panel — Data Panel

**When nothing selected:**
- Template name
- Display name
- Description

**When Component block selected:**
- Component info (name, requirements)
- Bindings for each requirement:
  ```
  nama  → [ Pegawai → nama ▼ ]
  nip   → [ Pegawai → nip ▼ ]
  ```

**When Loop block selected:**
- Source table selector
- Item alias
- Filter expression

**When Condition block selected:**
- Expression editor
- Field reference picker

## Component Picker

**Trigger:** Click "+ Component" in insert panel

**UI:** Command palette style

```
┌─────────────────────────────────────┐
│ Insert Component                    │
│ Search components...                │
├─────────────────────────────────────┤
│ ▣ Kop Surat                        │
│ ▣ Identitas Pegawai                │
│ ▣ Daftar Pegawai    (collection)   │
│ ▣ Tanda Tangan                      │
│ ▣ Footer                            │
└─────────────────────────────────────┘
```

## Data Binding UI

When a Component is inserted, the right panel shows:

```
Connect Data — Identitas Pegawai

nama
Source: [ Global Table ▼ ]
Table:  [ Pegawai ▼ ]
Field:  [ nama ▼ ]

nip
Source: [ Global Table ▼ ]
Table:  [ Pegawai ▼ ]
Field:  [ nip ▼ ]

jabatan
Source: [ Manual Input ▼ ]
Value:  [ .................. ]
```

## Preview Panel

**Trigger:** Click "Preview" button

**Layout:** Split screen or drawer

```
┌─────────────────────┬─────────────────────┐
│ Editor              │ Live Preview        │
│                     │                     │
│ {{nama}}            │ Nama: Afdal         │
│ [Component]         │ ┌────────────────┐  │
│                     │ │ rendered block │  │
│                     │ └────────────────┘  │
└─────────────────────┴─────────────────────┘
```

## Navigation

- Breadcrumb: Templates / [Name]
- Keyboard: Cmd+S save, Cmd+P preview

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop | Three-panel builder |
| Tablet | Two-panel (canvas + drawer) |
| Mobile | Full-screen canvas, bottom panels |

## Loading / Empty / Error States

- Loading: Skeleton canvas
- Empty canvas: "Start composing your document"
- Error: Toast with details

## Accessibility

- Keyboard: Tab through panels, Enter to select
- Screen reader: Announce block types, binding status
- Focus: Visible focus on all interactive elements
