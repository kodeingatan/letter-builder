# Task 21 — Generated Menu & Navigation

## Status

TODO REVIEW

## Objective

Replace hard-coded Data/Persuratan navigation with menus projected from metadata: each Global Table yields a Data entry, each published Administration yields a Persuratan entry — permission-filtered per user.

## Context

Implements "Generated Menu: projection dari metadata, bukan hard-coded". It is the navigation payoff unifying Task 12 (per-table pages) and Task 18 (run entries). Source: `wiki/generated-menu.md`, `design-system.md` metadata-driven UI, PRD §11 BR-006.

## Scope

### In Scope

- Menu projection API (`GET /api/navigation`) returning Data + Persuratan groups from live metadata, filtered by read/runnable permissions
- Sidebar integration (new Data + Persuratan groups alongside existing User Management/Sistem)
- Generic per-table route already built in Task 12 wired to menu labels; run entries deep-link to Task 18 starter
- Stale-entry handling (deleted/archived metadata disappears;以下简称 graceful 404 page for bookmarked dead links)
- Icon + order config per table/administration (display order field)

### Out of Scope

- Page implementations themselves (Tasks 12/18)
- RBAC model changes (Task 22 owns hardening)

## Actors

- Operator/Designer — navigates via generated menus
- Designer — sets menu order/labels (displayName/name are the labels; order field added here)

## Dependencies

- Task 12 (per-table generic page + Read permissions) — required
- Task 17 (published administrations exist) — required
- Task 18 (run starter route) — required for Persuratan links

## Requirements

- REQ-001: `GET /api/navigation` returns `{ data: [{ tableName, label, icon, order }], persuratan: [{ administrationId, label, icon, order }] }` containing ONLY items the caller may Read/Run.
- REQ-002: Sidebar renders Data group (Table icon per entry default) + Persuratan group (Document icon) from this API with active-route highlight; groups hidden when empty (with first-run empty-state hint for Designers).
- REQ-003: Menu order follows per-item `menuOrder` (new nullable field on tables/administrations, default alphabetical); Designer can reorder via list drag (reuse pattern from Task 08/17).
- REQ-004: Navigation updates without redeploy: creating a table/admin makes its entry appear on next navigation fetch (poll-on-route-change + manual refresh button, no websockets v1).
- REQ-005: Dead bookmarks (deleted table / archived admin) land on a friendly 404-with-context page ("Pegawai no longer exists" + back to Data home), not a blank crash.

## Business Rules

- BR-001: Draft tables/administrations NEVER appear in menus (published/valid-data only: tables need ≥1 column; administrations must be published).
- BR-002: Permission filtering is server-side authoritative (client hiding is cosmetic; direct URLs still 403/404 per Tasks 12/18).
- BR-003: Labels derive from `displayName`/`name` (single source of truth — no separate menu-label table in v1; rename propagates).
- BR-004: `menuOrder` unique per group is best-effort (collisions fall back to alphabetical, no hard error).
- BR-005: Sidebar anchor behavior keeps `<a href>` + SPA push pattern per design-system (right-click/new-tab works for generated entries too).

## Domain

```text
GLOBAL TABLE metadata ─┐
                       ├─▶ NAVIGATION PROJECTION ─▶ SIDEBAR (Data / Persuratan)
ADMINISTRATION (pub) ──┘         (permission-filtered, ordered)
```

## Data Model

Additive nullable columns (no new tables):

| Table | Field | Type | Description |
| ----- | ----- | ---- | ----------- |
| global_tables | menuOrder | INTEGER NULLABLE | Order in Data group |
| global_tables | menuIcon | VARCHAR(32) NULLABLE | Carbon icon key allowlist |
| administrations | menuOrder | INTEGER NULLABLE | Order in Persuratan group |
| administrations | menuIcon | VARCHAR(32) NULLABLE | Carbon icon key allowlist |

Icon allowlist v1: Table, Document, Folder, Star, Book, File. Unknown → default.

## API

- `GET /api/navigation` (auth) → projection per REQ-001 (cached 30s server-side, invalidated on table/admin mutations).
- `PUT /api/global-tables/:id/menu` `{ menuOrder, menuIcon }` + `PUT /api/administrations/:id/menu` — Designer-gated reorder/icon updates.

## UI/UX

### Information Architecture

Sidebar becomes: Dashboard / **Data** (generated) / **Persuratan** (generated) / Dokumen (design: Components, Templates, Administrations — static designer links) / User Management / Sistem. Operator roles typically see Data + Persuratan only (via permission filtering).

### Sidebar behavior

Generated entries use the mandated `<a href>` pattern; icons from allowlist; NMenu groups collapse per existing AppLayout; refresh affordance (Restart icon) refetches projection; empty groups show inline hint ("No data tables yet — ask a Designer") only for privileged roles.

### Management UI

Tables list + Administrations list each gain compact order control (up/down or drag) + icon picker (NSelect of allowlist with preview) — reuses drag patterns from earlier tasks.

### States

loading menus (skeleton items), empty groups, projection fetch error (fallback to last-good cached + warning), dead-link 404 page, permission denied.

### Responsive Behavior

Sidebar drawer on mobile unchanged; generated entries inherit collapse (72px) icon-only mode with tooltips.

## Validation

- Zod: menuOrder integer ≥0, menuIcon ∈ allowlist. Server clamps/fallbacks rather than 500 on legacy nulls.

## Security & Permission

- Projection endpoint requires auth; per-item inclusion checks Read (tables) / Run (administrations) server-side. Menu PUT endpoints require respective Management permissions.

## Acceptance Criteria

### AC-001

Given new Pegawai table with columns, when created, then Data > Pegawai appears for permitted users without redeploy.

### AC-002

Given published SK administration, when published, then Persuratan > SK appears; archiving removes it.

### AC-003

Given Read-revoked user, when fetching navigation, then the table entry is absent AND direct URL 403s.

### AC-004

Given bookmarked deleted-table URL, when visited, then contextual 404 page (not crash).

### AC-005

Given reordered menus, when reloaded, then order persists.

### AC-006

Given right-click on a generated entry, when opened in new tab, then SPA route loads correctly (anchor pattern preserved).

## Implementation

### Backend

- [x] Entity column additions + register (`menuOrder`/`menuIcon` on `global_tables` + `administrations`; `synchronize: true` covers registration, no `db.ts` change needed)
- [x] Projection service (`server/services/navigation.service.ts`: metadata scan + permission filter + ordering + 30s per-user cache + `invalidateNavigationCache()` hooks in table/admin/column services)
- [x] Routes (`GET /api/navigation` auth-only; `PUT /api/global-tables/:id/menu`, `PUT /api/administrations/:id/menu` via `requireApiAccess`)
- [x] Authorization + logs (menu reorder audit-logged via existing GlobalTable/Administration activity-logger branches)
- [x] Unit tests (`test/unit/services/navigation.test.ts` 15 tests: ordering fallback, icon normalize, read/run filtering matrix, cache; `test/unit/dto/navigation-menu.test.ts` 6 tests: allowlist + schema) — full suite 410/410, nuxt 15/15
- [ ] Integration/API tests (live smoke instead, per Tasks 13–20 convention)

### Frontend

- [x] Navigation store (`app/stores/navigation.ts`: fetch, last-good cache, refresh) + sidebar integration (Data/Persuratan generated groups, refresh button, skeleton/hint states) + dead-link 404 pages (`NResult` in `data/[tableName].vue`, `docs/run/[adminId].vue`)
- [x] Order/icon controls in the two lists (up/down + `NSelect` allowlist in `GlobalTableTable` + `AdministrationTable`, wired to `updateMenu` store actions)
- [x] States + responsive + anchor pattern (existing `renderMenuLabel` `<a href>` helper reused; collapse/tooltip inherited)
- [ ] Unit + E2E tests (live AC verification instead: AC-001..AC-005 all pass, AC-006 code-level via shared anchor helper)

## Verification (by /implement, live on dev server 2026-09-07)

- [x] Typecheck (`vue-tsc` clean), Unit (410/410), nuxt (15/15), Build OK
- [x] Permission verification (guest empty + 403, viewer data-only, menu PUTs Designer-gated 403)
- [x] Live AC-001..AC-005 verified; AC-006 anchor pattern reused (code-level)
- [ ] Full Integration/API + E2E + UI/UX review (belongs to `/verify`)

## Assumptions

- Poll-on-route-change freshness is enough v1 (no realtime sockets).
- Single-level groups (no nested submenus under a table) suffice.
- `GET /api/navigation` uses `requireAuth` only (no `Navigation` permission seeded): per-item inclusion IS the authorization, so Viewer/Guest/Operator roles can all call it — entries are filtered server-side. Menu PUTs stay Designer-gated via existing Management permissions.
- `File` allowlist key maps to Carbon `DocumentBlank` (no `File` export in `@vicons/carbon`).
- Order controls are compact up/down steppers (±1, best-effort per BR-004), not drag — matches Task 17's declared up/down pattern.

## Open Questions

- Should operators pin/favorite entries personally (per-user favorites) in v1?
- Do we need per-entry visibility windows (publish menu entry separately from publishing the definition)?

## Related Knowledge

- `docs/PRD.md` (§11 BR-006)
- `docs/design-system.md` (Metadata-driven UI, Sidebar Navigation anchor pattern)
- `wiki/generated-menu.md`, `wiki/konsep-utama.md`
- Tasks 07, 12, 17, 18

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
