# Domain — Administration

## Entities

### Administration (Workflow)

**Definition:** A configurable process that guides document creation through ordered steps with role assignments and conditions.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| name | string | yes | Unique machine name |
| display_name | string | yes | Human-readable name |
| description | string | no | Optional description |
| status | enum | yes | draft / published / archived |
| version | number | yes | Version number |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**Relationships:**
- Has many Step
- Has many Instance
- References Role (via steps)

**State Machine:**
```
Draft ──publish──▶ Published ──edit──▶ Published (new version)
  ▲                    │
  └─────unpublish──────┘
                        │
                        ▼
                    Archived
```

### Step

**Definition:** An ordered stage in a Workflow that uses a Template and requires role-based action.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| administration_id | string | yes | Parent Workflow |
| order | number | yes | Step order (1-based) |
| template_id | string | yes | Template to use |
| role_id | string | yes | Assigned role |
| condition | string | no | Condition expression (optional) |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**Relationships:**
- Belongs to Administration
- Belongs to Template
- Belongs to Role
- Has many InstanceStep

### Instance

**Definition:** A running execution of a Workflow, tracking progress through steps.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| administration_id | string | yes | Workflow |
| status | enum | yes | pending / in_progress / complete / rejected |
| current_step_id | string | yes | Currently active step |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**State Machine:**
```
Pending ──start──▶ InProgress ──submit──▶ InProgress ──submit──▶ Complete
  │                   │                    │
  │                   └──reject──▶ Rejected │
  │                                        │
  └─────start──────────────────────────────┘
```

### InstanceStep

**Definition:** Record of a specific step execution within an instance.

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| instance_id | string | yes | Parent Instance |
| step_id | string | yes | Step reference |
| status | enum | yes | pending / in_progress / complete / rejected |
| data | json | no | Submitted data |
| action | string | no | Approve / Reject |
| comment | string | no | Optional comment |
| created_by | string | yes | Actor user ID |
| created_at | datetime | yes | Action timestamp |

## Relationships

```
Administration ──1:N──▶ Step
Administration ──1:N──▶ Instance
Instance ──1:N──▶ InstanceStep
InstanceStep ──N:1──▶ Step
```

## Invariants

- Administration.name must be unique
- Step.order must be sequential (1, 2, 3...)
- All step Templates must be published before Workflow publish
- All step roles must be assigned before Workflow publish
- Instance cannot be deleted once started
- Only current step can be acted upon
- Actions only available to users with step's role
