# Satu Bahasa Data untuk Seluruh Sistem

Agar sistem tidak menjadi rumit, gunakan satu konsep data reference.

Misalnya:

```text
{{data.nama}}
{{data.pegawai.nama}}
{{data.pegawai.nip}}
```

Untuk collection:

```text
{{data.pegawai}}
```

Untuk expression:

```text
{{data.harga * data.jumlah}}
```

Untuk component:

```text
{{component.identitas_pegawai}}
```

Dengan demikian seluruh sistem menggunakan prinsip yang sama:

```text
Global Table
     ↓
Data Context
     ↓
Expression Engine
     ↓
Component
     ↓
Template
     ↓
Renderer
```

## Related Concepts

- [[expression-engine]] — engine untuk evaluasi ekspresi
- [[data-binding]] — binding menggunakan bahasa data yang sama
- [[global-table]] — data berasal dari global table
- [[component]] — component menggunakan data reference
- [[template]] — template menggunakan data reference
