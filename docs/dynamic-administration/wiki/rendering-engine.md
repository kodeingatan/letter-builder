# Rendering Engine

Semua dokumen akhirnya diproses oleh satu engine:

```text
             RENDER ENGINE
                  │
        ┌─────────┼──────────┐
        ▼         ▼          ▼
      Data     Component   Template
        │         │          │
        └─────────┼──────────┘
                  ▼
            Resolve Tree
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Binding    Loop    Condition
        │         │         │
        └─────────┼─────────┘
                  ▼
              HTML DOM
                  │
                  ▼
                 PDF
```

Engine harus mengetahui cara menangani:

```text
Text
Image
RichText
Component
Loop
Condition
Table
Page Break
Data Binding
Expression
```

## Related Concepts

- [[template]] — template di-render oleh engine
- [[component]] — component di-resolve oleh engine
- [[data-binding]] — binding di-resolve oleh engine
- [[expression-engine]] — expression dievaluasi oleh engine
- [[runtime-flow]] — flow rendering saat user membuat surat
- [[overall-flow]] — alur keseluruhan sistem
