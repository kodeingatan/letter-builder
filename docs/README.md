# Docs — Index

Dokumentasi permanen (single-source-of-truth). Scope: RBAC-Only setelah Task 01.

| Dokumen | Isi | Baca saat |
|---------|-----|-----------|
| `PRD.md` | Requirements produk (§1–§23 penomoran tunggal): visi, goals, roles, workflows, fitur (§17), auth flow (§18), ringkasan API (§19), routes (§20), NFR (§21), seed (§22), client auth (§23) | Butuh sudut pandang **produk** (apa & mengapa) |
| `architecture.md` | Arsitektur teknis: layer stack, struktur proyek, conventions, routing, API endpoints (DTO/query/response), RBAC system, ERD, tech stack, DataTable/PageShell | Butuh sudut pandang **teknis** (bagaimana) |
| `database.md` | Skema DB: 9 EntitySchemas / 12 tabel, ERD, detail entitas, seed data eksak, relasi | Butuh detail **data** |
| `design-system.md` | Token + pola UI: warna, tipografi, spacing, radius, DataTable, PageShell, sidebar, responsif, ikon, animasi, auth UI, profile | Butuh **tampilan / komponen** |
| `production-runbook.md` | Operasi produksi: boot, migrasi, health, backup, roles, audit, limits | **Deploy / operasi** |

## Aturan anti-drift

* PRD = ringkasan produk, architecture/database/design-system = detail teknis. Keduanya dihubungkan cross-reference dua arah (PRD §17.6, §18, §19, §20, §22, §23 ↔ architecture § Routing, API Endpoints, RBAC System).
* Seed data: sumber kebenaran `apps/web/server/services/seeder.service.ts`; salinan di PRD §22 dan database.md § Seed Data harus sama.
* Token desain: sumber inspirasi Notion (`DESIGN-notion.md` dihapus pasca-adopsi — riwayat di git); kodenya `apps/web/app/utils/naiveui-theme.ts`.
* Ubah satu sisi → cek sisi pasangannya.
