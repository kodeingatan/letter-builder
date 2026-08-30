# API — Template

## Endpoints

### GET /api/templates

**Description:** List all Templates

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| per_page | number | 20 | Items per page |
| search | string | — | Search by name |
| status | string | — | Filter by status |

**Response:**
```json
{
  "data": [
    {
      "id": "tpl_abc123",
      "name": "surat_keputusan",
      "display_name": "Surat Keputusan",
      "status": "published",
      "version": 3,
      "component_count": 5,
      "binding_count": 12,
      "created_at": "2026-08-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 8 }
}
```

### GET /api/templates/:id

**Description:** Get single Template with bindings and conditions

**Response:**
```json
{
  "data": {
    "id": "tpl_abc123",
    "name": "surat_keputusan",
    "content": { ... },
    "bindings": [
      {
        "id": "bind_001",
        "component_id": "cmp_001",
        "requirement_name": "nama",
        "source_type": "global-table",
        "source_ref": "pegawai.nama"
      }
    ],
    "conditions": [],
    "version": 3
  }
}
```

### POST /api/templates

**Description:** Create a new Template

**Request Body:**
```json
{
  "name": "surat_keputusan",
  "display_name": "Surat Keputusan",
  "content": { ... },
  "bindings": [],
  "conditions": []
}
```

### PUT /api/templates/:id

**Description:** Update Template (creates new version if published)

### DELETE /api/templates/:id

**Description:** Delete Template

### POST /api/templates/:id/publish

**Description:** Publish Template

**Validation:** All component requirements must be bound

### POST /api/templates/:id/preview

**Description:** Preview Template with sample data

**Request Body:**
```json
{
  "sample_data": {
    "pegawai": { "nama": "Afdal", "nip": "12345" }
  }
}
```

**Response:**
```json
{
  "data": {
    "html": "<div>...</div>"
  }
}
```

### POST /api/templates/:id/bindings

**Description:** Add/update data binding

**Request Body:**
```json
{
  "component_id": "cmp_001",
  "requirement_name": "nama",
  "source_type": "global-table",
  "source_ref": "pegawai.nama"
}
```

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 404 | NOT_FOUND | Template not found |
| 409 | CONFLICT | Name already exists |
| 422 | INCOMPLETE_BINDINGS | Not all requirements bound |
| 500 | INTERNAL_ERROR | Server error |
