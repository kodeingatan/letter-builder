# Requirements — Document

## Problem

Generated documents have no versioning, no search, and no centralized archive. Tracking which template and workflow produced a document is manual. PDF generation is inconsistent.

## Objective

Provide a centralized Document repository that stores generated output (HTML/PDF), links back to the Template and Administration (Workflow) that produced it, and supports search, view, and download.

## Actors

| Actor | Role |
|-------|------|
| Staff | Views, searches, downloads generated documents |
| Administrator | Manages document settings |

## User Stories

### US-001: Generate Document

**Given** a workflow instance completes (all steps approved)
**When** the final step is approved
**Then** a Document is generated from the resolved Template

**Acceptance Criteria:**
- [ ] Document created automatically on workflow completion
- [ ] Document links to Administration, Template, Instance
- [ ] Document stored as HTML (rendered output)
- [ ] PDF generated from HTML

### US-002: View Document

**Given** a Document exists
**When** the Staff member opens the Document page
**Then** the document is displayed with full content and metadata

**Acceptance Criteria:**
- [ ] Document rendered in viewer (HTML)
- [ ] Metadata shown: template, workflow, date, status
- [ ] PDF download available
- [ ] Print available

### US-003: Search Documents

**Given** multiple Documents exist
**When** the Staff member searches by name, date, or template
**Then** matching documents are listed

**Acceptance Criteria:**
- [ ] Search by document name
- [ ] Filter by template
- [ ] Filter by date range
- [ ] Filter by workflow status
- [ ] Results paginated

### US-004: Download Document

**Given** a Document exists
**When** the Staff member clicks "Download PDF"
**Then** the PDF file is downloaded

**Acceptance Criteria:**
- [ ] PDF matches rendered HTML
- [ ] PDF has correct page size (A4)
- [ ] PDF has headers/footers if configured
- [ ] File named with document identifier

### US-005: Document Settings

**Given** the Administrator wants to configure document output
**When** they open Document Settings
**Then** they can set page size, margins, headers, footers

**Acceptance Criteria:**
- [ ] Page size selector (A4, Letter, etc.)
- [ ] Margin configuration
- [ ] Header/footer template support
- [ ] Settings applied to PDF generation

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-DC-001 | System shall generate Document on workflow completion | Must |
| REQ-DC-002 | System shall store rendered HTML | Must |
| REQ-DC-003 | System shall generate PDF from HTML | Must |
| REQ-DC-004 | System shall support document search and filtering | Must |
| REQ-DC-005 | System shall support PDF download | Must |
| REQ-DC-006 | System shall link Document to Administration/Template/Instance | Must |
| REQ-DC-007 | System shall support document settings (page size, margins) | Should |
| REQ-DC-008 | System shall support document metadata | Should |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-DC-001 | Document generation | < 5s |
| NFR-DC-002 | PDF generation | < 3s |
| NFR-DC-DC-003 | Search response | < 500ms |
| NFR-DC-004 | Document view load | < 1s |

## Constraints

- Documents cannot be edited (immutable)
- Documents must link to their source workflow
- PDF must match HTML rendering
- Documents are archived, not deleted

## Edge Cases

- Template with complex layouts
- Document with 100+ pages
- Concurrent document generation
- PDF generation failure

## Dependencies

- Administration (workflow completion triggers generation)
- Template (used for rendering)
- Render Engine (HTML → PDF)
