# API — Administration

## Endpoints

### GET /api/administrations

**Description:** List all Workflows

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
      "id": "wf_abc123",
      "name": "surat_keputusan",
      "display_name": "Surat Keputusan",
      "status": "published",
      "version": 2,
      "step_count": 3,
      "instance_count": 15,
      "created_at": "2026-08-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 5 }
}
```

### GET /api/administrations/:id

**Description:** Get single Workflow with steps

**Response:**
```json
{
  "data": {
    "id": "wf_abc123",
    "name": "surat_keputusan",
    "status": "published",
    "steps": [
      {
        "id": "step_001",
        "order": 1,
        "template_id": "tpl_001",
        "template_name": "draft_surat",
        "role_id": "role_001",
        "role_name": "Staff",
        "condition": null
      }
    ]
  }
}
```

### POST /api/administrations

**Description:** Create a new Workflow

### PUT /api/administrations/:id

**Description:** Update Workflow (creates new version if published)

### DELETE /api/administrations/:id

**Description:** Delete Workflow (only if no running instances)

### POST /api/administrations/:id/publish

**Description:** Publish Workflow

**Validation:** All steps valid (templates published, roles assigned)

### POST /api/administrations/:id/steps

**Description:** Add step to Workflow

### PUT /api/administrations/:id/steps/:stepId

**Description:** Update step configuration

### DELETE /api/administrations/:id/steps/:stepId

**Description:** Remove step from Workflow

### POST /api/administrations/:id/execute

**Description:** Create a workflow instance

**Response:**
```json
{
  "data": {
    "id": "inst_001",
    "administration_id": "wf_abc123",
    "status": "in_progress",
    "current_step_id": "step_001",
    "created_at": "2026-08-30T10:00:00Z"
  }
}
```

### POST /api/instances/:instanceId/approve

**Description:** Approve current step

**Request Body:**
```json
{
  "data": {
    "nama": "Afdal",
    "nip": "12345"
  },
  "comment": "Draft approved"
}
```

### POST /api/instances/:instanceId/reject

**Description:** Reject current step

**Request Body:**
```json
{
  "reason": "Incorrect data",
  "comment": "Please review"
}
```

### GET /api/instances/:instanceId

**Description:** Get instance details with step history

### GET /api/instances

**Description:** List instances (filtered by user's role)

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 404 | NOT_FOUND | Workflow not found |
| 409 | CONFLICT | Name already exists |
| 422 | INCOMPLETE_STEPS | Not all steps valid |
| 422 | CANNOT_DELETE | Running instances exist |
| 500 | INTERNAL_ERROR | Server error |
