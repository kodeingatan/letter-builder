# Test Cases — Component

## Unit Tests

### ComponentService

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-CO-001 | Create component with valid data | Valid component object | Component created | REQ-CO-001 |
| UT-CO-002 | Reject duplicate name | Name "identitas_pegawai" (exists) | Conflict error | BC-CO-001 |
| UT-CO-003 | Publish draft component | Draft component | Status=published, version=1 | REQ-CO-008 |
| UT-CO-004 | Version increment on edit | Published component, edit | New version created | REQ-CO-006 |
| UT-CO-005 | Block requirement removal if used | Requirement with binding | Blocked error | BC-CO-006 |

### DataRequirementValidator

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-DR-001 | Valid requirement | name, type, required | Valid | REQ-CO-004 |
| UT-DR-002 | Duplicate requirement name | Same name twice | Validation error | VR-CO-009 |
| UT-DR-003 | Collection mode needs loop_config | mode=collection, no config | Validation error | BC-CO-005 |

## Integration Tests

### Component Lifecycle

| ID | Test | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| IT-CO-001 | Full lifecycle | Create → Add tokens → Add requirements → Preview → Publish | All succeed | US-001 to US-005 |
| IT-CO-002 | Version chain | Publish v1 → Edit → Publish v2 → Edit → Publish v3 | 3 versions exist | REQ-CO-006 |

## API Tests

| ID | Method | Path | Input | Expected Status |
|----|--------|------|-------|-----------------|
| AT-CO-001 | GET | /api/components | — | 200 |
| AT-CO-002 | POST | /api/components | Valid body | 201 |
| AT-CO-003 | POST | /api/components | Duplicate name | 409 |
| AT-CO-004 | GET | /api/components/:id | — | 200 |
| AT-CO-005 | PUT | /api/components/:id | Valid body | 200 |
| AT-CO-006 | DELETE | /api/components/:id | — | 200 |
| AT-CO-007 | POST | /api/components/:id/publish | — | 200 |
| AT-CO-008 | POST | /api/components/:id/preview | Sample data | 200 |

## E2E Tests

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| ET-CO-001 | Create component | Navigate → Create → Add content → Save | Component created |
| ET-CO-002 | Add tokens | Insert dynamic text → Enter name | Token chip appears |
| ET-CO-003 | Publish | Open component → Publish | Status=published |

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-CO-001 | Component with no tokens | Valid (static content) |
| EC-CO-002 | 20+ requirements | UI scrolls, all manageable |
| EC-CO-003 | Component used by 10+ templates | Delete shows all dependencies |
| EC-CO-004 | Token name with special chars | Rejected (snake_case only) |
