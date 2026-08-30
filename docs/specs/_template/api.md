# API — [Feature Name]

## Endpoints

### GET /api/[resource]

**Description:** List resources

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| per_page | number | 20 | Items per page |
| sort | string | created_at | Sort field |
| order | string | desc | Sort direction |
| search | string | — | Search query |

**Response:**
```json
{
  "data": [...],
  "meta": { "page": 1, "per_page": 20, "total": 100 }
}
```

### GET /api/[resource]/:id

**Description:** Get single resource

**Response:**
```json
{
  "data": { ... }
}
```

### POST /api/[resource]

**Description:** Create resource

**Request Body:**
```json
{
  "name": "string",
  ...
}
```

**Validation:** [Zod schema reference]

**Response:**
```json
{
  "data": { ... }
}
```

### PUT /api/[resource]/:id

**Description:** Update resource

**Request Body:**
```json
{
  "name": "string",
  ...
}
```

**Response:**
```json
{
  "data": { ... }
}
```

### DELETE /api/[resource]/:id

**Description:** Delete resource

**Response:**
```json
{
  "data": { "deleted": true }
}
```

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | FORBIDDEN | No permission |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Name already exists |
| 500 | INTERNAL_ERROR | Server error |
