# Prinsip Arsitektur yang Harus Dijaga

Agar sistem tidak menjadi sulit dikembangkan, gunakan prinsip berikut:

### 1. Metadata-driven

Jangan hard-code:

```text
Pegawai
Surat Tugas
Surat Keputusan
```

Tetapi definisikan melalui metadata.

### 2. Component-driven

Semua bagian dokumen yang dapat digunakan kembali harus menjadi component.

### 3. Template-driven

Template hanya menentukan **struktur dokumen**.

### 4. Data-driven

Data berasal dari:

```text
Global Table
Administration
Manual Input
System Data
```

### 5. Schema-driven

UI form dibuat berdasarkan schema.

```text
Column Definition
       ↓
Form Renderer
       ↓
Input
```

### 6. Renderer-driven

Jangan membuat PDF secara khusus untuk setiap template.

Gunakan:

```text
Template
   ↓
Generic Renderer
   ↓
PDF
```

### 7. Versioned

Template dan Component sebaiknya memiliki version.

Misalnya:

```text
Surat Tugas
v1
v2
v3
```

Dokumen lama tetap menggunakan versi ketika dibuat.

## Related Concepts

- [[konsep-utama]] — konsep utama aplikasi
- [[global-table]] — metadata-driven data engine
- [[component]] — component-driven document blocks
- [[template]] — template-driven document structure
- [[rendering-engine]] — renderer-driven document rendering
- [[final-concept]] — ringkasan konsep
