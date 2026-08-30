# Acceptance Criteria — Document

## AC-001: Auto-Generate on Completion

**Given** a workflow instance completes (final step approved)
**When** the last action is submitted
**Then** a Document is generated from the resolved Template

**Mapped to:** REQ-DC-001, US-001

## AC-002: Store Rendered HTML

**Given** a Document is generated
**When** the system stores the output
**Then** the full rendered HTML is saved

**Mapped to:** REQ-DC-002, US-001

## AC-003: Generate PDF

**Given** a Document is generated
**When** the system generates PDF
**Then** a PDF file matches the rendered HTML

**Mapped to:** REQ-DC-003, US-001

## AC-004: View Document

**Given** a Document exists
**When** the Staff member opens the Document
**Then** content and metadata are displayed

**Mapped to:** REQ-DC-006, US-002

## AC-005: Search Documents

**Given** multiple Documents exist
**When** the Staff member searches by name, template, or date
**Then** matching documents are listed

**Mapped to:** REQ-DC-004, US-003

## AC-006: Download PDF

**Given** a Document has a generated PDF
**When** the Staff member clicks "Download PDF"
**Then** the PDF file is downloaded

**Mapped to:** REQ-DC-005, US-004

## AC-007: Document Settings

**Given** the Administrator opens Document Settings
**When** they configure page size and margins
**Then** settings are saved and applied to future PDFs

**Mapped to:** REQ-DC-007, US-005

## Summary

| ID | Criterion | Mapped To | Status |
|----|-----------|-----------|--------|
| AC-001 | Auto-generate on completion | REQ-DC-001 | [ ] |
| AC-002 | Store rendered HTML | REQ-DC-002 | [ ] |
| AC-003 | Generate PDF | REQ-DC-003 | [ ] |
| AC-004 | View document | REQ-DC-006 | [ ] |
| AC-005 | Search documents | REQ-DC-004 | [ ] |
| AC-006 | Download PDF | REQ-DC-005 | [ ] |
| AC-007 | Document settings | REQ-DC-007 | [ ] |
