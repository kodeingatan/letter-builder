# Test Cases — Administration

## Unit Tests

### AdministrationService

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-WF-001 | Create workflow | Valid object | Workflow created | REQ-WF-001 |
| UT-WF-002 | Reject duplicate name | Name exists | Conflict error | BC-WF-001 |
| UT-WF-003 | Block publish invalid steps | Unpublished template | Validation error | BC-WF-002 |
| UT-WF-004 | Version increment | Published, edit | New version | REQ-WF-008 |

### WorkflowInstance

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-WI-001 | Create instance | Published workflow | Instance created | US-006 |
| UT-WI-002 | Approve step | Valid data | Step advances | US-006 |
| UT-WI-003 | Reject step | With reason | Instance rejected | US-006 |
| UT-WI-004 | Block action wrong role | Wrong user | Permission error | BC-WF-006 |

## Integration Tests

### Workflow Lifecycle

| ID | Test | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| IT-WF-001 | Full lifecycle | Create → Publish → Execute → Approve all → Complete | Document generated | US-001 to US-008 |
| IT-WF-002 | Reject lifecycle | Create → Publish → Execute → Reject | Instance rejected | US-006 |

## API Tests

| ID | Method | Path | Input | Expected Status |
|----|--------|------|-------|-----------------|
| AT-WF-001 | GET | /api/administrations | — | 200 |
| AT-WF-002 | POST | /api/administrations | Valid body | 201 |
| AT-WF-003 | GET | /api/administrations/:id | — | 200 |
| AT-WF-004 | PUT | /api/administrations/:id | Valid body | 200 |
| AT-WF-005 | POST | /api/administrations/:id/publish | All valid | 200 |
| AT-WF-006 | POST | /api/administrations/:id/publish | Invalid | 422 |
| AT-WF-007 | POST | /api/administrations/:id/execute | — | 200 |
| AT-WF-008 | POST | /api/instances/:id/approve | Valid data | 200 |
| AT-WF-009 | POST | /api/instances/:id/reject | Reason | 200 |

## E2E Tests

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| ET-WF-001 | Create workflow | Navigate → Create → Add steps → Publish | Workflow published |
| ET-WF-002 | Execute workflow | Execute → Fill data → Approve → Complete | Document generated |
| ET-WF-003 | Reject workflow | Execute → Reject | Instance rejected |

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-WF-001 | Workflow with 10+ steps | All manageable |
| EC-WF-002 | Condition always false | Step skipped or blocked |
| EC-WF-003 | All roles same role | Valid configuration |
| EC-WF-004 | Concurrent instances | All tracked independently |
