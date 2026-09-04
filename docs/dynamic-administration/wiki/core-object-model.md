# Core Object Model

Jika diringkas menjadi objek:

```text
GLOBAL TABLE
    │
    └── COLUMN

COMPONENT
    │
    └── DATA REQUIREMENT

TEMPLATE
    │
    ├── CONTENT
    ├── COMPONENT
    ├── BINDING
    ├── LOOP
    └── CONDITION

ADMINISTRATION
    │
    └── STEP
          │
          ├── TEMPLATE
          └── DATA

DOCUMENT
    │
    ├── DATA SNAPSHOT
    ├── TEMPLATE VERSION
    └── RENDERED OUTPUT
```

## Related Concepts

- [[global-table]] — data engine
- [[component]] — reusable document block
- [[template]] — blueprint dokumen
- [[administration]] — workflow dokumen
- [[konsep-utama]]
