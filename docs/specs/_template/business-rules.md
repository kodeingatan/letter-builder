# Business Rules — [Feature Name]

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-001 | name | Required | "Name is required" |
| VR-002 | name | Unique | "Name already exists" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-001 | create | Administrator | — |
| PR-002 | read | Staff | — |
| PR-003 | update | Administrator | Owner only |
| PR-004 | delete | Administrator | No dependencies |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-001 | Draft | Published | All required fields valid |
| ST-002 | Published | Archived | No active documents |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-001 | [Constraint description] | CRITICAL |
| BC-002 | [Constraint description] | HIGH |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-001 | Publish template | Create version snapshot |
| SE-002 | Delete table | Show dependency warning |
