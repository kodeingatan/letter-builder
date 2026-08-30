# Domain — Component

## Entities

### Component

**Definition:** A reusable document block that defines content structure and data requirements without containing actual data.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier (nanoid) |
| name | string | yes | Unique machine name |
| display_name | string | yes | Human-readable name |
| description | string | no | Optional description |
| status | enum | yes | draft / published / archived |
| version | number | yes | Version number (starts at 1) |
| content | json | yes | Tiptap document model |
| mode | enum | yes | single / collection |
| loop_config | json | no | Loop configuration (required if mode=collection) |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**Relationships:**
- Has many DataRequirement
- Used by many Template (via template-component references)
- Content contains DynamicToken references

**State Machine:**
```
Draft ──publish──▶ Published ──edit──▶ Published (new version)
  ▲                    │
  └─────unpublish──────┘
                        │
                        ▼
                    Archived
```

### DataRequirement

**Definition:** A contract specifying what data a Component needs.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| component_id | string | yes | Parent Component |
| name | string | yes | Matches token name in content |
| display_name | string | yes | Human-readable label |
| type | enum | yes | text, number, date, image, etc. |
| required | boolean | yes | Whether data is mandatory |

**Relationships:**
- Belongs to Component
- Bound to a data source in Template context

### DynamicToken

**Definition:** A {{variable}} placeholder in Component content.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | yes | Matches a DataRequirement name |
| type | enum | yes | text, image, etc. |

### LoopConfig

**Definition:** Configuration for Collection-mode Components.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| source_table_id | string | yes | Global Table to loop over |
| item_alias | string | yes | Variable name for each item (e.g., "employee") |
| filter | json | no | Optional filter expression |

## Relationships

```
Component ──1:N──▶ DataRequirement
Component ──N:M──▶ Template (via template-component references)
Template ──1:N──▶ DataBinding (connects requirements to sources)
```

## Invariants

- Component.name must be unique
- Each DynamicToken in content must have a matching DataRequirement
- Collection-mode Components must have LoopConfig
- Published Components cannot have DataRequirements removed
- DataRequirement names must be valid identifiers (snake_case)

## Lifecycle

1. **Draft** — Content and requirements freely editable
2. **Published** — Available for Templates; edits create new versions
3. **Archived** — No longer available for new Template references

## Content Model (Tiptap)

```
Document
├── Paragraph
│   ├── Text
│   └── DynamicToken (inline)
├── Heading
├── Table
├── Image
├── DynamicImage
├── Component (nested)
├── Loop
│   └── Component
└── Condition
    └── Component
```
