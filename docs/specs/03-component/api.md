# API — Component

## Endpoints

### GET /api/components

**Description:** List all Components

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| per_page | number | 20 | Items per page |
| search | string | — | Search by name |
| status | string | — | Filter by status |
| mode | string | — | Filter by single/collection |

**Response:**
```json
{
  "data": [
    {
      "id": "cmp_abc123",
      "name": "identitas_pegawai",
      "display_name": "Identitas Pegawai",
      "status": "published",
      "version": 2,
      "mode": "single",
      "requirement_count": 3,
      "created_at": "2026-08-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 10 }
}
```

### GET /api/components/:id

**Description:** Get single Component with requirements

**Response:**
```json
{
  "data": {
    "id": "cmp_abc123",
    "name": "identitas_pegawai",
    "display_name": "Identitas Pegawai",
    "description": "Block showing employee identity",
    "status": "published",
    "version": 2,
    "mode": "single",
    "content": { ... },
    "requirements": [
      { "id": "req_001", "name": "nama", "display_name": "Nama", "type": "text", "required": true },
      { "id": "req_002", "name": "nip", "display_name": "NIP", "type": "text", "required": true }
    ],
    "loop_config": null,
    "created_at": "2026-08-30T10:00:00Z"
  }
}
```

### POST /api/components

**Description:** Create a new Component

**Request Body:**
```json
{
  "name": "identitas_pegawai",
  "display_name": "Identitas Pegawai",
  "description": "Block showing employee identity",
  "mode": "single",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Nama: " },
          { "type": "dynamicToken", "attrs": { "name": "nama" } }
        ]
      }
    ]
  },
  "requirements": [
    { "name": "nama", "display_name": "Nama", "type": "text", "required": true }
  ]
}
```

**Response:**
```json
{
  "data": { "id": "cmp_abc123", ... }
}
```

### PUT /api/components/:id

**Description:** Update Component (creates new version if published)

**Request Body:** Same as POST

**Response:**
```json
{
  "data": { ... }
}
```

### DELETE /api/components/:id

**Description:** Delete Component

**Response:**
```json
{
  "data": { "deleted": true }
}
```

### POST /api/components/:id/publish

**Description:** Publish Component

**Response:**
```json
{
  "data": { "status": "published", "version": 2 }
}
```

### POST /api/components/:id/preview

**Description:** Preview Component with sample data

**Request Body:**
```json
{
  "sample_data": {
    "nama": "Afdal",
    "nip": "12345"
  }
}
```

**Response:**
```json
{
  "data": {
    "html": "<p>Nama: Afdal</p>"
  }
}
```

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | FORBIDDEN | No permission |
| 404 | NOT_FOUND | Component not found |
| 409 | CONFLICT | Name already exists |
| 422 | DEPENDENCY_ERROR | Component used by Templates |
| 500 | INTERNAL_ERROR | Server error |
