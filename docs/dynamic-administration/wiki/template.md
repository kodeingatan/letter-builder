# Template Persuratan = Document Composition

Template adalah:

> **Blueprint sebuah dokumen.**

Template tidak menyimpan data surat tertentu.

Template hanya menentukan:

```text
dokumen terdiri dari apa
```

Contoh:

```text
Template Surat Keputusan

┌──────────────────────────┐
│ Kop Surat                │
├──────────────────────────┤
│ Judul                    │
│ Pembukaan                │
│ Menimbang                │
│ Mengingat                │
│ Component Pegawai        │
│ Ketetapan                │
│ Penutup                  │
│ Tanda Tangan             │
└──────────────────────────┘
```

Template terdiri dari:

```text
Template
   │
   ├── Name + Description
   │
   ├── Static Content
   │
   ├── Components
   │
   ├── Data Binding
   │
   ├── Conditions
   │
   └── Looping
```

## Spec v2 — Template Administrasi (mengikat)

- **C.1 nama** + **C.2 description** template (keduanya implemented di entity).
- Editor richtext toolbar dasar + klik kanan: pilih component (C.3.1),
  penuhi requirement-nya (C.3.2) dari data administrasi / tabel / manual (C.3.3),
  bila looping pilih tabel + rows + tombol pilih-semua (C.3.4).
- **C.4 Form generated** hasil binding (tab binding + preview + unbound guard).
- **C.5 Preview surat PDF** via `POST /api/render/preview` dan issuance engine.

## Related Concepts

- [[component]] — template menggunakan component
- [[data-binding]] — binding data ke component
- [[rich-text-template]] — editor untuk menyusun template
- [[context-menu]] — insert dynamic component
- [[template-component-loop]] — kombinasi template + component + loop
- [[administration]] — administration menggunakan template
- [[core-concept]] — posisi template dalam keseluruhan sistem
