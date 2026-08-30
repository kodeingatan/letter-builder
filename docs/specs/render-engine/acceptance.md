# Acceptance Criteria — Render Engine

## AC-001: Render Template to HTML

**Given** a Template with static content and dynamic tokens
**When** the render engine processes it with data context
**Then** valid HTML is produced with resolved values

**Mapped to:** REQ-RE-001, US-001

## AC-002: Render Component Blocks

**Given** a Template with Component blocks
**When** the render engine encounters them
**Then** Component HTML is inserted with bound data

**Mapped to:** REQ-RE-003, US-002

## AC-003: Expand Loops

**Given** a Loop block with source table data
**When** the render engine processes it
**Then** Component is repeated for each data item

**Mapped to:** REQ-RE-004, US-003

## AC-004: Evaluate Conditions

**Given** a Condition block with expression
**When** the render engine evaluates it
**Then** content shown if true, hidden if false

**Mapped to:** REQ-RE-005, US-004

## AC-005: Generate PDF

**Given** rendered HTML output
**When** the render engine generates PDF
**Then** PDF matches HTML with correct page settings

**Mapped to:** REQ-RE-006, US-005

## AC-006: Handle Missing Component

**Given** a Component block referencing deleted component
**When** the render engine encounters it
**Then** error placeholder is shown, rendering continues

**Mapped to:** BC-RE-004, US-002

## Summary

| ID | Criterion | Mapped To | Status |
|----|-----------|-----------|--------|
| AC-001 | Render template to HTML | REQ-RE-001 | [ ] |
| AC-002 | Render component blocks | REQ-RE-003 | [ ] |
| AC-003 | Expand loops | REQ-RE-004 | [ ] |
| AC-004 | Evaluate conditions | REQ-RE-005 | [ ] |
| AC-005 | Generate PDF | REQ-RE-006 | [ ] |
| AC-006 | Handle missing component | BC-RE-004 | [ ] |
