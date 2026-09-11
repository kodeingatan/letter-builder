# Core Concept — Dynamic Administration & Document Composition Platform

## 1. Konsep Utama

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

---

# 2. Global Table = Data Engine

**Global Table** adalah fondasi penyimpanan data dinamis.

Tujuannya:

> User dapat membuat struktur tabel tanpa developer membuat migration/entity/controller/service baru secara manual.

Contoh user membuat:

```text
Pegawai
```

dengan columns:

```text
nama
nip
jabatan
pangkat
tanggal_lahir
foto
status
```

Sistem kemudian menyediakan CRUD secara otomatis berdasarkan definisi tersebut.

Jadi:

```text
Global Table Definition
        │
        ├── Table Name
        ├── Display Name
        │
        └── Columns
              ├── Name
              ├── Display Name
              ├── Type
              ├── Default Value
              ├── Required
              ├── Searchable
              └── Orderable
```

Global Table bukan sekadar tabel database.

Ia adalah:

> **Metadata yang mendefinisikan struktur, behavior, dan UI sebuah data table.**

---

# 3. Column Type = Behavior Data

Setiap column memiliki **type**.

Type bukan hanya menentukan jenis data, tetapi juga menentukan bagaimana data tersebut:

1. disimpan,
2. diinput,
3. ditampilkan,
4. divalidasi,
5. diformat,
6. dicari,
7. diurutkan.

Contoh:

```text
text
   ↓
Text Input
```

```text
richtext
   ↓
Rich Text Editor
```

```text
date
   ↓
Date Picker
   ↓
Format Display
```

```text
select
   ↓
Select
   ↓
Options
```

```text
select-table-relation
   ↓
Relation Selector
   ↓
Global Table
```

```text
number + currency
   ↓
Number Input
   ↓
Currency Formatter (IDR realtime saat mengetik)
```

v2 — tiga tipe baru (TARGET, keputusan K-01 2026-09-11):

```text
datetime
   ↓
Date+Time Picker
   ↓
Format Display (default m-d-Y H:i:s)
```

```text
time
   ↓
Time Picker
   ↓
Format Display (default H:i:s)
```

```text
select-multiple
   ↓
Multi Select
   ↓
Options {value, label} (tambah sesuai kebutuhan)
```

Dengan demikian:

```text
Column Type
    ↓
Data Behavior
    ↓
Input Component
    ↓
Display Component
    ↓
Validation
    ↓
Search / Order behavior
```

---

# 4. Operation Column = Computed Data

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

Contoh:

```text
Expression:

"hasil dari " ++ harga ++ " * " ++ jumlah
```

Engine:

```text
harga = 20000
jumlah = 3

        ↓

"hasil dari " ++ 20000 ++ " * " ++ 3

        ↓

"hasil dari 20000 * 3 = 60000"
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

---

# 5. Expression Engine

Karena operation akan digunakan di banyak tempat, sebaiknya dibuat satu konsep:

> **Expression Engine**

Engine ini menangani:

```text
+
-
*
/
++
"string"
```

dan nantinya bisa dikembangkan menjadi:

```text
IF
ELSE
ROUND
SUM
COUNT
MIN
MAX
DATE_FORMAT
CONCAT
```

Contoh:

```text
{{harga}} * {{jumlah}}
```

atau:

```text
{{nama}} ++ " - " ++ {{jabatan}}
```

Dengan begitu expression tidak hanya digunakan Global Table.

Nantinya bisa digunakan juga oleh:

* Component
* Template
* Conditional rendering
* Computed field
* Document generation

Ini akan membuat sistem jauh lebih konsisten.

---

# 6. Component Persuratan = Reusable Document Block

Component adalah:

> **Potongan dokumen yang dapat digunakan berulang kali.**

Contoh:

```text
Kop Surat
```

```text
Identitas Pegawai
```

```text
Paragraf Menimbang
```

```text
Tabel Daftar Pegawai
```

```text
Tanda Tangan
```

```text
Footer
```

Component memiliki:

```text
Component
│
├── Name
├── Looping
├── Content
├── Data Requirements
└── Preview
```

Contoh:

```text
Component: Identitas Pegawai

Requires:
- nama
- nip
- jabatan
```

Content:

```text
Nama     : {{nama}}
NIP      : {{nip}}
Jabatan  : {{jabatan}}
```

---

# 7. Component Bukan Data

Ini prinsip yang sangat penting.

Component **tidak memiliki data final**.

Component hanya mengatakan:

```text
Saya membutuhkan:

nama
nip
jabatan
```

Kemudian Template yang memberikan sumber datanya.

Jadi:

```text
Component
    │
    │ requires
    ▼
Data Requirement
    │
    │ supplied by
    ▼
Template
```

Dengan demikian component bisa digunakan berkali-kali.

---

# 8. Data Requirement = Contract

Setiap component memiliki **data requirement**.

Contoh:

```text
Component:
Surat Pernyataan

Requirements:

nama           → text
nip            → text
jabatan        → text
tanggal        → date
foto           → image
```

Ini dapat dianggap sebagai:

> **Contract antara Component dan Template.**

Component berkata:

```text
Saya membutuhkan:
nama
nip
jabatan
```

Template harus menjawab:

```text
nama      → Administrasi.nama
nip       → Pegawai.nip
jabatan   → Pegawai.jabatan
```

atau:

```text
nama → input manual
```

atau:

```text
nama → expression
```

---

# 9. Component Looping = Collection Component

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

---

# 10. Template Persuratan = Document Composition

Template adalah:

> **Blueprint sebuah dokumen.**

Template tidak menyimpan data surat tertentu.

Template hanya menentukan:

```text
dokumen terdiri dari apa
```

Contoh:

```text
Template Surat Keputusan

┌──────────────────────────┐
│ Kop Surat                │
├──────────────────────────┤
│ Judul                    │
│ Pembukaan                │
│ Menimbang                │
│ Mengingat                │
│ Component Pegawai        │
│ Ketetapan                │
│ Penutup                  │
│ Tanda Tangan             │
└──────────────────────────┘
```

Template terdiri dari:

```text
Template
   │
   ├── Static Content
   │
   ├── Components
   │
   ├── Data Binding
   │
   ├── Conditions
   │
   └── Looping
```

---

# 11. Rich Text Template = Composition Canvas

Editor template adalah tempat user menyusun dokumen.

Misalnya:

```text
Dengan ini menerangkan bahwa:

[ COMPONENT: Identitas Pegawai ]

Yang bersangkutan telah melaksanakan:

[ COMPONENT: Daftar Kegiatan ]

Demikian surat ini dibuat.

[ COMPONENT: Tanda Tangan ]
```

Jadi editor bukan sekadar richtext editor.

Ia sebenarnya adalah:

> **Document Composition Canvas**

yang dapat berisi:

```text
Text
Image
Table
Component
Dynamic Data
Loop
Condition
Page Break
```

---

# 12. Context Menu = Insert Dynamic Component

Saat user klik kanan pada editor:

```text
┌─────────────────────────────┐
│ Insert Component             │
│ Insert Dynamic Text          │
│ Insert Dynamic Image         │
│ Insert Table                 │
│ Insert Page Break            │
└─────────────────────────────┘
```

Jika memilih component:

```text
Component:
Identitas Pegawai
```

sistem membaca:

```text
Requirements:

nama
nip
jabatan
```

Kemudian meminta user menentukan sumber data.

---

# 13. Data Binding

Setiap kebutuhan component harus memiliki binding.

Misalnya component membutuhkan:

```text
nama
nip
jabatan
```

Template memberikan:

```text
nama
   ↓
Administrasi.nama

nip
   ↓
Pegawai.nip

jabatan
   ↓
Pegawai.jabatan
```

Sumber data dapat berasal dari:

```text
1. Administration Data
2. Global Table
3. Manual Input
4. Expression
5. System Data
```

Contoh:

```text
{{current_date}}
{{user.name}}
{{administration.nama}}
{{pegawai.nip}}
```

---

# 14. Administration = Data Collection Process

Ini bagian yang perlu dibedakan dari Template.

**Template menjelaskan bentuk dokumen.**

Sedangkan **Administration menjelaskan proses pengisian data untuk menghasilkan dokumen.**

Contoh:

```text
Administration:
Surat Keputusan Pengangkatan
```

Administration memiliki:

```text
Step 1
Data dasar surat

Step 2
Data pegawai

Step 3
Data keputusan

Step 4
Preview
```

---

# 15. Step = Data Gathering Session

Step merupakan:

> **Satu tahap pengumpulan data.**

Contoh:

```text
Step 1
Informasi Surat

- nomor surat
- tanggal
- perihal

Step 2
Informasi Pegawai

- nama
- NIP
- jabatan

Step 3
Informasi Keputusan

- dasar keputusan
- tanggal berlaku
```

Step dapat dibuat sebanyak yang diperlukan.

---

# 16. Administration Tidak Harus Memiliki Template Tunggal

Ini konsep yang sangat bagus dari kebutuhan Anda.

Satu Administration dapat terdiri dari beberapa Template.

Contoh:

```text
Administration
Surat Perjalanan Dinas
│
├── Step 1
│   └── Template: Surat Tugas
│
├── Step 2
│   └── Template: Surat Perjalanan Dinas
│
├── Step 3
│   └── Template: Rincian Biaya
│
└── Step 4
    └── Template: Laporan Perjalanan
```

Jadi:

> **Administration adalah workflow dokumen.**

Sedangkan:

> **Template adalah blueprint dokumen pada suatu step.**

---

# 17. Alur Keseluruhan

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

---

# 18. Runtime Flow

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

---

# 19. Rendering Engine

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

---

# 20. Satu Bahasa Data untuk Seluruh Sistem

Agar sistem tidak menjadi rumit, gunakan satu konsep data reference.

Misalnya:

```text
{{data.nama}}
{{data.pegawai.nama}}
{{data.pegawai.nip}}
```

Untuk collection:

```text
{{data.pegawai}}
```

Untuk expression:

```text
{{data.harga * data.jumlah}}
```

Untuk component:

```text
{{component.identitas_pegawai}}
```

Dengan demikian seluruh sistem menggunakan prinsip yang sama:

```text
Global Table
     ↓
Data Context
     ↓
Expression Engine
     ↓
Component
     ↓
Template
     ↓
Renderer
```

---

# 21. Generated Menu

Menu tidak dibuat manual satu per satu.

Ketika Global Table dibuat:

```text
Global Table:
Pegawai
```

sistem dapat menghasilkan:

```text
Data
 └── Pegawai
```

Ketika Administration dibuat:

```text
Administration:
Surat Keputusan
```

sistem menghasilkan:

```text
Persuratan
 └── Surat Keputusan
```

Jadi menu merupakan:

> **Projection dari metadata yang sudah dibuat user.**

Bukan hard-coded menu.

---

# 22. CRUD Generated Table

Global Table secara otomatis menghasilkan behavior:

```text
Browse
   │
   ├── Search
   ├── Column visibility
   ├── Sorting
   └── Pagination

Create
   │
   └── Generate form dari Column Definition

Edit
   │
   └── Generate form dari Column Definition

Delete
```

Misalnya column:

```text
name = "tanggal_lahir"
type = "date"
format = "m-d-Y"
required = true
searchable = true
orderable = true
```

UI otomatis mengetahui:

```text
Input     → Date Picker
Display   → 08-30-2026
Required  → Yes
Search    → Enabled
Sort      → Enabled
```

---

# 23. Relation sebagai Data Provider

`select table relation` sebaiknya dianggap sebagai:

> **Relationship Data Provider**

Contoh:

```text
Pegawai
   │
   └── department_id
             │
             ▼
        Department
```

Selector mengambil:

```text
Department
├── code
├── name
└── description
```

Tetapi user dapat menentukan:

```text
Display:
☑ code
☑ name

Value:
id
```

Hasil:

```text
001 - Teknologi Informasi
002 - Keuangan
003 - Kepegawaian
```

---

# 24. Multi Relation

Untuk:

```text
select table relation multiple
```

hasilnya bukan satu relation:

```text
pegawai → department
```

tetapi collection:

```text
pegawai → departments[]
```

Contoh:

```text
☑ Teknologi Informasi
☑ Keuangan
☐ Kepegawaian
```

Kemudian data disimpan sebagai relationship collection.

---

# 25. Template + Component + Loop

Inilah kombinasi paling penting.

Misalnya:

```text
Template Surat Tugas
```

berisi:

```text
Dengan ini menugaskan:

[ Component: Daftar Pegawai ]
```

Component:

```text
is_looping = true
```

Requirement:

```text
nama
nip
jabatan
```

Template menentukan:

```text
Source:
Global Table → Pegawai

Rows:
☑ Afdal
☑ Budi
☑ Citra
```

Renderer:

```text
for each selected employee:

    render Component
```

Output:

```text
1. Afdal
   NIP: 123
   Jabatan: Programmer

2. Budi
   NIP: 456
   Jabatan: Analis

3. Citra
   NIP: 789
   Jabatan: Staff
```

---

# 26. Core Object Model

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

---

# 27. Prinsip Arsitektur yang Harus Dijaga

Agar sistem tidak menjadi sulit dikembangkan, gunakan prinsip berikut:

### 1. Metadata-driven

Jangan hard-code:

```text
Pegawai
Surat Tugas
Surat Keputusan
```

Tetapi definisikan melalui metadata.

---

### 2. Component-driven

Semua bagian dokumen yang dapat digunakan kembali harus menjadi component.

---

### 3. Template-driven

Template hanya menentukan **struktur dokumen**.

---

### 4. Data-driven

Data berasal dari:

```text
Global Table
Administration
Manual Input
System Data
```

---

### 5. Schema-driven

UI form dibuat berdasarkan schema.

```text
Column Definition
       ↓
Form Renderer
       ↓
Input
```

---

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

---

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

---

# 28. Konsep Final yang Paling Sederhana

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

---

# 29. Referensi Arsitektur Statamic → BMS (v2, 2026-09-11)

Pola Statamic CMS (Laravel) diadaptasi ke Nuxt 4 + Nitro + TypeORM + SQLite + Naive UI —
bukan dependensi, hanya referensi pola. Peta lengkap: wiki `statamic-reference`.

```text
Statamic bootstrap/providers/web.php  →  nuxt.config + database.server.ts + server/api/*
Entry/Contracts/Stache/Repository     →  EntitySchema + Zod DTO + plain-object services
Stache flat store                     →  SQLite + global_table_rows (JSON-per-row)
Blueprint/Fieldtypes(Bard)            →  kolom + step fields + 14 column types
CP Inertia/Vue + SavePipeline         →  dashboard Naive UI + wizard autosave/complete
Antlers Engine                        →  pipeline resolve-tree → HTML → PDF
Static cache                          →  cache proyeksi navigasi + PDF frozen
REST/GraphQL                          →  REST saja (tanpa GraphQL — decision D-01)
Addons/events, search, filesystem     →  activity-log, search/lookup, storage allowlist
```

# 30. Runtime Penuh + Prefix step_field + Nested Component (v2, 2026-09-11)

Keputusan alignment K-02/K-03/K-04:

1. **Runtime penuh** — operator menyusun steps dari template saat menjalankan (bukan hanya
   predefined). Run mem-freeze urutan + pilihan template (auditable). Steps predefined tetap
   sebagai kerangka awal. Detail: wiki `administration-runtime` §A.
2. **Konvensi `step_field`** — data administrasi memakai bahasa `{{data.<step>.<field>}}`
   (contoh `{{data.step1.nama}}`); validator + binding editor mendukung namespace `step.*`.
3. **Requirement `component` (nested)** — tipe view ketiga selain `text`/`image`; tanpa batas
   depth; engine wajib deteksi siklik + alert infinite loop + blokir render terdampak.

# 31. Katalog Tipe Kolom v2 (14 Types)

v1 = 11 tipe (bab 3). v2 menambah `datetime`, `time`, `select-multiple` (lihat kotak v2 di bab 3).
Spesifikasi perilaku + sintaks operasi `++` + contoh `1 * 2 = 2`: wiki `column-type-catalog`.
Core concept sempurna (12 lapisan + aturan emas): wiki `core-concept`.
