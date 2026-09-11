# Dynamic Administration & Document Composition Platform

> Entry point dokumentasi konsep. Implementasi: Nuxt 4 + Nitro + TypeORM + SQLite + Naive UI.
> Status: fondasi + seluruh modul inti ✅ implemented (tasks 07–24);
> peningkatan UX + penutup gap concept 📋 roadmapped (tasks 25–38).

## Core Concept (satu rantai)

```text
DATA (Global Table) → BLOCK (Component) → BLUEPRINT (Template)
  → WORKFLOW (Administration) → RUN (Runtime Steps) → DOCUMENT (PDF/HTML)
```

Versi sempurna (12 lapisan, peran, golden path, 8 aturan emas, peta status): `wiki/core-concept.md`.

## Peta Dokumen

| Dokumen | Isi |
|---|---|
| `wiki/index.md` | Katalog 31 artikel per 9 kategori |
| `wiki/AGENTS.md` | Skema wiki (kategori + konvensi wikilink) |
| `wiki/core-concept.md` | Core concept sempurna — logika & fitur keseluruhan |
| `wiki/statamic-reference.md` | Peta arsitektur Statamic → tech stack BMS + decision log |
| `wiki/column-type-catalog.md` | Katalog 14 tipe kolom (v1 implemented + v2 target) |
| `wiki/administration-runtime.md` | Runtime penuh + `step_field` + nested component |
| `wiki/konsep-utama.md`, `final-concept.md`, `overall-flow.md` | Rantai, diagram, alur (fondasi) |
| `raw/` | Sumber mentah immutable (jangan ditulis ulang; tambah file baru bila ada spec baru) |
| `raw/spec-v2-statamic-alignment.md` | Spec v2 + 4 keputusan alignment 2026-09-11 |

## Konvensi

- Wiki memakai `[[wikilink]]` kebab-case; kategori berasal dari heading `index.md`.
- Status: ✅ implemented · 🎯 target · 📋 roadmapped.
- Bahasa data tunggal: `{{data.*}}`, `{{data.<step>.<field>}}` (target), satu expression engine.
