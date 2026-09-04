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

## Related Concepts

- [[component]] — template menggunakan component
- [[data-binding]] — binding data ke component
- [[rich-text-template]] — editor untuk menyusun template
- [[context-menu]] — insert dynamic component
- [[template-component-loop]] — kombinasi template + component + loop
- [[administration]] — administration menggunakan template
