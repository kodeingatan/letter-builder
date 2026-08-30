# Business Rules — Administration

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-WF-001 | name | Required | "Workflow name is required" |
| VR-WF-002 | name | Unique | "A workflow with this name already exists" |
| VR-WF-003 | steps | At least one step | "Workflow must have at least one step" |
| VR-WF-004 | step.order | Sequential | "Step orders must be sequential" |
| VR-WF-005 | step.template_id | Published template | "Template must be published" |
| VR-WF-006 | step.role_id | Valid role | "Role must be assigned" |
| VR-WF-007 | step.condition | Valid expression | "Invalid condition expression" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-WF-001 | create | Administrator | — |
| PR-WF-002 | read | Administrator | — |
| PR-WF-003 | update | Administrator | Draft or new version |
| PR-WF-004 | delete | Administrator | No running instances |
| PR-WF-005 | publish | Administrator | All steps valid |
| PR-WF-006 | execute | Staff | Assigned to step's role |
| PR-WF-007 | approve | Staff | Assigned to step's role |
| PR-WF-008 | reject | Staff | Assigned to step's role |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-WF-001 | Draft | Published | All steps valid |
| ST-WF-002 | Published | Published | Edit creates new version |
| ST-WF-003 | Published | Archived | No running instances |
| ST-WF-004 | Pending | InProgress | Execute workflow |
| ST-WF-005 | InProgress | InProgress | Approve step (progress) |
| ST-WF-006 | InProgress | Complete | Final step approved |
| ST-WF-007 | InProgress | Rejected | Any step rejected |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-WF-001 | Workflow name must be unique | CRITICAL |
| BC-WF-002 | All step templates must be published | HIGH |
| BC-WF-003 | All step roles must be assigned | HIGH |
| BC-WF-004 | Conditions must use valid expressions | HIGH |
| BC-WF-005 | Running instances cannot be deleted | HIGH |
| BC-WF-006 | Only current step can be acted upon | CRITICAL |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-WF-001 | Execute workflow | Create instance, assign first step |
| SE-WF-002 | Approve step | Create instance step record, advance to next step |
| SE-WF-003 | Reject step | Create instance step record, reject instance |
| SE-WF-004 | Complete final step | Generate Document from Template |
| SE-WF-005 | Publish workflow | Create version snapshot |
