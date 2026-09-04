# Data Binding

Setiap kebutuhan component harus memiliki binding.

Misalnya component membutuhkan:

```text
nama
nip
jabatan
```

Template memberikan:

```text
nama
   ↓
Administrasi.nama

nip
   ↓
Pegawai.nip

jabatan
   ↓
Pegawai.jabatan
```

Sumber data dapat berasal dari:

```text
1. Administration Data
2. Global Table
3. Manual Input
4. Expression
5. System Data
```

Contoh:

```text
{{current_date}}
{{user.name}}
{{administration.nama}}
{{pegawai.nip}}
```

## Related Concepts

- [[component]] — component memiliki data requirement
- [[data-requirement]] — requirement yang harus di-bind
- [[template]] — template menentukan binding
- [[expression-engine]] — expression dapat digunakan sebagai binding
- [[unified-data-language]] — satu bahasa data untuk binding
- [[global-table]] — data dari global table sebagai sumber binding
