# Tasks — Folder Mode (Opsi B)

> Setiap task adalah **folder** `tasks/NN-slug/`, bukan 1 file raksasa.
> Entrypoint tiap task: `README.md` di dalam foldernya.

## Daftar Task

| Task | Folder | Status | Implemented | Verified | Reviewed |
|------|--------|--------|-------------|----------|----------|
| Task 01 — Platform Scope Reduction (RBAC-Only Cleanup & Docs Refresh) | `01-platform-scope-reduction/` | DONE | [x] | [x] | [x] |
| Task 02 — Fix Stale Nuxt Auto-Imports & Missing render-guard (Build Recovery) | `02-fix-stale-nuxt-imports-and-render-guard/` | DONE | [x] | [x] | [x] |
| Task 03 — Redesign UI/UX Notion-Calm (Wireframe / Mockup / Prototype) | `03-redesign-ui-design/` | DONE | [x] | [x] | [x] |
| Task 04 — Redesign Implementation (Notion-Calm ke 11 Halaman) | `04-redesign/` | DONE | [x] | [x] | [x] |
| Task 05 — Document Engine (JSON Tree + Repeater + Condition + Renderer + PDF) | `05-document-engine/` | DONE | [x] | [x] | [x] |
| Task 06 — Master Data DDL (pengganti Global Tabel) | `06-master-data-ddl/` | DONE | [x] | [x] | [x] |
| Task 07 — Template & Administrasi (Component Tiptap + Builder + Wizard + PDF) | `07-template-administration/` | DONE | [x] | [x] | [x] |
| Task 08 — Letter Builder UX Improvement UI Design (Wireframe/Mockup/Prototype + Playwright Flow + Error Hardening + Tiptap/Naive UI) | `08-letter-builder-ux-improvement-ui-design/` | DONE | [x] | [x] | [x] |
| Task 09 — Letter Builder UX Improvement (Implementation: Fix DELETE 409 + Error Hardening + Wiring) | `09-letter-builder-ux-improvement/` | TODO | [ ] | [ ] | [ ] |

## Struktur tiap folder task

```text
tasks/NN-slug/
  README.md               # judul + Status + panduan baca (entrypoint)
  spec.md                 # Objective, Context, Scope, Dependencies
  flow-requirements.md    # User Flow + Requirements
  domain-api-ui.md        # Domain + API + UI
  acceptance-tasks.md     # Acceptance Criteria + Tasks/Test Plan
  verification.md         # Verification + Assumptions + Open Questions + Related + Change Log
```

## Cara baca

1. Buka `tasks/NN-slug/README.md` untuk status + urutan baca.
2. Baca `spec.md` → `flow-requirements.md` → `domain-api-ui.md` → `acceptance-tasks.md` → `verification.md`.
3. Status lintas-task: `tasks/task-logs.md`.

## Task baru

* Salin `tasks/_template/` menjadi `tasks/NN-slug/` dan isi per file.
* Daftarkan di `tasks/task-logs.md` + tabel di atas.
* Resolusi tooling (`/task`, `/implement`, `/verify`, `/review`, `/gen-tasks`):
  nomor/nama task → `tasks/NN-slug/README.md`; baca split files sesuai kebutuhan.
