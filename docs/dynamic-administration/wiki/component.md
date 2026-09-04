# Component Persuratan = Reusable Document Block

Component adalah:

> **Potongan dokumen yang dapat digunakan berulang kali.**

Contoh:

```text
Kop Surat
```

```text
Identitas Pegawai
```

```text
Paragraf Menimbang
```

```text
Tabel Daftar Pegawai
```

```text
Tanda Tangan
```

```text
Footer
```

Component memiliki:

```text
Component
│
├── Name
├── Looping
├── Content
├── Data Requirements
└── Preview
```

## Component Bukan Data

Ini prinsip yang sangat penting.

Component **tidak memiliki data final**.

Component hanya mengatakan:

```text
Saya membutuhkan:

nama
nip
jabatan
```

Kemudian Template yang memberikan sumber datanya.

Jadi:

```text
Component
    │
    │ requires
    ▼
Data Requirement
    │
    │ supplied by
    ▼
Template
```

Dengan demikian component bisa digunakan berkali-kali.

## Related Concepts

- [[data-requirement]] — contract antara component dan template
- [[component-looping]] — component mode single vs collection
- [[template]] — template menyediakan data untuk component
- [[data-binding]] — binding data ke component
- [[konsep-utama]]
