# Konsep Utama — Dynamic Administration & Document Composition Platform

Aplikasi dibangun dengan konsep:

> **Data → Component → Template → Administration → Document**

atau secara keseluruhan:

```text
                    PLATFORM
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   GLOBAL TABLE    COMPONENT       TEMPLATE
        │              │              │
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
               ADMINISTRATION
                       │
                       ▼
                GENERATED DOCUMENT
                       │
                       ▼
                     PDF
```

Masing-masing bagian memiliki tanggung jawab berbeda.

Lihat juga: [[global-table]], [[component]], [[template]], [[administration]], [[overall-flow]]
