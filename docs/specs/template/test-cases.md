# Test Cases — Template

## Unit Tests

### TemplateService

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-TE-001 | Create template | Valid object | Template created | REQ-TE-001 |
| UT-TE-002 | Reject duplicate name | Name "surat_keputusan" (exists) | Conflict error | BC-TE-001 |
| UT-TE-003 | Block publish if unbound | Template with unbound requirement | Validation error | BC-TE-002 |
| UT-TE-004 | Version increment | Published template, edit | New version | REQ-TE-008 |

### DataBindingResolver

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-DB-001 | Resolve global-table binding | Binding to pegawai.nama | Value from record | REQ-TE-004 |
| UT-DB-002 | Resolve manual binding | Static value | Static value returned | REQ-TE-004 |
| UT-DB-003 | Resolve expression binding | "harga * jumlah" | Computed result | REQ-TE-004 |
| UT-DB-004 | Resolve system binding | "current_date" | Current date string | REQ-TE-004 |

## Integration Tests

### Template Lifecycle

| ID | Test | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| IT-TE-001 | Full lifecycle | Create → Add components → Bind → Preview → Publish | All succeed | US-001 to US-007 |
| IT-TE-002 | Loop rendering | Add collection component → Configure loop → Preview | Items repeated | US-004 |

## API Tests

| ID | Method | Path | Input | Expected Status |
|----|--------|------|-------|-----------------|
| AT-TE-001 | GET | /api/templates | — | 200 |
| AT-TE-002 | POST | /api/templates | Valid body | 201 |
| AT-TE-003 | GET | /api/templates/:id | — | 200 |
| AT-TE-004 | PUT | /api/templates/:id | Valid body | 200 |
| AT-TE-005 | POST | /api/templates/:id/publish | All bound | 200 |
| AT-TE-006 | POST | /api/templates/:id/publish | Unbound | 422 |
| AT-TE-007 | POST | /api/templates/:id/preview | Sample data | 200 |

## E2E Tests

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| ET-TE-001 | Create template | Navigate → Create → Add content → Save | Template created |
| ET-TE-002 | Insert and bind component | Insert component → Bind requirements → Save | Bindings saved |
| ET-TE-003 | Preview template | Open template → Preview → Verify output | Correct preview |

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-TE-001 | Template with 10+ components | All manageable, no performance issues |
| EC-TE-002 | Nested loop blocks | Supported or blocked with clear message |
| EC-TE-003 | Condition with invalid expression | Validation error on save |
| EC-TE-004 | Component deleted while in template | Template shows "component unavailable" |
