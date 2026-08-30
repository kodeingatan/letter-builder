# Acceptance Criteria — Global Table

## AC-001: Create Global Table

**Given** the Administrator is on the Collections page
**When** they click "+ Create Collection" and fill in valid details (name, display_name, at least 1 column)
**Then** a new Global Table is created in Draft status and the user is navigated to its workspace

**Mapped to:** REQ-GT-001, US-001

## AC-002: Unique Table Name

**Given** a Global Table named "pegawai" already exists
**When** the Administrator tries to create another table with name "pegawai"
**Then** a validation error is shown: "A table with this name already exists"

**Mapped to:** REQ-GT-001, BC-GT-001

## AC-003: Minimum One Column

**Given** the Administrator is creating a Global Table
**When** they try to save without adding any columns
**Then** a validation error is shown: "At least one column is required"

**Mapped to:** REQ-GT-001, BC-GT-003

## AC-004: Add Column with Type Configuration

**Given** the Administrator is on the Columns tab of a Draft collection
**When** they add a column with type "date" and format "m-d-Y"
**Then** the column is created with the specified configuration

**Mapped to:** REQ-GT-002, US-002

## AC-005: Column Type Determines Input

**Given** a collection has columns of types text, date, select, and relation
**When** the Administrator creates a new record
**Then** the form shows: text input for text, date picker for date, dropdown for select, and relation selector for relation

**Mapped to:** REQ-GT-004, US-004

## AC-006: Required Field Validation

**Given** a column is marked as required
**When** the Administrator tries to save a record without a value for that column
**Then** a validation error is shown and the record is not saved

**Mapped to:** REQ-GT-005, US-004

## AC-007: Browse Records with Search

**Given** a collection has 50 records
**When** the Administrator types a search term
**Then** records matching the search in searchable columns are displayed

**Mapped to:** REQ-GT-006, US-003

## AC-008: Sort by Column

**Given** a collection has records
**When** the Administrator clicks a sortable column header
**Then** records are sorted by that column (ascending/descending toggle)

**Mapped to:** REQ-GT-006, US-003

## AC-009: Paginate Records

**Given** a collection has more records than the page size
**When** the Administrator views the records table
**Then** pagination controls are shown and navigation works correctly

**Mapped to:** REQ-GT-003, US-003

## AC-010: Reorder Columns

**Given** the Administrator is on the Columns tab
**When** they drag a column to a new position
**Then** the column order is updated and reflected in the records table

**Mapped to:** REQ-GT-007, US-002

## AC-011: Publish Collection

**Given** a collection is in Draft status with valid structure
**When** the Administrator clicks "Publish"
**Then** the status changes to Published and the collection becomes available for Components

**Mapped to:** REQ-GT-011, US-006

## AC-012: Protect Published Collection

**Given** a collection is Published and has records
**When** the Administrator tries to delete a column that has data
**Then** the deletion is blocked with a message explaining the column has data

**Mapped to:** REQ-GT-010, BC-GT-004

## AC-013: Archive Collection

**Given** a collection is Published
**When** the Administrator archives it
**Then** the status changes to Archived and it is removed from relation selectors

**Mapped to:** REQ-GT-011

## AC-014: Empty State — No Collections

**Given** no Global Tables exist
**When** the Administrator opens the Collections page
**Then** an empty state is shown with message and create action

**Mapped to:** REQ-GT-003

## AC-015: Empty State — No Records

**Given** a collection has no records
**When** the Administrator opens the Records tab
**Then** an empty state is shown with message and add record action

**Mapped to:** REQ-GT-003

## AC-016: Loading State

**Given** data is being fetched
**When** the Administrator views the page
**Then** skeleton loading indicators are displayed

**Mapped to:** NFR-GT-001

## AC-017: Delete Record with Confirmation

**Given** a record exists
**When** the Administrator clicks delete
**Then** a confirmation dialog is shown before deletion

**Mapped to:** US-005

## AC-018: Computed Column

**Given** a collection has columns "harga" (number) and "jumlah" (number)
**When** the Administrator adds a computed column with expression "harga * jumlah"
**Then** the computed value is displayed for each record

**Mapped to:** REQ-GT-008, US-002

## AC-019: Relation Column

**Given** a "jabatan" collection exists and is Published
**When** the Administrator adds a relation column pointing to "jabatan"
**Then** the relation selector shows records from the "jabatan" collection

**Mapped to:** REQ-GT-009, US-002

## AC-020: Select Column Options

**Given** the Administrator adds a select column
**When** they configure options ["Active", "Inactive", "On Leave"]
**Then** the select dropdown shows exactly those options

**Mapped to:** REQ-GT-012

## Summary

| ID | Criterion | Mapped To | Status |
|----|-----------|-----------|--------|
| AC-001 | Create Global Table | REQ-GT-001 | [ ] |
| AC-002 | Unique table name | REQ-GT-001 | [ ] |
| AC-003 | Minimum one column | REQ-GT-001 | [ ] |
| AC-004 | Add column with type config | REQ-GT-002 | [ ] |
| AC-005 | Column type determines input | REQ-GT-004 | [ ] |
| AC-006 | Required field validation | REQ-GT-005 | [ ] |
| AC-007 | Browse with search | REQ-GT-006 | [ ] |
| AC-008 | Sort by column | REQ-GT-006 | [ ] |
| AC-009 | Paginate records | REQ-GT-003 | [ ] |
| AC-010 | Reorder columns | REQ-GT-007 | [ ] |
| AC-011 | Publish collection | REQ-GT-011 | [ ] |
| AC-012 | Protect published collection | REQ-GT-010 | [ ] |
| AC-013 | Archive collection | REQ-GT-011 | [ ] |
| AC-014 | Empty state — no collections | REQ-GT-003 | [ ] |
| AC-015 | Empty state — no records | REQ-GT-003 | [ ] |
| AC-016 | Loading state | NFR-GT-001 | [ ] |
| AC-017 | Delete with confirmation | US-005 | [ ] |
| AC-018 | Computed column | REQ-GT-008 | [ ] |
| AC-019 | Relation column | REQ-GT-009 | [ ] |
| AC-020 | Select column options | REQ-GT-012 | [ ] |
