# Test Cases — Global Table

## Unit Tests

### GlobalTableService

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-GT-001 | Create table with valid data | Valid table object | Table created with id | REQ-GT-001 |
| UT-GT-002 | Reject duplicate name | Name "pegawai" (exists) | Conflict error | BC-GT-001 |
| UT-GT-003 | Reject table without columns | Empty columns array | Validation error | BC-GT-003 |
| UT-GT-004 | Publish draft table | Draft table, valid | Status = published | REQ-GT-011 |
| UT-GT-005 | Block column delete on published table with data | Published table, column with data | Blocked error | BC-GT-004 |

### ColumnService

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-COL-001 | Add column with valid type | Valid column object | Column created | REQ-GT-002 |
| UT-COL-002 | Reject duplicate column name | Name "nama" (exists in table) | Validation error | BC-GT-002 |
| UT-COL-003 | Validate select options | Select type, empty options | Validation error | BC-GT-008 |
| UT-COL-004 | Validate relation target | Relation type, invalid table_id | Validation error | BC-GT-006 |
| UT-COL-005 | Reorder columns | Array of column IDs in new order | Order updated | REQ-GT-007 |

### RecordService

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-REC-001 | Create record with valid data | Valid data matching columns | Record created | REQ-GT-003 |
| UT-REC-002 | Reject record missing required field | Data without required column | Validation error | REQ-GT-005 |
| UT-REC-003 | Search records | Search term, searchable columns | Filtered results | REQ-GT-006 |
| UT-REC-004 | Sort records | Sort by column, direction | Sorted results | REQ-GT-006 |
| UT-REC-005 | Paginate records | page=2, per_page=10 | Correct offset | REQ-GT-003 |

## Integration Tests

### Collection CRUD Flow

| ID | Test | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| IT-GT-001 | Full collection lifecycle | Create → Add columns → Publish → Add records → Archive | All steps succeed | US-001, US-002, US-003, US-006 |
| IT-GT-002 | Record management | Add record → Edit → Search → Delete | All operations correct | US-003, US-004, US-005 |

## API Tests

### Collection Endpoints

| ID | Method | Path | Input | Expected Status | Expected Response |
|----|--------|------|-------|-----------------|-------------------|
| AT-GT-001 | GET | /api/collections | — | 200 | List of collections |
| AT-GT-002 | POST | /api/collections | Valid body | 201 | Created collection |
| AT-GT-003 | POST | /api/collections | Invalid body | 400 | Validation error |
| AT-GT-004 | POST | /api/collections | Duplicate name | 409 | Conflict error |
| AT-GT-005 | GET | /api/collections/:id | — | 200 | Collection with columns |
| AT-GT-006 | PUT | /api/collections/:id | Valid body | 200 | Updated collection |
| AT-GT-007 | DELETE | /api/collections/:id | — | 200 | Deleted confirmation |
| AT-GT-008 | POST | /api/collections/:id/publish | — | 200 | Status = published |

### Record Endpoints

| ID | Method | Path | Input | Expected Status | Expected Response |
|----|--------|------|-------|-----------------|-------------------|
| AT-REC-001 | GET | /api/collections/:id/records | — | 200 | List of records |
| AT-REC-002 | POST | /api/collections/:id/records | Valid body | 201 | Created record |
| AT-REC-003 | POST | /api/collections/:id/records | Missing required | 400 | Validation error |
| AT-REC-004 | PUT | /api/collections/:id/records/:rid | Valid body | 200 | Updated record |
| AT-REC-005 | DELETE | /api/collections/:id/records/:rid | — | 200 | Deleted confirmation |

## E2E Tests

### Administrator Manages Collection

| ID | Flow | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| ET-GT-001 | Create collection | Navigate → Click create → Fill form → Submit | Collection created, navigated to workspace | US-001 |
| ET-GT-002 | Add columns | Open Columns tab → Add column → Configure → Save | Column appears in list | US-002 |
| ET-GT-003 | Add record | Open Records tab → Click add → Fill form → Save | Record appears in table | US-004 |
| ET-GT-004 | Search records | Type in search bar | Filtered results shown | US-003 |
| ET-GT-005 | Publish collection | Click Publish → Confirm | Status changes to Published | US-006 |

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-GT-001 | 50+ columns | UI remains usable, horizontal scroll if needed |
| EC-GT-002 | 10,000+ records | Pagination enforced, no performance degradation |
| EC-GT-003 | Relation target archived | Relation field shows "archived" indicator |
| EC-GT-004 | Computed expression invalid | Validation error, column not saved |
| EC-GT-005 | Concurrent edits | Last-write-wins with timestamp comparison |
| EC-GT-006 | Special characters in name | Rejected with snake_case validation |
| EC-GT-007 | Very long display name | Truncated in UI, full in detail view |
