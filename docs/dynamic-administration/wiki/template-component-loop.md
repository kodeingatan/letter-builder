# Template + Component + Loop

Inilah kombinasi paling penting.

Misalnya:

```text
Template Surat Tugas
```

berisi:

```text
Dengan ini menugaskan:

[ Component: Daftar Pegawai ]
```

Component:

```text
is_looping = true
```

Requirement:

```text
nama
nip
jabatan
```

Template menentukan:

```text
Source:
Global Table → Pegawai

Rows:
☑ Afdal
☑ Budi
☑ Citra
```

Renderer:

```text
for each selected employee:

    render Component
```

Output:

```text
1. Afdal
   NIP: 123
   Jabatan: Programmer

2. Budi
   NIP: 456
   Jabatan: Analis

3. Citra
   NIP: 789
   Jabatan: Staff
```

## Related Concepts

- [[template]] — template adalah blueprint dokumen
- [[component]] — component di-loop oleh template
- [[component-looping]] — component mode collection
- [[data-binding]] — binding data untuk setiap item
- [[global-table]] — source data dari global table
