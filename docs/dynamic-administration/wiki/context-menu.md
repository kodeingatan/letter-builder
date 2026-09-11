# Context Menu = Insert Dynamic Component

Saat user klik kanan pada editor:

```text
┌─────────────────────────────┐
│ Insert Component             │
│ Insert Dynamic Text          │
│ Insert Dynamic Image         │
│ Insert Table                 │
│ Insert Page Break            │
└─────────────────────────────┘
```

Jika memilih component:

```text
Component:
Identitas Pegawai
```

sistem membaca:

```text
Requirements:

nama
nip
jabatan
```

Kemudian meminta user menentukan sumber data.

## Spec v2 — Popup Requirement Component (mengikat)

Pada richtext component (toolbar dasar: inline/block styles, alignment, lists,
insert table/link/image, undo/redo), klik kanan pada content membuka popup:

1. **Input nama data** (nama requirement).
2. **Select tipe data view**: `text` | `image` | `component`.
   - `text` — teks dari nama data, dapat di-style toolbar.
   - `image` — gambar, dapat di-style toolbar, panjang/lebar dapat diatur.
   - `component` (🎯 target) — component pilihan; requirement component tersebut
     wajib dipenuhi dulu; tanpa batas depth + cycle alert (lihat [[administration-runtime]] §C).
3. Nilai requirement diisi dari Administrasi / Global Table / manual / expression / system.

## Related Concepts

- [[rich-text-template]] — editor di mana context menu muncul
- [[component]] — component yang diinsert
- [[data-requirement]] — requirement yang dibaca saat insert
- [[data-binding]] — user menentukan sumber data
- [[administration-runtime]] — tipe `component` nested + cycle alert
