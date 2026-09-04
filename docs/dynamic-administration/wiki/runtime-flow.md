# Runtime Flow

Ketika user membuat surat:

```text
User
 │
 ▼
Pilih Administration
 │
 ▼
Step 1
 │
 ├── isi data
 │
 ▼
Step 2
 │
 ├── pilih template
 │
 ├── pilih data
 │
 ▼
Step 3
 │
 ├── isi data
 │
 ▼
Complete
 │
 ▼
Resolve Data
 │
 ▼
Resolve Component
 │
 ▼
Resolve Binding
 │
 ▼
Resolve Loop
 │
 ▼
Resolve Condition
 │
 ▼
Render Document
 │
 ▼
PDF
```

## Related Concepts

- [[administration]] — user memilih administration
- [[step]] — step-step dalam administration
- [[rendering-engine]] — engine untuk render dokumen
- [[overall-flow]] — alur keseluruhan sistem
