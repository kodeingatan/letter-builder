# Konsep Final yang Paling Sederhana

Kalau seluruh aplikasi harus dijelaskan kepada developer hanya dengan **satu diagram**, saya akan menggunakan ini:

```text
                         ┌───────────────────┐
                         │    GLOBAL TABLE   │
                         │                   │
                         │ Data Definition   │
                         │ Columns           │
                         │ Relations         │
                         │ Computed Fields   │
                         └─────────┬─────────┘
                                   │
                                   │ DATA
                                   ▼
                         ┌───────────────────┐
                         │    COMPONENT      │
                         │                   │
                         │ Reusable Content  │
                         │ Data Requirement  │
                         │ Single / Loop     │
                         └─────────┬─────────┘
                                   │
                                   │ COMPOSE
                                   ▼
                         ┌───────────────────┐
                         │     TEMPLATE      │
                         │                   │
                         │ RichText          │
                         │ Component         │
                         │ Binding           │
                         │ Loop               │
                         │ Condition         │
                         └─────────┬─────────┘
                                   │
                                   │ USED BY
                                   ▼
                         ┌───────────────────┐
                         │  ADMINISTRATION   │
                         │                   │
                         │ Workflow          │
                         │ Step 1            │
                         │ Step 2            │
                         │ Step 3            │
                         │ Data Completion   │
                         └─────────┬─────────┘
                                   │
                                   │ GENERATE
                                   ▼
                         ┌───────────────────┐
                         │     DOCUMENT      │
                         │                   │
                         │ Data Snapshot     │
                         │ Rendered Content  │
                         │ PDF               │
                         └───────────────────┘
```

## Related Concepts

- [[konsep-utama]]
- [[global-table]]
- [[component]]
- [[template]]
- [[administration]]
- [[rendering-engine]]
- [[architecture-principles]]
- [[core-object-model]]
