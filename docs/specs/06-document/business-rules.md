# Business Rules — Document

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-DC-001 | instance_id | Required | "Instance reference is required" |
| VR-DC-002 | template_id | Required | "Template reference is required" |
| VR-DC-003 | rendered_html | Required | "Rendered content is required" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-DC-001 | view | Staff | Assigned to workflow step |
| PR-DC-002 | download | Staff | Assigned to workflow step |
| PR-DC-003 | search | Staff | — |
| PR-DC-004 | settings | Administrator | — |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-DC-001 | Generating | Generated | PDF generated successfully |
| ST-DC-002 | Generating | Failed | PDF generation error |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-DC-001 | Document is immutable after generation | CRITICAL |
| BC-DC-002 | Document must link to source workflow | HIGH |
| BC-DC-003 | PDF must match HTML rendering | HIGH |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-DC-001 | Generate document | Create record, render HTML, generate PDF |
| SE-DC-002 | PDF generation failure | Mark document as Failed |
