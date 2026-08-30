# API — Render Engine

## Endpoints

### POST /api/render/preview

**Description:** Preview template rendering with sample data

**Request Body:**
```json
{
  "template_id": "tpl_001",
  "data": {
    "pegawai": { "nama": "Afdal", "nip": "12345" },
    "harga": 50000,
    "jumlah": 10
  }
}
```

**Response:**
```json
{
  "data": {
    "html": "<div>...</div>",
    "errors": [],
    "warnings": []
  }
}
```

### POST /api/render/generate

**Description:** Generate document (HTML + PDF) from completed workflow

**Request Body:**
```json
{
  "instance_id": "inst_001",
  "template_id": "tpl_001",
  "data": { ... }
}
```

**Response:**
```json
{
  "data": {
    "document_id": "doc_001",
    "html": "<div>...</div>",
    "pdf_path": "/documents/doc_001.pdf"
  }
}
```

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | RENDER_ERROR | Rendering failed |
| 404 | TEMPLATE_NOT_FOUND | Template not found |
| 422 | INCOMPLETE_DATA | Missing required data |
| 500 | PDF_GENERATION_FAILED | PDF generation failed |
