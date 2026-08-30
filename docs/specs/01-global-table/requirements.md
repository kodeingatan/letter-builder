# Requirements — Global Table

## Problem

Organizations need to store and manage diverse data structures (employees, departments, assets, etc.) without requiring developers to create new database tables, migrations, entities, controllers, and services for each one. Traditional approaches create bottlenecks when non-technical users need new data collections.

## Objective

Enable users to define dynamic data structures (Global Tables) with configurable fields, and automatically receive full CRUD operations — browse, create, read, update, delete — without manual coding.

## Actors

| Actor | Role |
|-------|------|
| Administrator | Defines Global Tables, creates/edits columns, manages records |
| Staff | Reads records from published Global Tables for document generation |

## User Stories

### US-001: Create a Global Table

**As an** Administrator
**I want to** create a new Global Table with a name and field definitions
**So that** I can store structured data without developer intervention

**Acceptance Criteria:**
- [ ] Table has a unique name and display name
- [ ] At least one column must be defined
- [ ] Each column has a name, display name, and type
- [ ] Table is created in Draft status

### US-002: Manage Columns

**As an** Administrator
**I want to** add, edit, reorder, and remove columns from a Global Table
**So that** I can evolve the data structure over time

**Acceptance Criteria:**
- [ ] Columns can be added with type-specific configuration
- [ ] Columns can be reordered via drag-and-drop
- [ ] Column types determine input component and validation
- [ ] Published tables protect columns with existing data

### US-003: Browse Records

**As an** Administrator
**I want to** view all records in a Global Table with search, sort, and pagination
**So that** I can find and manage data efficiently

**Acceptance Criteria:**
- [ ] Records displayed in a data table with configured columns
- [ ] Search filters across searchable columns
- [ ] Sorting by any orderable column
- [ ] Pagination with configurable page size

### US-004: Create and Edit Records

**As an** Administrator
**I want to** add and edit records using a form generated from column definitions
**So that** data entry follows the defined structure

**Acceptance Criteria:**
- [ ] Form fields generated from column type (text input, date picker, select, etc.)
- [ ] Required field validation enforced
- [ ] Computed fields display calculated values
- [ ] Relation fields show selectable options from related tables

### US-005: Delete Records

**As an** Administrator
**I want to** delete records with confirmation
**So that** I can remove incorrect or obsolete data

**Acceptance Criteria:**
- [ ] Confirmation dialog before deletion
- [ ] Soft delete (status change) preferred over hard delete
- [ ] Dependent references shown before deletion

### US-006: Publish a Global Table

**As an** Administrator
**I want to** publish a Global Table when its structure is finalized
**So that** it becomes available for Components and document generation

**Acceptance Criteria:**
- [ ] Published status makes table available to other features
- [ ] Published tables restrict structural changes that would break data
- [ ] Status transitions: Draft → Published → Archived

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-GT-001 | System shall allow creating Global Tables with unique names | Must |
| REQ-GT-002 | System shall support column types: text, number, date, image, select, richtext, relation, computed | Must |
| REQ-GT-003 | System shall auto-generate CRUD operations for each Global Table | Must |
| REQ-GT-004 | System shall generate forms based on column definitions | Must |
| REQ-GT-005 | System shall enforce required field validation | Must |
| REQ-GT-006 | System shall support searchable and orderable column flags | Must |
| REQ-GT-007 | System shall support column reordering | Should |
| REQ-GT-008 | System shall support computed columns with expressions | Should |
| REQ-GT-009 | System shall support relation columns linking to other tables | Should |
| REQ-GT-010 | System shall protect published tables from breaking changes | Must |
| REQ-GT-011 | System shall support table status lifecycle (Draft/Published/Archived) | Must |
| REQ-GT-012 | System shall support select columns with configurable options | Must |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-GT-001 | Record browse response time | < 500ms for 1000 records |
| NFR-GT-002 | Form generation from schema | < 100ms |
| NFR-GT-003 | Search across columns | < 300ms |

## Constraints

- Global Table names must be unique across the system
- Column names must be unique within a table
- A table must have at least one column
- Published tables with data cannot have columns deleted
- Computed columns cannot be used as data sources for other computed columns (no circular references)

## Edge Cases

- Table with 50+ columns — UI must remain usable
- Table with 10,000+ records — pagination required
- Relation column referencing a table that gets archived
- Computed column with invalid expression
- Column type change on a table with existing data

## Dependencies

- Expression Engine (for computed columns)
- None at this stage — Global Table is a foundational feature
