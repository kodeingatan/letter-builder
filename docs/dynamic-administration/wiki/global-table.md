# Global Table = Data Engine

**Global Table** adalah fondasi penyimpanan data dinamis.

Tujuannya:

> User dapat membuat struktur tabel tanpa developer membuat migration/entity/controller/service baru secara manual.

Contoh user membuat:

```text
Pegawai
```

dengan columns:

```text
nama
nip
jabatan
pangkat
tanggal_lahir
foto
status
```

Sistem kemudian menyediakan CRUD secara otomatis berdasarkan definisi tersebut.

Jadi:

```text
Global Table Definition
        │
        ├── Table Name
        ├── Display Name
        │
        └── Columns
              ├── Name
              ├── Display Name
              ├── Type
              ├── Default Value
              ├── Required
              ├── Searchable
              └── Orderable
```

Global Table bukan sekadar tabel database.

Ia adalah:

> **Metadata yang mendefinisikan struktur, behavior, dan UI sebuah data table.**

## Related Concepts

- [[column-type]] — tipe data menentukan behavior input/display
- [[computed-field]] — field hasil kalkulasi
- [[expression-engine]] — engine untuk evaluasi ekspresi
- [[crud-generated-table]] — CRUD behavior yang dihasilkan otomatis
- [[relation-data-provider]] — relasi antar tabel
- [[generated-menu]] — menu yang dihasilkan dari metadata
- [[konsep-utama]]
