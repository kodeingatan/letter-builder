# Domain — Document

## Entities

### Document

**Definition:** A generated output from a completed workflow, storing the rendered HTML, PDF reference, and source metadata.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| name | string | yes | Document name |
| instance_id | string | yes | Source workflow instance |
| administration_id | string | yes | Source workflow |
| template_id | string | yes | Source template |
| rendered_html | text | yes | Full rendered HTML |
| pdf_path | string | no | Path to generated PDF file |
| status | enum | yes | generating / generated / failed |
| metadata | json | no | Additional metadata |
| created_at | datetime | yes | Generation timestamp |

**Relationships:**
- Belongs to Instance
- Belongs to Administration
- Belongs to Template
- Has many DocumentVersion

**State Machine:**
```
Generating ──success──▶ Generated
    │
    └──failure──▶ Failed
```

### DocumentVersion

**Definition:** Version history for documents (if workflow re-runs produce new versions).

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| document_id | string | yes | Parent Document |
| version | number | yes | Version number |
| rendered_html | text | yes | Rendered HTML for this version |
| pdf_path | string | no | PDF for this version |
| created_at | datetime | yes | Version timestamp |

### DocumentSettings

**Definition:** Global configuration for document output.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| page_size | string | yes | A4, Letter, etc. |
| margin_top | number | yes | Top margin in mm |
| margin_right | number | yes | Right margin in mm |
| margin_bottom | number | yes | Bottom margin in mm |
| margin_left | number | yes | Left margin in mm |
| header_template | string | no | Header HTML template |
| footer_template | string | no | Footer HTML template |

## Relationships

```
Document ──N:1──▶ Instance
Document ──N:1──▶ Administration
Document ──N:1──▶ Template
Document ──1:N──▶ DocumentVersion
```

## Invariants

- Document is immutable after generation
- Document must link to its source workflow instance
- PDF must be generated from rendered HTML
- Document name is auto-generated from template + instance
