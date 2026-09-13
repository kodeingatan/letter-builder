## Domain

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| DocNode | Satu node JSON Tree (union type) | type, props, children, elseChildren |
| RenderContext | Data + scope loop saat render | data, scope{itemVar}, depth |
| PdfJob | Opsi halaman PDF | page_size, orientation |

### Relationships

```text
DocNode ──1:N── DocNode (children; condition juga punya elseChildren)
RenderContext ──1:N── DocNode (scope per level repeater)
```

### States

| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| N/A | — | Stateless render, tanpa persistence di task ini | — |

### Domain Rules

- DR-001: Repeater variabel `item` tidak boleh menimpa `data` root; shadowing hanya di subtree.
- DR-002: `component-ref` maksimal 1 level; siklus (A→A) ditolak 400.
- DR-003: Semua URL gambar harus `https://`, `/api/storage/`, atau `data:image/`; selain itu dibuang.

### Invariants

- INV-001: Output renderer selalu string HTML lengkap (`<div class="doc-page">…`), tidak pernah `undefined`.
- INV-002: Input tree tidak dimutasi renderer (pure).

### Data Model

Tidak ada tabel baru. Artefak kode:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | enum string | Y | Salah satu dari 16 type node |
| props | record | Y | Per-type (content/src/source/item/field/operator/value/…) |
| children | DocNode[] | N | Anak; wajib untuk document/repeater/condition/header/content/section/footer |
| elseChildren | DocNode[] | N | Hanya condition |

## API

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/documents/preview` | POST | JWT | preview | Render HTML tanpa simpan | Step 1–3 |
| 2 | `/api/documents/pdf` | POST | JWT | pdf | Render + Puppeteer → `{url}` | Step 4 |
| 3 | `/api/storage/documents/:filename` | GET | Public | — | Serve PDF (whitelist `documents`) | Step 5 |

- **Request preview/pdf**: `{ schema_json: DocNode, data: Record<string,unknown>, page?: {size:'A4'|'F4'|'Letter', orientation:'portrait'|'landscape'} }`.
- **Response preview**: `{ html: string, warnings: string[] }`. **PDF**: `{ url: '/api/storage/documents/<ts>-<rand>.pdf' }`.
- **Validation (Zod)**: `DocNodeSchema` rekursif (`z.lazy`), depth check manual, `data` max 2MB.
- **Error**: 400 schema invalid / 401 / 403 / 500 PDF gagal.
- **Auth**: `requireAuth` + `requireApiAccess` (method+URL via `permission-matrix` baru).
- Query pagination: N/A (POST body).

## UI

### Referensi Design

- N/A — backend only (tidak ada FASE 1 terpisah; sesuai permintaan user 3 folder). Konsumen UI ada di Task 07.

### Halaman

| Route | Halaman | Akses | Deskripsi |
|-------|---------|-------|-----------|
| N/A | — | — | Tidak ada halaman di task ini |

Alasan di Assumptions: engine diverifikasi via API test + Vitest, bukan Storybook.
