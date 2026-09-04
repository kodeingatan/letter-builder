# CRUD Generated Table

Global Table secara otomatis menghasilkan behavior:

```text
Browse
   │
   ├── Search
   ├── Column visibility
   ├── Sorting
   └── Pagination

Create
   │
   └── Generate form dari Column Definition

Edit
   │
   └── Generate form dari Column Definition

Delete
```

Misalnya column:

```text
name = "tanggal_lahir"
type = "date"
format = "m-d-Y"
required = true
searchable = true
orderable = true
```

UI otomatis mengetahui:

```text
Input     → Date Picker
Display   → 08-30-2026
Required  → Yes
Search    → Enabled
Sort      → Enabled
```

## Related Concepts

- [[global-table]] — global table menghasilkan CRUD
- [[column-type]] — type menentukan UI component
