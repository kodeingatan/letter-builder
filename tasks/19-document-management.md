# Task 19 — Document Management

## Status

DONE

## Objective

Persist every completed run as immutable documents — data snapshot + pinned template/component versions + rendered HTML/PDF — browsable, previewable, and downloadable, with old documents forever rendering as originally issued.

## Context

Document is the final chain link ("GENERATE" output). It closes the versioning promise made in Tasks 13/14/17: documents outlive definition edits. Source: `wiki/overall-flow.md` (Document node), `final-concept.md` (Document box), `database.md` PLANNED §9 `documents`.

## Scope

### In Scope

- Document records per completed run (one per template used — multi-template runs yield multiple documents)
- Immutable snapshot: run input data + template version content + component versions + bindings snapshot + resolved HTML + PDF file
- Browse (per-administration + global), detail viewer (HTML preview + metadata), PDF/HTML download
- Regeneration guard (never re-render old docs against new versions; explicit re-issue creates a NEW document)

### Out of Scope

- Render algorithm (Task 20 produces HTML/PDF bytes; this task stores + serves them)
- Run wizard (Task 18)

## Actors

- Operator — views/downloads own run documents
- Designer/Admin — views all documents, re-issues

## Dependencies

- Task 18 (completed runs supply input) — required
- Task 20 (rendered output) — required for HTML/PDF bytes (store now, fill bytes when renderer lands; HTML-first acceptable interim)

## Requirements

- REQ-001: Each completed run step-with-template yields one document linked to run + administration + template version.
- REQ-002: Document stores full snapshot JSON: `{ runInput, templateContent, componentSnapshots, bindings, resolvedPins, systemContext }` sufficient to audit without re-querying live tables.
- REQ-003: Document stores `outputHtml` (TEXT) + `outputFilePath` (PDF in storage); HTML preview renders sandboxed (no scripts).
- REQ-004: Browse filterable by administration, date range, created-by; detail shows metadata (`.detail-view`) + HTML preview + download buttons + version pins.
- REQ-005: Re-issue (regenerate from same snapshot against same pinned versions, e.g. PDF engine upgrade) creates a new document row linked `replacesId` — never mutates the original.
- REQ-006: Documents immutable: no update/delete API except admin purge with explicit confirm (and activity log); default UI offers no delete.

## Business Rules

- BR-001: Snapshot completeness rule — a document without frozen template content + bindings is invalid (rejected at creation, 422).
- BR-002: Old documents always display pinned versions (metadata shows `template v3 (current v5)` badge when drifted).
- BR-003: PDF filename convention: `{admin-slug}_{doc-id}_{YYYYMMDD-HHmm}.pdf` under `server/storage/documents/`, served via `/api/storage/documents/*` (extend Task storage allowlist).
- BR-004: Multi-template runs produce N documents sharing `runId`, ordered by step order.
- BR-005: Document visibility: creator + admins by default; extend only via explicit share rules (deferred — see Open Questions).

## Domain

```text
RUN (Task 18, frozen input)
    └── DOCUMENT × N (one per template-step)
            ├── DATA SNAPSHOT (immutable JSON)
            ├── TEMPLATE VERSION + COMPONENT VERSIONS (frozen)
            ├── outputHtml (rendered)
            └── outputFilePath (PDF)
```

## Data Model

### documents

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| runId | INTEGER FK → administration_runs.id | Yes | Source run |
| administrationId | INTEGER FK → administrations.id | Yes | Denormalized for filtering |
| stepId | INTEGER FK → administration_steps.id NULLABLE | No | Source step (SET NULL safe) |
| templateId | INTEGER NULLABLE | No | Blueprint (nullable post-delete) |
| templateVersion | INTEGER | Yes | Pinned version rendered |
| dataSnapshot | TEXT | Yes | Full snapshot JSON (BR-001) |
| outputHtml | TEXT NULLABLE | No | Rendered HTML (filled by Task 20) |
| outputFilePath | VARCHAR(500) NULLABLE | No | PDF path |
| replacesId | INTEGER FK → documents.id NULLABLE | No | Re-issue chain |
| createdBy | INTEGER FK → users.id NULLABLE | No | Issuer |
| createdAt | DATETIME | — | Issue time |

INDEX(administrationId, createdAt), INDEX(runId).

## API

- `GET /api/documents` (paginated; filters `administrationId`, `createdBy`, `startDate`, `endDate`; search) → with admin/template names + version badges.
- `GET /api/documents/:id` → metadata + snapshot summary + pins (+ HTML unless `?meta=1`).
- `GET /api/documents/:id/html` → raw HTML (Content-Type text/html, sandboxed by client iframe).
- `GET /api/documents/:id/pdf` → PDF download (via storage path, correct headers).
- `POST /api/documents/:id/reissue` (admin) → new document row (same snapshot, fresh render) with `replacesId`.
- Creation endpoint is SYSTEM-internal (called by run completion, not a public POST) — document creation rides `POST /api/runs/:runId/complete`.

## UI/UX

### Information Architecture

`Persuratan > Documents` global page + per-administration Documents tab + detail page `/dashboard/docs/documents/:id`.

### List

DataTable: Title (admin + template names), Versions badge, Created By, Date, Actions (View/PDF/HTML). Filters: administration NSelect, date range NDatePicker, search.

### Detail

Header (title + version-drift badge) + `.detail-view` metadata (Run, Administration version, Template vN, Components pinned, Issuer, Dates) + HTML preview in sandboxed NCard/iframe + footer Downloads (PDF primary, HTML secondary) + Re-issue (admin only, confirm noting new-row semantics).

### States

render-pending (renderer not yet run — spinner + retry), missing PDF (HTML-only notice), version-drifted info banner, permission denied, empty ("No documents yet — complete a run").

### Responsive Behavior

Preview iframe scales; metadata stacks; downloads remain reachable (sticky footer on mobile).

## Validation

- Zod on creation payload (server-internal): snapshot required keys enforced; HTML sanitized on store (same allowlist as Task 15).

## Security & Permission

- Permission `Document Management` read; `Document Reissue` (admin-gated) for reissue/purge. Row-level: non-admins see own runs' documents only (server filter by `createdBy`).
- PDFs served with `Content-Disposition` filename; no directory traversal (basename-joined paths).

## Acceptance Criteria

### AC-001

Given completed 3-template run, when completion finishes, then 3 documents exist sharing runId ordered by step.

### AC-002

Given template later published to v5, when viewing a v3 document, then content matches v3 byte-for-byte and badge shows drift.

### AC-003

Given operator A, when listing documents, then only A's documents appear; admin sees all.

### AC-004

Given re-issue, when executed, then a NEW row with replacesId appears and the original is untouched.

### AC-005

Given HTML with script, when stored/previewed, then script stripped and preview sandboxed.

## Implementation

### Backend

- [x] Entity + register + storage subfolder `documents/` allowlisted
- [x] Creation service (snapshot assembly + validation + file write) called from run-complete hook
- [x] Routes (list/detail/html/pdf/reissue) + row-level scoping
- [x] Authorization + logs (issue/reissue/purge)
- [x] Unit tests (snapshot completeness, drift badge data, scoping, reissue chain)
- [ ] Integration/API tests

### Frontend

- [x] Types/store/pages (List + Detail + preview + downloads + per-admin tab)
- [x] Sandboxed preview + drift badge
- [x] States + responsive
- [ ] Unit + E2E tests (run → N documents → download)

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (snapshot JSON parseable, immutability — update attempts rejected)
- [ ] Permission verification (own-vs-all matrix)
- [ ] UI/UX + Responsive + Design System verification
- [ ] File verification (PDF downloads byte-correct, filenames per convention)

## Assumptions

- HTML-first interim acceptable: documents valid with HTML before PDF engine (Task 20) fills `outputFilePath`.
- No document delete in UI v1 (purge API exists for admins, unlinked from UI).

## Open Questions

- Should documents support sharing links (signed expiring URLs) for external recipients?
- Do we need document numbering sequences per administration (e.g. SK numbers) — and who mints them?

## Related Knowledge

- `docs/PRD.md` (§8.1 Document, §13 versioning edge, §11 BR-005)
- `docs/database.md` (PLANNED §9), `docs/architecture.md`
- `wiki/overall-flow.md`, `wiki/final-concept.md`, `wiki/core-object-model.md`
- Tasks 13, 14, 17, 18, 20

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
