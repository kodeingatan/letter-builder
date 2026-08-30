# Test Cases — Document

## Unit Tests

### DocumentService

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-DC-001 | Generate document | Completed instance | Document created | REQ-DC-001 |
| UT-DC-002 | Store rendered HTML | Valid template + data | HTML saved | REQ-DC-002 |
| UT-DC-003 | Generate PDF | Valid HTML | PDF created | REQ-DC-003 |

## Integration Tests

### Document Lifecycle

| ID | Test | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| IT-DC-001 | Full lifecycle | Complete workflow → Generate → View → Download | All succeed | US-001 to US-004 |

## API Tests

| ID | Method | Path | Input | Expected Status |
|----|--------|------|-------|-----------------|
| AT-DC-001 | GET | /api/documents | — | 200 |
| AT-DC-002 | GET | /api/documents/:id | — | 200 |
| AT-DC-003 | GET | /api/documents/:id/pdf | — | 200 |
| AT-DC-004 | GET | /api/documents/settings | — | 200 |
| AT-DC-005 | PUT | /api/documents/settings | Valid body | 200 |

## E2E Tests

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| ET-DC-001 | View document | Navigate → Click document → View | Document displayed |
| ET-DC-002 | Download PDF | Click download → Verify file | PDF downloaded |

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-DC-001 | Complex template layout | Rendered correctly |
| EC-DC-002 | 100+ page document | Generated without error |
| EC-DC-003 | PDF generation failure | Document marked as Failed |
