# Relation sebagai Data Provider

`select table relation` sebaiknya dianggap sebagai:

> **Relationship Data Provider**

Contoh:

```text
Pegawai
   │
   └── department_id
             │
             ▼
        Department
```

Selector mengambil:

```text
Department
├── code
├── name
└── description
```

Tetapi user dapat menentukan:

```text
Display:
☑ code
☑ name

Value:
id
```

Hasil:

```text
001 - Teknologi Informasi
002 - Keuangan
003 - Kepegawaian
```

## Related Concepts

- [[global-table]] — relation adalah bagian dari global table
- [[multi-relation]] — multiple relation
- [[column-type]] — select-table-relation sebagai column type
- [[data-binding]] — relation sebagai sumber data binding
