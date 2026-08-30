# Acceptance Criteria — Template

## AC-001: Create Template

**Given** the Administrator is on the Templates page
**When** they create a new Template with a valid name
**Then** a Template is created in Draft status and the builder opens

**Mapped to:** REQ-TE-001, US-001

## AC-002: Unique Template Name

**Given** a Template named "surat_keputusan" exists
**When** the Administrator creates another with the same name
**Then** a validation error is shown

**Mapped to:** REQ-TE-001, BC-TE-001

## AC-003: Insert Component

**Given** the Administrator is in the Template builder
**When** they select a Component from the picker
**Then** the Component block is inserted into the canvas

**Mapped to:** REQ-TE-003, US-002

## AC-004: Bind Data to Requirements

**Given** a Component block has 3 requirements
**When** the Administrator binds each requirement to a data source
**Then** all bindings are saved and a green checkmark appears

**Mapped to:** REQ-TE-004, US-003

## AC-005: Unbound Requirements Block Publish

**Given** a Template has a Component with unbound requirements
**When** the Administrator tries to publish
**Then** publishing is blocked with "All requirements must be bound" message

**Mapped to:** REQ-TE-004, BC-TE-002

## AC-006: Configure Loop

**Given** the Administrator inserts a collection-mode Component
**When** they configure source table and item alias
**Then** the canvas shows a loop indicator and preview shows repeated blocks

**Mapped to:** REQ-TE-005, US-004

## AC-007: Configure Condition

**Given** the Administrator inserts a condition block
**When** they enter a valid expression
**Then** the condition block wraps content and evaluates in preview

**Mapped to:** REQ-TE-006, US-005

## AC-008: Live Preview

**Given** a Template has components, bindings, and content
**When** the Administrator clicks "Preview"
**Then** a split-screen preview shows resolved content

**Mapped to:** REQ-TE-007, US-006

## AC-009: Publish Template

**Given** a Template has all requirements bound
**When** the Administrator clicks "Publish"
**Then** status changes to Published, version incremented

**Mapped to:** REQ-TE-009, US-007

## AC-010: Version on Edit

**Given** a Template is Published (v2)
**When** the Administrator edits and saves
**Then** a new version (v3) is created

**Mapped to:** REQ-TE-008, BC-TE-005

## AC-011: Empty State

**Given** no Templates exist
**When** the Administrator opens the Templates page
**Then** empty state is shown with create action

**Mapped to:** REQ-TE-001

## Summary

| ID | Criterion | Mapped To | Status |
|----|-----------|-----------|--------|
| AC-001 | Create Template | REQ-TE-001 | [ ] |
| AC-002 | Unique name | REQ-TE-001 | [ ] |
| AC-003 | Insert Component | REQ-TE-003 | [ ] |
| AC-004 | Bind data | REQ-TE-004 | [ ] |
| AC-005 | Block publish if unbound | REQ-TE-004 | [ ] |
| AC-006 | Configure loop | REQ-TE-005 | [ ] |
| AC-007 | Configure condition | REQ-TE-006 | [ ] |
| AC-008 | Live preview | REQ-TE-007 | [ ] |
| AC-009 | Publish template | REQ-TE-009 | [ ] |
| AC-010 | Version on edit | REQ-TE-008 | [ ] |
| AC-011 | Empty state | REQ-TE-001 | [ ] |
