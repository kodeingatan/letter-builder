## Objective

Mengaudit task 05-07 (Document Engine, Master Data DDL, Template & Administrasi), memperbaiki errors, menambah Playwright E2E tests, mengimplementasikan UI improvements, menyelesaikan open questions (token conflict, PRD vs tugas).

## Context

Tasks 05-07 selesai dan diverifikasi. Open issues:
1. Conflict dokumen: PRD bilang "Dynamic Administration dihapus Task 01" tapi tasks 05-07 re-introduce fitur serupa
2. Token conflict: #0075de (design-system.md) vs #3B82F6 (AGENTS.md)
3. Playwright E2E tests belum lengkap (skip Chrome)
4. UI improvements dari FASE 1 belum diimplement

## Scope

### In Scope
- Audit task 05-07: build, UT, NT, E2E, manual QA
- Fix errors/regresi
- Tambah Playwright E2E tests untuk persuratan
- Implement UI improvements
- Resolusi token conflict → update AGENTS.md
- Dokumentasi cross-document conflict

### Out of Scope
- Fitur baru (hanya stabilisasi)
- Perubahan arsitektur RBAC-Only

## Dependencies
- tasks/05-07 (DONE)
- tasks/08-persuratan-ui-refinement (DONE)
