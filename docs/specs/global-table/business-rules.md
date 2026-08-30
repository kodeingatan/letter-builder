# Business Rules — Global Table

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-GT-001 | name | Required | "Table name is required" |
| VR-GT-002 | name | Unique | "A table with this name already exists" |
| VR-GT-003 | name | Pattern (snake_case) | "Name must use snake_case format" |
| VR-GT-004 | display_name | Required | "Display name is required" |
| VR-GT-005 | columns | Min 1 | "At least one column is required" |
| VR-GT-006 | column.name | Required | "Column name is required" |
| VR-GT-007 | column.name | Unique in table | "Column name already exists in this table" |
| VR-GT-008 | column.display_name | Required | "Column display name is required" |
| VR-GT-009 | column.type | Required | "Column type is required" |
| VR-GT-010 | column.type | Valid enum | "Invalid column type" |
| VR-GT-011 | column.options | Required if type=select | "Select options are required" |
| VR-GT-012 | column.expression | Required if type=computed | "Expression is required for computed columns" |
| VR-GT-013 | column.config.table_id | Required if type=relation | "Related table is required" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-GT-001 | create | Administrator | — |
| PR-GT-002 | read | Administrator, Staff | Published tables readable by Staff |
| PR-GT-003 | update | Administrator | Draft tables only |
| PR-GT-004 | delete | Administrator | No active references |
| PR-GT-005 | publish | Administrator | — |
| PR-GT-006 | create_record | Administrator | Published tables only |
| PR-GT-007 | update_record | Administrator | — |
| PR-GT-008 | delete_record | Administrator | — |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-GT-001 | Draft | Published | At least 1 column, all names valid |
| ST-GT-002 | Published | Draft | Unpublish allowed |
| ST-GT-003 | Published | Archived | No active workflow references |
| ST-GT-004 | Archived | Published | Structure valid |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-GT-001 | Table name must be unique across all tables | CRITICAL |
| BC-GT-002 | Column name must be unique within a table | CRITICAL |
| BC-GT-003 | At least one column required | CRITICAL |
| BC-GT-004 | Published tables with data cannot have columns deleted | HIGH |
| BC-GT-005 | Computed columns must have valid expressions | HIGH |
| BC-GT-006 | Relation columns must reference published tables | HIGH |
| BC-GT-007 | Required columns must have values in every record | MEDIUM |
| BC-GT-008 | Select options must have at least one option | MEDIUM |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-GT-001 | Publish table | Table becomes available for Components |
| SE-GT-002 | Archive table | Table removed from relation selectors |
| SE-GT-003 | Delete column with data | Data loss — blocked if data exists |
| SE-GT-004 | Change column type | Existing data may be incompatible |
| SE-GT-005 | Add required column | Existing records need default values |
