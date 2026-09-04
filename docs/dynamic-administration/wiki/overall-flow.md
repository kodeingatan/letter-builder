# Alur Keseluruhan

Ini adalah core flow aplikasi:

```text
                    GLOBAL TABLE
                         │
                         │ menyediakan data
                         ▼
                  DATA AVAILABLE
                         │
                         │
                         ▼
                    COMPONENT
                         │
                membutuhkan data
                         │
                         ▼
                 DATA REQUIREMENT
                         │
                         │ digunakan oleh
                         ▼
                     TEMPLATE
                         │
                  disusun menjadi
                         │
                         ▼
                    DOCUMENT
                         │
                         │ digunakan oleh
                         ▼
                 ADMINISTRATION
                         │
                     memiliki
                         │
                         ▼
                      STEPS
                         │
                  mengumpulkan data
                         │
                         ▼
                  DATA COMPLETION
                         │
                         ▼
                  RENDER ENGINE
                         │
                 ┌───────┴────────┐
                 ▼                ▼
               HTML              PDF
```

## Related Concepts

- [[global-table]] — fondasi data
- [[component]] — reusable document block
- [[template]] — blueprint dokumen
- [[administration]] — workflow dokumen
- [[rendering-engine]] — engine untuk render dokumen
- [[runtime-flow]] — flow runtime saat user membuat surat
- [[konsep-utama]]
