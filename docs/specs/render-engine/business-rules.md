# Business Rules — Render Engine

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-RE-001 | template | Must be published | "Template must be published" |
| VR-RE-002 | data | Required for bindings | "Missing required data" |
| VR-RE-003 | components | Must be published | "Component not found or unpublished" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-RE-001 | render | System | — |
| PR-RE-002 | generate PDF | System | — |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-RE-001 | Template | Rendered HTML | Render successful |
| ST-RE-002 | Rendered HTML | Generated PDF | PDF generation successful |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-RE-001 | Nested component depth ≤ 10 | HIGH |
| BC-RE-002 | Loop iteration count ≤ 1000 | HIGH |
| BC-RE-003 | PDF must match HTML | CRITICAL |
| BC-RE-004 | Errors collected, not thrown | HIGH |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-RE-001 | Render template | Generate HTML |
| SE-RE-002 | Generate PDF | Create PDF file |
| SE-RE-003 | Component not found | Add error to result |
