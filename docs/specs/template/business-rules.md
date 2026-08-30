# Business Rules — Template

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-TE-001 | name | Required | "Template name is required" |
| VR-TE-002 | name | Unique | "A template with this name already exists" |
| VR-TE-003 | content | Required | "Template content cannot be empty" |
| VR-TE-004 | bindings | All requirements bound before publish | "All component requirements must be bound" |
| VR-TE-005 | loop.source_table_id | Required if loop exists | "Loop source table is required" |
| VR-TE-006 | condition.expression | Valid expression | "Invalid condition expression" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-TE-001 | create | Administrator | — |
| PR-TE-002 | read | Administrator | — |
| PR-TE-003 | update | Administrator | Draft or new version |
| PR-TE-004 | delete | Administrator | No active Workflow references |
| PR-TE-005 | publish | Administrator | All requirements bound |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-TE-001 | Draft | Published | Content valid, all bindings complete |
| ST-TE-002 | Published | Published | Edit creates new version |
| ST-TE-003 | Published | Archived | No active Workflow references |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-TE-001 | Template name must be unique | CRITICAL |
| BC-TE-002 | All component data requirements must be bound | HIGH |
| BC-TE-003 | Loop data sources must reference valid published tables | HIGH |
| BC-TE-004 | Condition expressions must use valid field references | HIGH |
| BC-TE-005 | Published templates create new versions on edit | HIGH |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-TE-001 | Publish template | Create version snapshot |
| SE-TE-002 | Edit published template | Create new version |
| SE-TE-003 | Add component binding | Requirement becomes resolvable |
| SE-TE-004 | Remove binding on published | Blocked if used by documents |
