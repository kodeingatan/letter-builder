# Business Rules — Component

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-CO-001 | name | Required | "Component name is required" |
| VR-CO-002 | name | Unique | "A component with this name already exists" |
| VR-CO-003 | name | Pattern (snake_case) | "Name must use snake_case format" |
| VR-CO-004 | display_name | Required | "Display name is required" |
| VR-CO-005 | content | Required | "Content cannot be empty" |
| VR-CO-006 | mode | Required | "Rendering mode is required" |
| VR-CO-007 | loop_config | Required if mode=collection | "Loop configuration is required for collection mode" |
| VR-CO-008 | requirements | At least 1 if tokens exist | "Data requirements required for dynamic tokens" |
| VR-CO-009 | requirement.name | Unique in component | "Requirement name already exists" |
| VR-CO-010 | requirement.name | Match token | "Requirement name must match a token in content" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-CO-001 | create | Administrator | — |
| PR-CO-002 | read | Administrator | — |
| PR-CO-003 | update | Administrator | Draft or new version |
| PR-CO-004 | delete | Administrator | No active Template references |
| PR-CO-005 | publish | Administrator | — |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-CO-001 | Draft | Published | Content valid, requirements valid |
| ST-CO-002 | Published | Published | Edit creates new version (v1 → v2) |
| ST-CO-003 | Published | Archived | No active Workflow references |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-CO-001 | Component name must be unique | CRITICAL |
| BC-CO-002 | Components cannot contain raw data | CRITICAL |
| BC-CO-003 | Data requirement names must match dynamic tokens | HIGH |
| BC-CO-004 | Published components create new versions on edit | HIGH |
| BC-CO-005 | Collection-mode components must have loop configuration | MEDIUM |
| BC-CO-006 | Published components cannot have requirements removed | HIGH |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-CO-001 | Publish component | Create version snapshot |
| SE-CO-002 | Edit published component | Create new version (v+1) |
| SE-CO-003 | Add requirement | Available for binding in Templates |
| SE-CO-004 | Remove requirement | Breaks Templates using that requirement (blocked) |
