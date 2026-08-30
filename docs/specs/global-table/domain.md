# Domain — Global Table

## Entities

### GlobalTable

**Definition:** A metadata-driven data structure that defines how data is stored, input, displayed, validated, searched, and ordered.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier (nanoid) |
| name | string | yes | Unique machine name (snake_case) |
| display_name | string | yes | Human-readable name |
| description | string | no | Optional description |
| status | enum | yes | draft / published / archived |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**Relationships:**
- Has many Column (ordered)
- Has many Record
- Referenced by Component (via data requirements)
- Referenced by Administration (via workflow data sources)

**State Machine:**
```
Draft ──publish──▶ Published ──archive──▶ Archived
  ▲                    │
  └─────unpublish──────┘
```

### Column (Field)

**Definition:** A field definition within a Global Table that specifies data type, behavior, and UI rendering.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| table_id | string | yes | Parent Global Table |
| name | string | yes | Machine name (snake_case) |
| display_name | string | yes | Human-readable label |
| type | enum | yes | Column type |
| required | boolean | yes | Whether value is mandatory |
| searchable | boolean | yes | Whether column is searchable |
| orderable | boolean | yes | Whether column is sortable |
| default_value | string | no | Default value |
| format | string | no | Display format (date/number) |
| options | json | no | Select options array |
| config | json | no | Type-specific configuration |
| order | number | yes | Display order position |

**Column Types:**
| Type | Input Component | Storage | Config |
|------|----------------|---------|--------|
| text | Text input | String | maxlength |
| number | Number input | Number | min, max, precision |
| date | Date picker | ISO date | format |
| time | Time picker | ISO time | format |
| datetime | DateTime picker | ISO datetime | format |
| image | File upload | File reference | accept, maxSize |
| select | Dropdown | String | options[] |
| richtext | Rich text editor | JSON/HTML | — |
| relation | Relation selector | Foreign key | table_id, display_fields[] |
| computed | Readonly display | Calculated | expression |

**Computed Subtypes:**
| Mode | Behavior |
|------|----------|
| hidden | Value calculated and stored, not shown in input |
| readonly | Value calculated and displayed, not editable |

**Relationships:**
- Belongs to GlobalTable
- Referenced by DataRequirement (in Component)

**Lifecycle:**
- Created with table definition
- Can be reordered within table
- Can be modified (with caution if data exists)
- Cannot be deleted if data exists in the column

### Record

**Definition:** A single data entry in a Global Table, stored as a JSON document.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| table_id | string | yes | Parent Global Table |
| data | json | yes | Column values as key-value pairs |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**Data Structure:**
```json
{
  "nama": "Afdal",
  "nip": "12345",
  "jabatan": "programmer",
  "tanggal_lahir": "1990-05-15",
  "status": "active"
}
```

**Relationships:**
- Belongs to GlobalTable
- Referenced by Relation columns in other tables

## Relationships

```
GlobalTable ──1:N──▶ Column
GlobalTable ──1:N──▶ Record
Column ──N:1──▶ GlobalTable
Record ──N:1──▶ GlobalTable
Column ──N:M──▶ Column (relation via table_id)
```

## Invariants

- GlobalTable.name must be unique across all tables
- Column.name must be unique within its parent table
- A GlobalTable must have at least one Column
- Published tables with records cannot have Columns deleted
- Computed columns must have a valid expression
- Relation columns must reference a valid published GlobalTable
- Record data keys must match Column names of the parent table
- Required columns must have non-null values in all records

## Lifecycle

1. **Draft** — Table structure can be freely modified
2. **Published** — Table is available for Components and document generation; structural changes are restricted
3. **Archived** — Table is no longer available for new references; existing data preserved

## Invariants for Status Transitions

- Draft → Published: At least one column exists, all column names valid
- Published → Draft: No active Component references (or confirm disruption)
- Published → Archived: No active Workflow references
- Archived → Published: Table structure is valid
