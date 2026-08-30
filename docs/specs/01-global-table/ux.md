# UX — Global Table

## User Flow

### Create Collection

```
Click "+ Create Collection"
    │
    ▼
Drawer opens: Collection Form
    │
    ├── Fill name, display name
    │
    ▼
Click "Create"
    │
    ├── Success → Toast "Collection created"
    │             Navigate to /collections/:id
    │
    └── Error → Inline errors
```

### Add Column

```
Click "+ Add Column" (Columns tab)
    │
    ▼
Popover opens: Column Form
    │
    ├── Fill name, display name
    ├── Select type
    │       │
    │       └── Type-specific options appear (progressive disclosure)
    │
    ▼
Click "Add Column"
    │
    ├── Success → Column appears in list
    │
    └── Error → Inline errors
```

### Add Record

```
Click "+ Add Record"
    │
    ▼
Drawer opens: Record Form (generated from columns)
    │
    ├── Fill fields (per column type)
    │
    ▼
Click "Save"
    │
    ├── Success → Toast "Record added"
    │             Record appears in table
    │
    └── Error → Inline errors
```

### Edit Record

```
Double-click row OR Click edit icon
    │
    ▼
Drawer opens: Record Form (pre-filled)
    │
    ├── Modify fields
    │
    ▼
Click "Save"
    │
    ├── Success → Toast "Saved"
    │
    └── Error → Inline errors
```

### Delete Record

```
Click delete icon on row
    │
    ▼
Confirmation dialog
    │
    ├── Cancel → Close
    │
    └── Confirm → Delete → Toast "Record deleted"
```

### Publish Collection

```
Click "Publish" button
    │
    ▼
Status changes: Draft → Published
    │
    └── Toast "Collection published"
```

## Interactions

### Column Type Selection

**Trigger:** Click type radio/button
**Action:** Show type-specific configuration
**Feedback:** Smooth transition to reveal options

### Column Reorder

**Trigger:** Drag handle
**Action:** Drag to reorder
**Feedback:** Drop indicator, ghost preview

### Inline Edit (Records)

**Trigger:** Double-click text cell
**Action:** Convert to input
**Feedback:** Input appears in place, Enter saves, Esc cancels

### Row Selection

**Trigger:** Click checkbox
**Action:** Select row
**Feedback:** Row highlighted, bulk actions appear

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Create collection | Toast | "Collection created" |
| Add column | Toast | "Column added" |
| Update column | Toast | "Column saved" |
| Delete column | Dialog + Toast | Confirmation → "Column deleted" |
| Add record | Toast | "Record added" |
| Update record | Toast | "Saved" |
| Delete record | Dialog + Toast | Confirmation → "Record deleted" |
| Publish | Toast | "Collection published" |
| Validation error | Inline | Highlight invalid fields |

## Empty States

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
**Description:** "Try a different search term or clear filters."

## Loading States

- Initial load: Skeleton table rows
- Submitting: Button spinner, form disabled
- Background save: Subtle "Saving..." indicator

## Error Handling

| Error Type | Display | Action |
|-----------|---------|--------|
| Network error | Toast | Retry button |
| Validation error | Inline errors | Fix and resubmit |
| Permission error | Page message | Contact admin |
| Not found | Page | Go back to list |
| Conflict (name exists) | Inline error | Change name |

## Confirmation

### Delete Record

**Trigger:** Delete button
**Dialog:** "Delete this record?"
**Warning:** "This action cannot be undone."
**Actions:** Cancel / Delete

### Delete Column

**Trigger:** Delete button on column
**Dialog:** "Delete column '[name]'?"
**Warning:** "All data in this column will be lost."
**Condition:** Only if no data exists
**Actions:** Cancel / Delete

### Publish Collection

**Trigger:** Publish button
**Dialog:** "Publish '[name]'?"
**Info:** "Published collections can be used by Components and Workflows."
**Actions:** Cancel / Publish

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+K | Command palette |
| Cmd+S | Save current form |
| Escape | Close drawer/panel |
| Delete | Delete selected record |
| ↑↓ | Navigate table rows |
| Enter | Open selected row |
| Space | Toggle row selection |
