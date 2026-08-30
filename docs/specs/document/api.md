# API — Document

## Endpoints

### GET /api/documents

**Description:** List all Documents

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| per_page | number | 20 | Items per page |
| search | string | — | Search by name |
| template_id | string | — | Filter by template |
| administration_id | string | — | Filter by workflow |
| date_from | string | — | Filter start date |
| date_to | string | — | Filter end date |

**Response:**
```json
{
  "data": [
    {
      "id": "doc_abc123",
      "name": "Surat Keputusan - 2026-08-30",
      "template_id": "tpl_001",
      "template_name": "Surat Keputusan",
      "administration_id": "wf_001",
      "administration_name": "Proses SK",
      "status": "generated",
      "created_at": "2026-08-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 50 }
}
```

### GET /api/documents/:id

**Description:** Get single Document with full content

**Response:**
```json
{
  "data": {
    "id": "doc_abc123",
    "name": "Surat Keputusan - 2026-08-30",
    "rendered_html": "<div>...</div>",
    "pdf_path": "/documents/doc_abc123.pdf",
    "metadata": { ... },
    "template": { "id": "tpl_001", "name": "Surat Keputusan" },
    "administration": { "id": "wf_001", "name": "Proses SK" },
    "instance": { "id": "inst_001" }
  }
}
```

### GET /api/documents/:id/pdf

**Description:** Download Document PDF

**Response:** Binary PDF file

### GET /api/documents/settings

**Description:** Get document settings

### PUT /api/documents/settings

**Description:** Update document settings

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Document not found |
| 404 | PDF_NOT_GENERATED | PDF not yet available |
| 500 | GENERATION_FAILED | Document generation failed |
| 500 | INTERNAL_ERROR | Server error |
