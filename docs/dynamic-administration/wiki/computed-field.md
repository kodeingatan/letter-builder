# Operation Column = Computed Field

`hidden-operation-text` dan `readonly-operation-text` sebaiknya dianggap sebagai:

> **Computed Field**

bukan sekadar input type.

Misalnya:

```text
harga × jumlah
```

menghasilkan:

```text
20000 × 3 = 60000
```

Atau:

```text
nama + " - " + jabatan
```

menghasilkan:

```text
Afdal - Programmer
```

Maka konsepnya:

```text
Computed Field
       │
       ├── Expression
       │
       ├── Dependencies
       │
       └── Result
```

### Perbedaan

**Hidden Computed**

```text
Data → dihitung → disimpan
```

tetapi input tidak ditampilkan.

**Readonly Computed**

```text
Data → dihitung → ditampilkan
```

tetapi user tidak dapat mengubah hasilnya.

## Related Concepts

- [[column-type]] — type menentukan behavior
- [[expression-engine]] — engine untuk evaluasi ekspresi
- [[global-table]] — computed field adalah bagian dari column definition
