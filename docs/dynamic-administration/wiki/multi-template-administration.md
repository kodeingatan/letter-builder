# Administration Tidak Harus Memiliki Template Tunggal

Satu Administration dapat terdiri dari beberapa Template.

Contoh:

```text
Administration
Surat Perjalanan Dinas
│
├── Step 1
│   └── Template: Surat Tugas
│
├── Step 2
│   └── Template: Surat Perjalanan Dinas
│
├── Step 3
│   └── Template: Rincian Biaya
│
└── Step 4
    └── Template: Laporan Perjalanan
```

Jadi:

> **Administration adalah workflow dokumen.**

Sedangkan:

> **Template adalah blueprint dokumen pada suatu step.**

## Related Concepts

- [[administration]] — administration menggunakan template
- [[template]] — template adalah blueprint dokumen
- [[step]] — step adalah tahap pengumpulan data
