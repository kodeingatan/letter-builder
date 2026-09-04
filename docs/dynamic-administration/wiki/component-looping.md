# Component Looping = Collection Component

Component looping bukan hanya "component yang diulang".

Konsep yang lebih tepat:

> **Component memiliki mode Single atau Collection.**

### Single

```text
Component
    ↓
1 data
    ↓
1 output
```

### Collection

```text
Component
    ↓
Collection
    ↓
┌──────────────┐
│ item 1       │
├──────────────┤
│ item 2       │
├──────────────┤
│ item 3       │
└──────────────┘
```

Contoh component:

```text
Daftar Pegawai
```

Requirements:

```text
nama
nip
jabatan
```

Template memilih:

```text
Table: Pegawai
```

Kemudian:

```text
Selected rows:
☑ Afdal
☑ Budi
☐ Citra
☑ Dedi
```

Engine menghasilkan:

```text
Afdal
Budi
Dedi
```

## Related Concepts

- [[component]] — component memiliki mode single/collection
- [[template]] — template menentukan source data untuk looping
- [[template-component-loop]] — kombinasi template + component + loop
- [[data-requirement]] — requirement yang sama untuk setiap item
