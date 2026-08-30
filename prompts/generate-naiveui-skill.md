# Reusable Prompt — Generate OpenCode Skill from Official Documentation

## Objective

Buat sebuah **OpenCode Skill** berdasarkan dokumentasi resmi suatu teknologi.

Pelajari seluruh dokumentasi yang diberikan, rangkum menjadi best practices, lalu ubah hasil pembelajaran tersebut menjadi sebuah OpenCode Skill yang dapat digunakan kembali pada project lain.

JANGAN membuat implementasi kode aplikasi terlebih dahulu.

---

## Variables

```text
SKILL_NAME="naiveiu-base-practices"

TECHNOLOGY=naiveui

PROJECT_STACK=Nuxt

REFERENCE_SKILL=.opencode/skills/crawlee-scraper-skill

DOCUMENTATION_URLS={{
- https://www.naiveui.com/en-US/os-theme/docs/introduction
- https://www.naiveui.com/en-US/os-theme/components/button
}}
```

---

## Reference

Gunakan struktur penulisan Skill sesuai referensi berikut:

https://opencode.ai/docs/skills/

Pelajari juga style dan pola penulisan dari skill berikut sebagai acuan:

```
{{REFERENCE_SKILL}}
```

Ikuti struktur, gaya dokumentasi, serta filosofi penulisannya.

---

## Learning Process

Pelajari SELURUH halaman dokumentasi yang diberikan.

Apabila halaman memiliki navigasi menuju halaman lain yang masih termasuk dokumentasi resmi dan relevan terhadap teknologi tersebut, lanjutkan mempelajari halaman-halaman tersebut hingga memperoleh pemahaman yang lengkap.

Prioritaskan:

- Official Documentation
- Getting Started
- Installation
- Configuration
- Core Concepts
- Folder Structure
- Guides
- Tutorials
- Components / Modules / Packages
- API Reference
- Integrations
- Ecosystem
- Examples
- Common Patterns
- Recommended Conventions
- Best Practices
- Performance
- Accessibility
- Production Recommendations
- Advanced Topics
- Migration Guide (jika relevan)
- Common Mistakes
- Anti-Patterns
- FAQ
- Changelog (jika relevan)

Jangan mengambil referensi dari blog pihak ketiga kecuali dokumentasi resmi merujuk ke sana.

---

## Adaptation

Seluruh hasil pembelajaran HARUS disesuaikan dengan teknologi berikut:

```
{{PROJECT_STACK}}
```

## Expected Output

Buat sebuah folder:

```
.opencode/skills/{{SKILL_NAME}}
```

Berisi:

```
.opencode/skills/{{SKILL_NAME}}/
│
├── SKILL.md
└── references/
```

---

### references/

Folder ini berisi seluruh hasil pembelajaran.

Pisahkan menjadi beberapa file markdown berdasarkan topik.

Contoh:

```text
references/
├── official-documentation.md
├── getting-started.md
├── installation.md
├── configuration.md
├── concepts.md
├── folder-structure.md
├── guides.md
├── tutorials.md
├── components.md
├── api-reference.md
├── integrations.md
├── ecosystem.md
├── examples.md
├── common-patterns.md
├── recommended-conventions.md
├── best-practices.md
├── performance.md
├── accessibility.md
├── production-recommendations.md
├── advanced-topics.md
├── migration-guide.md          # Opsional
├── common-mistakes.md
├── anti-patterns.md
├── faq.md
└── changelog.md                # Opsional
```

Setiap file harus:

- memiliki heading yang jelas
- menjelaskan alasan di balik setiap best practice
- merangkum dokumentasi resmi
- tidak sekadar menyalin isi dokumentasi
- mudah dipahami AI maupun developer

---

### SKILL.md

SKILL.md merupakan panduan yang akan dipakai OpenCode ketika menggunakan skill.

Isi harus mencakup:

- tujuan skill
- kapan skill digunakan
- kapan skill tidak digunakan
- workflow penggunaan
- aturan implementasi
- checklist sebelum implementasi
- checklist sesudah implementasi
- best practices
- conventions
- anti-patterns
- hal yang wajib dihindari
- referensi internal ke folder references
- instruksi bagi AI untuk selalu mengikuti best practices yang telah dipelajari

SKILL.md harus ringkas, operasional, dan berfungsi sebagai "aturan kerja", sedangkan penjelasan detail disimpan pada folder references.

---

## Writing Style

Gunakan:

- Markdown
- Bahasa Indonesia
- Struktur yang konsisten
- Mudah dipindai
- Banyak heading
- Bullet list
- Checklist
- Tabel jika diperlukan

Jangan membuat paragraf panjang.

---

## Constraints

JANGAN:

- membuat source code aplikasi
- membuat komponen
- membuat project
- membuat contoh implementasi lengkap
- membuat tutorial langkah demi langkah

Fokus hanya pada:

- mempelajari dokumentasi
- menyusun knowledge base
- menyusun best practices
- menyusun reusable OpenCode Skill

---

## Success Criteria

Skill dianggap selesai apabila:

- seluruh dokumentasi resmi telah dipelajari
- seluruh rekomendasi penting telah dirangkum
- seluruh best practices telah disesuaikan dengan {{PROJECT_STACK}}
- tersedia folder references yang lengkap
- tersedia SKILL.md yang siap digunakan oleh OpenCode
- skill dapat digunakan ulang pada project lain hanya dengan mengganti nilai variabel pada bagian Variables
