# API — Global Table

## Endpoints

### GET /api/collections

**Description:** List all Global Tables

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| per_page | number | 20 | Items per page |
| sort | string | created_at | Sort field |
| order | string | desc | Sort direction |
| search | string | — | Search by name/display_name |
| status | string | — | Filter by status |

**Response:**
```json
{
  "data": [
    {
      "id": "tbl_abc123",
      "name": "pegawai",
      "display_name": "Pegawai",
      "status": "published",
      "column_count": 7,
      "record_count": 150,
      "created_at": "2026-08-30T10:00:00Z",
      "updated_at": "2026-08-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 5 }
}
```

### GET /api/collections/:id

**Description:** Get single Global Table with columns

**Response:**
```json
{
  "data": {
    "id": "tbl_abc123",
    "name": "pegawai",
    "display_name": "Pegawai",
    "description": "Data pegawai instansi",
    "status": "published",
    "columns": [
      {
        "id": "col_001",
        "name": "nama",
        "display_name": "Nama",
        "type": "text",
        "required": true,
        "searchable": true,
        "orderable": true,
        "order": 1
      }
    ],
    "created_at": "2026-08-30T10:00:00Z",
    "updated_at": "2026-08-30T10:00:00Z"
  }
}
```

### POST /api/collections

**Description:** Create a new Global Table

**Request Body:**
```json
{
  "name": "pegawai",
  "display_name": "Pegawai",
  "description": "Data pegawai instansi",
  "columns": [
    {
      "name": "nama",
      "display_name": "Nama",
      "type": "text",
      "required": true,
      "searchable": true,
      "orderable": true
    }
  ]
}
```

**Validation:** Zod schema — `createGlobalTableSchema`

**Response:**
```json
{
  "data": { "id": "tbl_abc123", "name": "pegawai", ... }
}
```

### PUT /api/collections/:id

**Description:** Update Global Table structure

**Request Body:**
```json
{
  "display_name": "Data Pegawai",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "data": { ... }
}
```

### DELETE /api/collections/:id

**Description:** Delete Global Table

**Response:**
```json
{
  "data": { "deleted": true }
}
```

### POST /api/collections/:id/publish

**Description:** Publish a Global Table

**Response:**
```json
{
  "data": { "status": "published" }
}
```

### POST /api/collections/:id/unpublish

**Description:** Unpublish a Global Table (back to Draft)

**Response:**
```json
{
  "data": { "status": "draft" }
}
```

### POST /api/collections/:id/archive

**Description:** Archive a Global Table

**Response:**
```json
{
  "data": { "status": "archived" }
}
```

---

## Column Endpoints

### POST /api/collections/:id/columns

**Description:** Add a column to a Global Table

**Request Body:**
```json
{
  "name": "jabatan",
  "display_name": "Jabatan",
  "type": "relation",
  "required": false,
  "searchable": true,
  "orderable": true,
  "config": {
    "table_id": "tbl_jabatan",
    "display_fields": ["nama"]
  }
}
```

### PUT /api/collections/:id/columns/:columnId

**Description:** Update a column

### DELETE /api/collections/:id/columns/:columnId

**Description:** Delete a column (blocked if data exists)

### PUT /api/collections/:id/columns/reorder

**Description:** Reorder columns

**Request Body:**
```json
{
  "column_ids": ["col_003", "col_001", "col_002"]
}
```

---

## Record Endpoints

### GET /api/collections/:id/records

**Description:** List records with search, sort, pagination

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| per_page | number | 20 | Items per page |
| sort | string | created_at | Sort field (column name) |
| order | string | desc | Sort direction |
| search | string | — | Search across searchable columns |
| filter | object | — | Column-specific filters |

**Response:**
```json
{
  "data": [
    {
      "id": "rec_001",
      "data": {
        "nama": "Afdal",
        "nip": "12345",
        "jabatan": "Programmer"
      },
      "created_at": "2026-08-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 150 }
}
```

### POST /api/collections/:id/records

**Description:** Create a record

**Request Body:**
```json
{
  "data": {
    "nama": "Afdal",
    "nip": "12345",
    "jabatan": "tbl_jabatan:rec_002"
  }
}
```

### PUT /api/collections/:id/records/:recordId

**Description:** Update a record

### DELETE /api/collections/:id/records/:recordId

**Description:** Delete a record

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | FORBIDDEN | No permission |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Name already exists |
| 422 | DEPENDENCY_ERROR | Table has active references |
| 500 | INTERNAL_ERROR | Server error |
