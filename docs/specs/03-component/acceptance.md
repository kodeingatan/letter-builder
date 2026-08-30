# Acceptance Criteria — Component

## AC-001: Create Component

**Given** the Administrator is on the Components page
**When** they click "+ Create Component" and fill in a valid name
**Then** a new Component is created in Draft status and the builder opens

**Mapped to:** REQ-CO-001, US-001

## AC-002: Unique Component Name

**Given** a Component named "identitas_pegawai" exists
**When** the Administrator tries to create another with the same name
**Then** a validation error is shown

**Mapped to:** REQ-CO-001, BC-CO-001

## AC-003: Rich Text Content

**Given** the Administrator is in the Component builder
**When** they type text, apply formatting (bold, italic), and add paragraphs
**Then** the content is saved with formatting preserved

**Mapped to:** REQ-CO-002, US-001

## AC-004: Insert Dynamic Token

**Given** the Administrator is editing Component content
**When** they insert a dynamic token named "nama"
**Then** a token chip appears in the canvas and a requirement is auto-suggested

**Mapped to:** REQ-CO-003, US-001

## AC-005: Data Requirement Matching

**Given** a Component has a dynamic token {{nama}}
**When** the Administrator saves without a matching requirement
**Then** a warning is shown about unmatched tokens

**Mapped to:** REQ-CO-004, BC-CO-003

## AC-006: Collection Mode

**Given** the Administrator sets Component mode to "Collection"
**When** they configure a source table and item alias
**Then** the canvas shows a loop indicator

**Mapped to:** REQ-CO-005, US-003

## AC-007: Preview Component

**Given** a Component has tokens and requirements
**When** the Administrator clicks "Preview"
**Then** rendered content is shown with sample data

**Mapped to:** REQ-CO-007, US-004

## AC-008: Publish Component

**Given** a Component is in Draft status
**When** the Administrator clicks "Publish"
**Then** status changes to Published, version incremented

**Mapped to:** REQ-CO-008, US-005

## AC-009: Version on Edit

**Given** a Component is Published (v2)
**When** the Administrator edits and saves
**Then** a new version (v3) is created, old version preserved

**Mapped to:** REQ-CO-006, BC-CO-004

## AC-010: Empty State

**Given** no Components exist
**When** the Administrator opens the Components page
**Then** empty state is shown with create action

**Mapped to:** REQ-CO-001

## AC-011: Requirement Cannot Be Removed if Used

**Given** a Component has a requirement used by a Template binding
**When** the Administrator tries to remove the requirement
**Then** the removal is blocked with a dependency warning

**Mapped to:** BC-CO-006

## Summary

| ID | Criterion | Mapped To | Status |
|----|-----------|-----------|--------|
| AC-001 | Create Component | REQ-CO-001 | [ ] |
| AC-002 | Unique name | REQ-CO-001 | [ ] |
| AC-003 | Rich text content | REQ-CO-002 | [ ] |
| AC-004 | Insert dynamic token | REQ-CO-003 | [ ] |
| AC-005 | Data requirement matching | REQ-CO-004 | [ ] |
| AC-006 | Collection mode | REQ-CO-005 | [ ] |
| AC-007 | Preview component | REQ-CO-007 | [ ] |
| AC-008 | Publish component | REQ-CO-008 | [ ] |
| AC-009 | Version on edit | REQ-CO-006 | [ ] |
| AC-010 | Empty state | REQ-CO-001 | [ ] |
| AC-011 | Requirement protection | BC-CO-006 | [ ] |
