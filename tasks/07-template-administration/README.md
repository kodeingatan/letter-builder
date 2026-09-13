# Task 07 — Template & Administrasi (Component Tiptap + Builder + Wizard + PDF)

> Entrypoint folder (mode B). Urutan baca: `spec.md` → `flow-requirements.md` → `domain-api-ui.md` → `acceptance-tasks.md` → `verification.md`.

## Status

DONE

## Panduan baca

- Konsumen Task 05 (renderer/PDF) + Task 06 (`master_data` + `schema` API). Alur: Component (Tiptap + right-click binding) → Template (richtext + embed component + looping picker + auto-form + PDF) → Administrasi (multi-step) → Hasil (wizard + menu per surat + PDF gabungan).
- Library terkunci: **Tiptap v2**, **Puppeteer PDF** (reuse Task 05). UI 3-pane + Storybook `stories/template-admin/` digabung inline (tanpa folder `-ui-design` terpisah).
