# Domain — [Feature Name]

## Entities

### [Entity Name]

**Definition:** [What is this entity]

**Attributes:**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | yes | Unique identifier |
| name | string | yes | [Description] |
| status | enum | yes | draft/published/archived |
| created_at | datetime | yes | Creation timestamp |
| updated_at | datetime | yes | Last update timestamp |

**Relationships:**
- Has many [Related Entity]
- Belongs to [Parent Entity]

**State Machine:**
```
Draft → Published → Archived
```

## Relationships

```
[Entity A] ──1:N──▶ [Entity B]
[Entity C] ──N:1──▶ [Entity A]
```

## Invariants

- [Invariant 1: e.g., "Name must be unique"]
- [Invariant 2: e.g., "At least one column required"]

## Lifecycle

1. [State 1]
2. [State 2]
3. [State 3]
