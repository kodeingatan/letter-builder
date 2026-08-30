# UI — Global Table

## Pages

### Collections List

**Route:** `/collections`

**Layout:** Workspace (sidebar + canvas)

**Components:**
- AppSidebar (resource list)
- CollectionList (table grid)
- EmptyState

**States:**
- Loading: Skeleton rows in table
- Empty: "No collections yet — Create your first data collection"
- Error: Toast with retry
- Success: Table populated with collections

### Collection Workspace

**Route:** `/collections/:id`

**Layout:** Workspace with tabs

**Tabs:**
- Records (default)
- Columns
- Settings

**Components:**
- Breadcrumb: Collections / [Collection Name]
- TabNavigation
- RecordsTab / ColumnsTab / SettingsTab

### Collection Create

**Route:** `/collections/create`

**Layout:** Workspace with modal/drawer

**Components:**
- CollectionForm (name, display_name, description)
- ColumnBuilder (add initial columns)

## Information Hierarchy

```
1. Breadcrumb: Collections
2. Page Title: [Collection Name]
3. Status Badge: Draft / Published / Archived
4. Primary Action: + Add Record (Records tab) / + Add Column (Columns tab)
5. Tab Navigation: Records | Columns | Settings
6. Content Area
```

## Tables

### Records Table

| Column | Type | Sortable | Searchable | Width |
|--------|------|----------|------------|-------|
| (dynamic) | (per column type) | per column config | per column config | auto |
| Actions | icons | no | no | fixed |

**Features:**
- Column visibility toggle
- Row selection (for bulk ops)
- Inline edit on double-click (text columns)
- Pagination controls
- Search bar (searches across searchable columns)

### Columns Table

| Column | Type | Sortable | Searchable |
|--------|------|----------|------------|
| Drag Handle | icon | no | no |
| Name | monospace | yes | yes |
| Display Name | text | yes | yes |
| Type | badge | yes | no |
| Required | check icon | no | no |
| Searchable | check icon | no | no |
| Orderable | check icon | no | no |
| Actions | icons | no | no |

## Forms

### Create Collection

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | yes | Unique, snake_case, max 255 |
| display_name | text | yes | Max 255 |
| description | textarea | no | Max 1000 |

### Add Column

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | yes | Unique in table, snake_case |
| display_name | text | yes | Max 255 |
| type | select | yes | One of: text, number, date, etc. |
| required | switch | no | Default false |
| searchable | switch | no | Default false |
| orderable | switch | no | Default false |
| default_value | (varies by type) | no | Type-specific |

**Progressive Disclosure:** After selecting type, show type-specific options:
- date → format picker
- number → min/max/precision
- select → options editor
- relation → table selector + display fields
- computed → expression editor

## Column Builder

**Layout:** Visual card-based builder

```
┌─────────────────────────────────────────────┐
│ ☰ Nama                                     │
│   Text · Required · Searchable              │
├─────────────────────────────────────────────┤
│ ☰ NIP                                      │
│   Text · Required · Searchable              │
├─────────────────────────────────────────────┤
│ ☰ Jabatan                                   │
│   Relation → Jabatan                        │
├─────────────────────────────────────────────┤
│            + Add Column                     │
└─────────────────────────────────────────────┘
```

- Drag handle for reorder
- Click to edit (opens property panel)
- Hover shows edit/delete actions

## Navigation

- Sidebar: Collections list with record counts
- Breadcrumb: Collections / [Name] / [Tab]
- Keyboard: ↑↓ navigate rows, Enter open, Esc close panel

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (lg+) | Sidebar + Full table + Property panel |
| Tablet (md-lg) | Collapsible sidebar + Table + Drawer panel |
| Mobile (< md) | List view + Full-screen detail |

## Loading State

- Table: Skeleton rows matching column count
- Form: Skeleton input fields
- Detail: Skeleton content blocks

## Empty State

### No Collections Yet

**Message:** "No collections yet"
**Description:** "Create your first data collection to start managing dynamic data structures."
**Action:** "[+ Create Collection]"

### No Records

**Message:** "No records"
**Description:** "Add your first record to start populating this collection."
**Action:** "[+ Add Record]"

### Search No Results

**Message:** "No records found"
**Description:** "Try a different search term."

## Error State

- API Error: Toast with error message and retry button
- Validation Error: Inline field errors
- Permission Error: Page-level message

## Accessibility

- Keyboard: Tab through table rows, Enter to edit, Delete to remove
- Screen reader: Announce row count, column headers
- Focus: Visible focus ring on interactive elements
- ARIA: aria-label on action buttons, aria-sort on sortable columns
