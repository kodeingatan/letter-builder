# Multi Relation

Untuk:

```text
select table relation multiple
```

hasilnya bukan satu relation:

```text
pegawai → department
```

tetapi collection:

```text
pegawai → departments[]
```

Contoh:

```text
☑ Teknologi Informasi
☑ Keuangan
☐ Kepegawaian
```

Kemudian data disimpan sebagai relationship collection.

## Related Concepts

- [[relation-data-provider]] — single relation
- [[global-table]] — multi relation adalah bagian dari global table
- [[column-type]] — select-table-relation-multiple sebagai column type
