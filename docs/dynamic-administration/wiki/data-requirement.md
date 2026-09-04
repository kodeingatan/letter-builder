# Data Requirement = Contract

Setiap component memiliki **data requirement**.

Contoh:

```text
Component:
Surat Pernyataan

Requirements:

nama           → text
nip            → text
jabatan        → text
tanggal        → date
foto           → image
```

Ini dapat dianggap sebagai:

> **Contract antara Component dan Template.**

Component berkata:

```text
Saya membutuhkan:
nama
nip
jabatan
```

Template harus menjawab:

```text
nama      → Administrasi.nama
nip       → Pegawai.nip
jabatan   → Pegawai.jabatan
```

atau:

```text
nama → input manual
```

atau:

```text
nama → expression
```

## Related Concepts

- [[component]] — component memiliki data requirement
- [[template]] — template menyediakan data binding
- [[data-binding]] — mekanisme binding data ke component
- [[expression-engine]] — expression dapat digunakan sebagai sumber data
