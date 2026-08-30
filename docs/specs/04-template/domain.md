# Domain — Template

## Entities

### Template

**Definition:** A document blueprint that assembles static content, Components, dynamic data, conditions, and loops.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| name | string | yes | Unique machine name |
| display_name | string | yes | Human-readable name |
| description | string | no | Optional description |
| status | enum | yes | draft / published / archived |
| version | number | yes | Version number |
| content | json | yes | Tiptap document model |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**Relationships:**
- References many Component (via content blocks)
- Has many DataBinding
- Has many Condition
- Used by many Administration (via steps)
- Generates many Document

**State Machine:**
```
Draft ──publish──▶ Published ──edit──▶ Published (new version)
  ▲                    │
  └─────unpublish──────┘
                        │
                        ▼
                    Archived
```

### DataBinding

**Definition:** A connection between a Component's data requirement and a data source.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| template_id | string | yes | Parent Template |
| component_id | string | yes | Target Component |
| requirement_name | string | yes | Requirement to bind |
| source_type | enum | yes | administration / global-table / manual / expression / system |
| source_ref | string | yes | Source reference path |
| alias | string | no | Loop item alias |

**Source Types:**
| Type | Example Reference | Description |
|------|-------------------|-------------|
| administration | `step1.nomor_surat` | Data from workflow step |
| global-table | `pegawai.nama` | Field from a Global Table record |
| manual | (static value) | Hardcoded value |
| expression | `{{harga}} * {{jumlah}}` | Computed expression |
| system | `current_date`, `user.name` | System-provided values |

### ComponentBlock

**Definition:** A reference to a Component embedded in Template content.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| component_id | string | yes | Reference to published Component |
| mode | enum | yes | single / collection |
| loop_config | json | no | Loop configuration if collection |

### Condition

**Definition:** A conditional rendering rule wrapping a content block.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| template_id | string | yes | Parent Template |
| expression | string | yes | Condition expression |
| block_content | json | yes | Content to render if true |

## Relationships

```
Template ──1:N──▶ DataBinding
Template ──N:M──▶ Component (via content blocks)
Template ──1:N──▶ Condition
Template ──N:1──▶ Administration (via steps)
Template ──1:N──▶ Document
```

## Invariants

- Template.name must be unique
- All Component data requirements must have bindings before publish
- Loop data sources must reference published Global Tables
- Condition expressions must use valid field references
- Published Templates cannot have bindings removed (only added)

## Content Model (Tiptap)

```
Document
├── Paragraph
│   ├── Text
│   └── DynamicToken
├── Heading
├── Table
├── Image
├── DynamicImage
├── ComponentBlock
│   └── (references Component content)
├── Loop
│   └── ComponentBlock
└── Condition
    └── (conditional content)
```
