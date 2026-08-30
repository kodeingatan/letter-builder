# Test Cases — Render Engine

## Unit Tests

### TemplateRenderer

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-RE-001 | Render static content | Plain text | Same text | REQ-RE-001 |
| UT-RE-002 | Resolve tokens | "Hello {{name}}" | "Hello World" | REQ-RE-002 |
| UT-RE-003 | Render component | Component block | Component HTML | REQ-RE-003 |
| UT-RE-004 | Expand loop | Loop block + data | Repeated HTML | REQ-RE-004 |
| UT-RE-005 | Evaluate condition true | Condition true | Content shown | REQ-RE-005 |
| UT-RE-006 | Evaluate condition false | Condition false | Content hidden | REQ-RE-005 |
| UT-RE-007 | Missing component | Deleted component | Error placeholder | BC-RE-004 |
| UT-RE-008 | Nested components | Component in component | Both rendered | REQ-RE-008 |

### PDFGenerator

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-PG-001 | Generate PDF | Valid HTML | PDF file | REQ-RE-006 |
| UT-PG-002 | Apply page size | A4 setting | A4 PDF | REQ-RE-007 |
| UT-PG-003 | Apply margins | Margin settings | Correct margins | REQ-RE-007 |

## Integration Tests

| ID | Test | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| IT-RE-001 | Full render pipeline | Template + data → Render → HTML | Complete HTML | US-001 to US-004 |
| IT-RE-002 | Render to PDF | Template + data → Render → PDF | Valid PDF | US-005 |

## API Tests

| ID | Method | Path | Input | Expected Status |
|----|--------|------|-------|-----------------|
| AT-RE-001 | POST | /api/render/preview | Template + data | 200 |
| AT-RE-002 | POST | /api/render/generate | Instance + data | 200 |

## E2E Tests

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| ET-RE-001 | Preview template | Open template → Preview → Verify output | Correct preview |
| ET-RE-002 | Generate document | Complete workflow → Verify document | Document created |

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-RE-001 | 10+ nested components | All rendered correctly |
| EC-RE-002 | 1000+ loop items | All expanded |
| EC-RE-003 | Complex condition | Evaluated correctly |
| EC-RE-004 | Missing data | Graceful handling |
