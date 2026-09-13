## Domain

### Entities
| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| Wireframe | Visual blueprint | id, halaman, file, status |
| Storybook Story | Component visualization | component, variants, tokens |
| Design Token | Visual specification | name, value, source |

### Relationships
```text
Design Token ──1:N── Storybook Story
Wireframe ──1:N── Halaman
```

### States
| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| Wireframe | draft → reviewed → approved | Visual blueprint | Step 1 → 5 |
| Story | baseline → refined → PASS | Token-synced | Step 2 |

### Domain Rules
- DR-01: Visual menggunakan #0075de (design-system.md)
- DR-02: Radius 6px (card), 4px (input), 8px (modal)
- DR-03: Font Inter

### Invariants
- INV-01: FASE 1 tidak ubah kode produksi
- INV-02: Artifact di tasks/08-persuratan-ui-refinement/

## API
Tidak ada API baru (FASE 1 UI only).

## UI

### Referensi Design
- docs/design-system.md — primary #0075de
- tasks/06-master-data-ddl/wireframes/
- tasks/07-template-administration/wireframes/
- stories/master-data/, stories/template-admin/

### Halaman
| Route | Halaman | Akses | Deskripsi |
|-------|---------|-------|-----------|
| — | Wireframe Doc Engine Tree | FASE 1 | SVG wireframe |
| — | Wireframe Doc Engine Preview | FASE 1 | SVG wireframe |
| — | Wireframe Doc Engine PDF | FASE 1 | SVG wireframe |
| — | Refined Stories | FASE 1 | Storybook refined |
