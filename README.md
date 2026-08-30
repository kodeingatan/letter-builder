# Spec-Driven Development with OpenCode

> Workflow Vibe Coding terstruktur untuk project Nuxt.js full-stack

## Daftar Isi

* [Overview](#overview)
* [Tujuan](#tujuan)
* [Konsep SDD](#konsep-sdd)
* [Arsitektur Workflow](#arsitektur-workflow)
* [Struktur Project](#struktur-project)
* [Persiapan](#persiapan)
* [Inisialisasi Project](#inisialisasi-project)
* [Workflow Utama](#workflow-utama)

  * [/spec](#1-spec)
  * [/plan](#2-plan)
  * [/implement](#3-implement)
  * [/verify](#4-verify)
  * [/review](#5-review)
* [Workflow Lengkap](#workflow-lengkap)
* [Membuat Feature Baru](#membuat-feature-baru)
* [Contoh Global Table](#contoh-global-table)
* [Aturan UI/UX](#aturan-uiux)
* [Aturan Nuxt.js](#aturan-nuxtjs)
* [Best Practices](#best-practices)
* [Definition of Done](#definition-of-done)

---

# Overview

Project ini menggunakan **Spec-Driven Development (SDD)** untuk mengontrol proses Vibe Coding menggunakan OpenCode.

Project dibangun menggunakan **Nuxt.js sebagai framework full-stack**, sehingga frontend dan backend dapat dikelola dalam satu aplikasi.

Tujuan utamanya adalah membuat AI:

* memahami project sebelum coding
* mengikuti architecture yang sudah ada
* mengikuti design system
* menghasilkan UI/UX yang konsisten
* tidak membuat fitur berdasarkan asumsi
* tidak melakukan perubahan di luar scope
* menghasilkan code yang dapat diverifikasi
* melakukan review sebelum feature dianggap selesai

Workflow utama:

```text
Requirement
    ↓
SPEC
    ↓
PLAN
    ↓
IMPLEMENT
    ↓
VERIFY
    ↓
REVIEW
    ↓
FIX
    ↓
VERIFY
    ↓
DONE
```

---

# Tujuan

SDD digunakan untuk mencegah masalah umum Vibe Coding:

### Tanpa SDD

```text
User
 ↓
"buat fitur X"
 ↓
AI langsung coding
 ↓
kode berjalan
 ↓
UI tidak konsisten
 ↓
architecture berantakan
 ↓
duplicate component
 ↓
bug
 ↓
feature berikutnya semakin sulit
```

### Dengan SDD

```text
User
 ↓
Requirement
 ↓
Specification
 ↓
Architecture
 ↓
UI/UX
 ↓
Implementation Plan
 ↓
Implementation
 ↓
Testing
 ↓
Verification
 ↓
Review
 ↓
DONE
```

---

# Konsep SDD

Project menggunakan beberapa lapisan dokumentasi.

```text
AGENTS.md
    │
    ├── Global development rules
    │
    ▼
docs/
    │
    ├── product/
    ├── architecture/
    ├── design/
    │
    └── specs/
            │
            └── <feature>/
                    ├── requirements.md
                    ├── domain.md
                    ├── api.md
                    ├── ui.md
                    ├── acceptance.md
                    └── tasks.md
```

## AGENTS.md

Berisi aturan global project.

Contoh:

* architecture Nuxt.js
* coding convention
* aturan pages dan components
* aturan server routes
* aturan composables
* aturan database dan repository
* TypeScript rules
* UI/UX rules
* testing rules
* security rules

AI harus membaca file ini sebelum bekerja.

---

# Feature Specification

Setiap feature memiliki specification sendiri.

Contoh:

```text
docs/specs/global-table/
```

Berisi:

```text
requirements.md
domain.md
api.md
ui.md
acceptance.md
tasks.md
```

## requirements.md

Menjelaskan:

* tujuan feature
* user
* use case
* functional requirements
* business rules
* edge cases

## domain.md

Menjelaskan:

* entity
* relationship
* state
* domain rules
* invariant

## api.md

Menjelaskan:

* server route
* HTTP method
* request
* response
* validation
* error
* authentication
* authorization

## ui.md

Menjelaskan:

* halaman
* layout
* component
* interaction
* responsive behavior
* loading
* empty
* error
* success
* accessibility

## acceptance.md

Menentukan kapan feature dianggap benar.

Format:

```text
Given
When
Then
```

## tasks.md

Berisi daftar pekerjaan implementasi.

---

# Arsitektur Workflow

```text
                       USER
                         │
                         ▼
                  ┌─────────────┐
                  │    /spec    │
                  └──────┬──────┘
                         │
                         ▼
                Feature Specification
                         │
                         ▼
                  ┌─────────────┐
                  │    /plan    │
                  └──────┬──────┘
                         │
                         ▼
                 Implementation Plan
                         │
                         ▼
               ┌──────────────────┐
               │    /implement    │
               └────────┬─────────┘
                        │
                        ▼
                    Nuxt.js Code
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
      Client App                 Server App
          │                           │
          └─────────────┬─────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │    /verify   │
                 └──────┬───────┘
                        │
                        ▼
               Tests / Build / QA
                        │
                        ▼
                 ┌──────────────┐
                 │    /review   │
                 └──────┬───────┘
                        │
                 ┌──────┴──────┐
                 │             │
                FAIL          PASS
                 │             │
                 ▼             ▼
                FIX           DONE
                 │
                 ▼
               /verify
```

---

# Struktur Project

Struktur yang direkomendasikan:

```text
project/
│
├── AGENTS.md
├── README.md
├── nuxt.config.ts
├── package.json
├── tsconfig.json
│
├── .opencode/
│   │
│   ├── agents/
│   │   ├── architect.md
│   │   ├── product.md
│   │   ├── uiux.md
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   ├── qa.md
│   │   └── reviewer.md
│   │
│   └── commands/
│       ├── spec.md
│       ├── plan.md
│       ├── implement.md
│       ├── verify.md
│       ├── review.md
│       └── feature.md
│
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── design/
│   │
│   └── specs/
│       ├── global-table/
│       ├── component/
│       └── template/
│
├── app/
│   ├── components/
│   ├── composables/
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   ├── plugins/
│   └── utils/
│
├── server/
│   ├── api/
│   ├── middleware/
│   ├── plugins/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── database/
│   ├── utils/
│   └── types/
│
├── shared/
│   ├── types/
│   ├── constants/
│   └── schemas/
│
├── public/
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

# Persiapan

Pastikan Node.js dan package manager sudah terinstall.

Kemudian masuk ke project:

```bash
cd /path/to/project
```

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Jalankan OpenCode:

```bash
opencode
```

---

# Inisialisasi Project

Jika project belum memiliki `AGENTS.md`, jalankan:

```text
/init
```

OpenCode akan menganalisis project dan membuat atau memperbarui instruction file.

Setelah itu pastikan:

```text
AGENTS.md
```

berisi aturan project Anda.

Jangan menganggap hasil `/init` sudah sempurna.

Review dan sesuaikan dengan architecture Nuxt.js, termasuk:

* struktur `app/`
* struktur `server/`
* server API routes
* composables
* database access
* authentication
* authorization
* testing
* deployment

---

# Workflow Utama

## 1. /spec

`/spec` digunakan untuk membuat specification.

Contoh:

```text
/spec global-table
```

Tujuan:

```text
User Requirement
      ↓
Specification
```

OpenCode akan membuat:

```text
docs/specs/global-table/
├── requirements.md
├── domain.md
├── api.md
├── ui.md
├── acceptance.md
└── tasks.md
```

### Contoh Prompt

```text
/spec global-table
```

Kemudian jelaskan:

```text
Buat feature Global Table menggunakan Nuxt.js full-stack.

Administrator dapat:

- melihat daftar global table
- membuat global table
- mengubah global table
- menghapus global table
- menambahkan columns
- mengubah columns
- mengatur column type
- mengatur required
- mengatur unique
- mengatur default value
- melihat live schema preview

Gunakan Nuxt pages dan components untuk UI.
Gunakan server API routes untuk backend.
Pisahkan business logic ke service dan repository.
Jangan implementasikan kode.

Buat specification lengkap.
```

### Penting

Pada tahap `/spec`:

```text
JANGAN CODING.
```

Tujuan tahap ini adalah memastikan requirement benar terlebih dahulu.

---

# 2. /plan

Setelah specification selesai dan sudah direview:

```text
/plan global-table
```

OpenCode akan:

1. membaca specification
2. membaca architecture
3. membaca codebase
4. mencari reusable component
5. mencari reusable composable
6. mencari reusable service
7. mencari reusable repository
8. menentukan file yang terdampak
9. menentukan urutan implementasi
10. memperbarui `tasks.md`

Contoh:

```text
TASK-001
Create database structure

TASK-002
Create shared domain types

TASK-003
Create validation schemas

TASK-004
Create repository

TASK-005
Create server service

TASK-006
Create server API routes

TASK-007
Create Nuxt composable

TASK-008
Create Global Table list page

TASK-009
Create Global Table editor

TASK-010
Create Column Editor

TASK-011
Create tests

TASK-012
Verify
```

Pada tahap ini:

```text
JANGAN CODING.
```

---

# 3. /implement

Setelah plan disetujui:

```text
/implement global-table
```

OpenCode mulai mengimplementasikan feature.

Urutan umum:

```text
Database
    ↓
Shared Types and Schemas
    ↓
Repository
    ↓
Server Service
    ↓
Server API Routes
    ↓
Nuxt Composable
    ↓
UI Components
    ↓
Pages
    ↓
Tests
```

AI harus mengikuti:

```text
AGENTS.md
+
requirements.md
+
domain.md
+
api.md
+
ui.md
+
acceptance.md
+
tasks.md
```

---

# 4. /verify

Setelah implementation:

```text
/verify global-table
```

Verification harus memeriksa:

```text
TypeScript
    ↓
Lint
    ↓
Unit Tests
    ↓
Integration Tests
    ↓
E2E Tests
    ↓
Build
    ↓
Server API
    ↓
Acceptance Criteria
    ↓
UI/UX
    ↓
Accessibility
    ↓
Architecture
```

Contoh hasil:

```text
Typecheck
PASS

Lint
PASS

Unit Tests
PASS

Integration Tests
PASS

E2E Tests
PASS

Build
PASS

Server API
PASS

Acceptance Criteria
12/12 PASS

UI/UX
PASS

Accessibility
PASS

Architecture
PASS
```

Jika ada:

```text
FAIL
```

feature belum selesai.

---

# 5. /review

Setelah verification:

```text
/review global-table
```

Reviewer melakukan pemeriksaan independen.

Review meliputi:

### Requirements

Apakah semua requirement dibuat?

### Architecture

Apakah architecture Nuxt.js tetap bersih?

Apakah tanggung jawab berikut sudah dipisahkan?

* pages
* components
* composables
* server routes
* services
* repositories
* database access

### Backend

Apakah:

* server route tipis?
* validation benar?
* service menangani business logic?
* repository menangani data access?
* authorization benar?
* error handling konsisten?

### Frontend

Apakah:

* component reusable?
* composable benar?
* API abstraction benar?
* tidak ada duplicate logic?
* state management sesuai kebutuhan?

### UI/UX

Apakah:

* hierarchy jelas?
* spacing konsisten?
* responsive?
* loading state tersedia?
* empty state tersedia?
* error state tersedia?
* success feedback tersedia?
* accessibility baik?

### Security

Apakah:

* validation server tersedia?
* authorization benar?
* data sensitif aman?
* input tervalidasi?
* endpoint tidak dapat diakses tanpa permission?

### Performance

Apakah:

* query efisien?
* pagination diperlukan?
* unnecessary request terjadi?
* rendering berlebihan?
* server route tidak melakukan pekerjaan yang tidak diperlukan?

---

# Workflow Lengkap

Untuk feature baru:

```text
/spec feature-name
```

Review specification.

Kemudian:

```text
/plan feature-name
```

Review plan.

Kemudian:

```text
/implement feature-name
```

Setelah implementation:

```text
/verify feature-name
```

Kemudian:

```text
/review feature-name
```

Jika reviewer menemukan masalah:

```text
/implement feature-name
```

Setelah perbaikan:

```text
/verify feature-name
```

Jika semua PASS:

```text
DONE
```

---

# Membuat Feature Baru

Misalnya:

```text
Feature:
Global Table
```

Gunakan:

```text
/spec global-table
```

Kemudian:

```text
/plan global-table
```

Kemudian:

```text
/implement global-table
```

Kemudian:

```text
/verify global-table
```

Kemudian:

```text
/review global-table
```

---

# Contoh Global Table

Specification:

```text
docs/specs/global-table/
```

## requirements.md

Contoh requirement:

```text
GT-001
Administrator dapat melihat Global Table.

GT-002
Administrator dapat membuat Global Table.

GT-003
Administrator dapat mengubah Global Table.

GT-004
Administrator dapat menghapus Global Table.

GT-005
Nama table harus unique.

GT-006
Column name harus unique.

GT-007
Minimal satu column harus tersedia.
```

---

# Domain

Contoh:

```text
GlobalTable
    │
    ├── id
    ├── name
    ├── displayName
    ├── status
    ├── createdAt
    ├── updatedAt
    │
    └── columns
          │
          ├── id
          ├── name
          ├── displayName
          ├── type
          ├── nullable
          ├── unique
          ├── defaultValue
          └── order
```

---

# UI/UX

Global Table tidak menggunakan desain generic admin panel.

Konsep:

```text
┌───────────────────────────────────────────────┐
│ Global Tables                       + Create  │
├────────────────┬──────────────────────────────┤
│ Search         │                              │
│                │       Table Workspace        │
│ Tables         │                              │
│                │                              │
│ users          │                              │
│ products       │                              │
│ orders         │                              │
│                │                              │
└────────────────┴──────────────────────────────┘
```

Create/Edit:

```text
┌───────────────────────────────────────────────┐
│ Global Table Editor                           │
├──────────────────────┬────────────────────────┤
│ Configuration        │ Live Preview           │
│                      │                        │
│ Table Name           │ users                  │
│ Display Name         │                        │
│                      │ id       INT           │
│ Columns              │ name     VARCHAR       │
│                      │ email    VARCHAR       │
│ + Add Column         │                        │
└──────────────────────┴────────────────────────┘
```

Tujuannya agar aplikasi terasa seperti:

```text
Professional Application
```

bukan:

```text
Generic CRUD Admin Panel
```

---

# Aturan UI/UX

Semua feature harus mengikuti prinsip:

## Visual Hierarchy

Primary action harus jelas.

Contoh:

```text
Page Title
    ↓
Context
    ↓
Primary Action
    ↓
Main Content
```

## States

Setiap feature yang asynchronous harus memiliki:

```text
Loading
Empty
Error
Success
Disabled
Validation
```

## Responsive

Minimal:

```text
Mobile
Tablet
Desktop
```

Jangan hanya mengecilkan desktop layout.

Layout harus beradaptasi.

## Accessibility

Semua interactive element harus:

* keyboard accessible
* memiliki accessible label
* memiliki focus state
* memiliki feedback
* tidak hanya bergantung pada warna

---

# Aturan Nuxt.js

Gunakan pembagian:

```text
Page
 ↓
Component
 ↓
Composable
 ↓
Server API Route
 ↓
Service
 ↓
Repository
 ↓
Database
```

Contoh:

```text
app/pages/global-tables/index.vue
        │
        ▼
app/components/global-table/TableList.vue
        │
        ▼
app/composables/useGlobalTables.ts
        │
        ▼
server/api/global-tables/index.get.ts
        │
        ▼
server/services/global-table.service.ts
        │
        ▼
server/repositories/global-table.repository.ts
        │
        ▼
Database
```

Untuk operasi create:

```text
app/pages/global-tables/create.vue
        │
        ▼
app/components/global-table/TableEditor.vue
        │
        ▼
app/composables/useGlobalTableForm.ts
        │
        ▼
server/api/global-tables/index.post.ts
        │
        ▼
server/services/global-table.service.ts
        │
        ▼
server/repositories/global-table.repository.ts
```

## Aturan Server Route

Server route bertanggung jawab untuk:

* menerima request
* membaca parameter
* melakukan authentication check
* melakukan authorization check
* memvalidasi input
* memanggil service
* mengembalikan response

Server route tidak boleh berisi business logic yang kompleks.

## Aturan Service

Service bertanggung jawab untuk:

* business logic
* orchestration
* domain rules
* transaction flow
* pemanggilan repository

## Aturan Repository

Repository bertanggung jawab untuk:

* query database
* persistence
* mapping data
* database-specific logic

Hindari:

```text
HugePage.vue
```

yang berisi:

```text
UI
+
API
+
Business Logic
+
Validation
+
State
```

Hindari juga:

```text
HugeServerRoute.ts
```

yang berisi:

```text
HTTP Handling
+
Business Logic
+
Database Query
+
Authorization
+
Response Formatting
```

---

# Best Practices

## 1. Jangan coding tanpa spec

Buruk:

```text
"buat halaman global table"
```

Lebih baik:

```text
/spec global-table
```

kemudian:

```text
/plan global-table
```

kemudian:

```text
/implement global-table
```

---

## 2. Jangan membuat feature terlalu besar

Buruk:

```text
Buat seluruh sistem ERP.
```

Lebih baik:

```text
Feature 1:
Authentication

Feature 2:
User Management

Feature 3:
Global Table

Feature 4:
Component

Feature 5:
Template
```

Feature kecil membuat AI lebih konsisten.

---

## 3. Reuse sebelum Create

Sebelum membuat component baru:

```text
Search existing components.
```

Sebelum membuat composable baru:

```text
Search existing composables.
```

Sebelum membuat service baru:

```text
Search existing services.
```

Sebelum membuat repository baru:

```text
Search existing repositories.
```

Sebelum membuat server route baru:

```text
Search existing server routes.
```

---

## 4. Jangan percaya hasil AI tanpa verification

Jangan menganggap:

```text
"kode sudah dibuat"
```

berarti:

```text
"feature sudah benar"
```

Gunakan:

```text
/verify
```

---

## 5. Jangan abaikan review

Verification menjawab:

```text
Apakah feature bekerja?
```

Review menjawab:

```text
Apakah feature dibuat dengan benar?
```

Keduanya berbeda.

---

## 6. Jangan mencampur tanggung jawab

Hindari menempatkan semua logic di:

* page
* component
* composable
* server route

Gunakan layer yang sesuai:

```text
Page
    ↓
Component
    ↓
Composable
    ↓
Server Route
    ↓
Service
    ↓
Repository
    ↓
Database
```

---

# Definition of Done

Feature hanya boleh dianggap `DONE` jika semua kondisi berikut terpenuhi.

## Specification

```text
[ ] requirements selesai
[ ] domain selesai
[ ] API selesai
[ ] UI/UX selesai
[ ] acceptance criteria selesai
[ ] tasks selesai
```

## Implementation

```text
[ ] server API selesai
[ ] service selesai
[ ] repository selesai
[ ] frontend selesai
[ ] validation selesai
[ ] authentication selesai jika diperlukan
[ ] authorization selesai jika diperlukan
[ ] error handling selesai
[ ] tests selesai
```

## Verification

```text
[ ] typecheck PASS
[ ] lint PASS
[ ] unit tests PASS
[ ] integration tests PASS
[ ] e2e tests PASS
[ ] build PASS
[ ] server API PASS
[ ] acceptance criteria PASS
```

## UI/UX

```text
[ ] loading state
[ ] empty state
[ ] error state
[ ] success state
[ ] validation state
[ ] disabled state
[ ] responsive
[ ] accessibility
[ ] design system
```

## Review

```text
[ ] architecture reviewed
[ ] server routes reviewed
[ ] services reviewed
[ ] repositories reviewed
[ ] frontend reviewed
[ ] UI/UX reviewed
[ ] security reviewed
[ ] performance reviewed
```

Tidak boleh ada:

```text
CRITICAL
HIGH
```

yang belum diselesaikan.

---

# Recommended Daily Workflow

Untuk penggunaan sehari-hari:

```text
1. Tulis requirement
        ↓
2. /spec
        ↓
3. Review specification
        ↓
4. /plan
        ↓
5. Review plan
        ↓
6. /implement
        ↓
7. /verify
        ↓
8. /review
        ↓
9. Fix
        ↓
10. /verify
        ↓
11. DONE
```

---

# Quick Reference

| Command      | Tujuan                           |
| ------------ | -------------------------------- |
| `/spec`      | Membuat specification            |
| `/plan`      | Membuat implementation plan      |
| `/implement` | Mengimplementasikan feature      |
| `/verify`    | Memverifikasi feature            |
| `/review`    | Review code, architecture, UI/UX |
| `/feature`   | Workflow feature end-to-end      |

Contoh:

```text
/spec global-table
```

```text
/plan global-table
```

```text
/implement global-table
```

```text
/verify global-table
```

```text
/review global-table
```

---

# Prinsip Utama

> **Specification is the source of truth.**

> **Existing Nuxt.js architecture must be respected.**

> **Reuse before create.**

> **Never implement unspecified behavior.**

> **UI/UX is part of the specification, not an afterthought.**

> **Server routes must remain thin.**

> **Business logic belongs in services.**

> **Database access belongs in repositories.**

> **Verification is required before completion.**

> **Review is required before DONE.**

---

# Final Workflow

```text
                  ┌──────────────┐
                  │     IDEA     │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    /spec     │
                  └──────┬───────┘
                         │
                         ▼
                ┌──────────────────┐
                │   SPECIFICATION  │
                └────────┬─────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    /plan     │
                  └──────┬───────┘
                         │
                         ▼
                ┌──────────────────┐
                │ IMPLEMENTATION   │
                │      PLAN        │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │   /implement    │
                └────────┬─────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │     CODE      │
                 └───────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    /verify   │
                  └──────┬───────┘
                         │
                         ▼
                 ┌────────────────┐
                 │ TEST / BUILD   │
                 └───────┬────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    /review   │
                  └──────┬───────┘
                         │
                    ┌────┴────┐
                    │         │
                   FAIL      PASS
                    │         │
                    ▼         ▼
                   FIX       DONE
                    │
                    ▼
                 /verify
```

**SDD + OpenCode + Nuxt.js = Controlled Vibe Coding**

Dengan workflow ini, AI tidak hanya bertugas menulis kode, tetapi juga dipaksa mengikuti **requirement → architecture → UI/UX → implementation → testing → verification → review**.
