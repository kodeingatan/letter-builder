---
name: naiveui-practices
description: Best practices untuk menggunakan Naive UI component library pada project Vue 3 + Vite. Mencakup installation, theming, form system, DataTable, navigation, feedback components, dan production recommendations.
metadata:
  author: opencode
  version: "1.0"
  category: frontend
  framework: vue3
---

# Naive UI Best Practices

## Tujuan Skill

Menyediakan panduan komprehensif untuk使用、customization、dan optimization Naive UI component library sesuai best practices.

## Kapan Skill Digunakan

- Saat membuat atau maintain Vue 3 project dengan Naive UI
- Saat implementasi forms dengan validation
- Saat membuat DataTable dengan sorting, filtering, pagination
- Saat customize theme dan dark mode
- Saat implementasi layout (sidebar, header, content)
- Saat handle feedback (dialog, message, notification)
- Saat optimize performance (virtual scroll, tree-shaking)

## Kapan Skill TIDAK Digunakan

- Untuk Vue 2 projects
- Untuk UI library lain (Element Plus, Ant Design Vue, dll)
- Untuk pure backend tanpa frontend

## Workflow Penggunaan

1. **Identifikasi kebutuhan** → tentukan components yang diperlukan
2. **Konsultasi references** → lihat folder `references/` untuk detail
3. **Gunakan direct import** → tree-shakable, efficient bundle
4. **Implement TypeScript** → type-safe props dan events
5. **Apply theme** → gunakan centralized theme overrides
6. **Verify** → test di light dan dark mode

## Checklist Sebelum Implementasi

- [ ] Menggunakan Vue 3 (>3.0.5)?
- [ ] Menggunakan TypeScript?
- [ ] Sudah install naive-ui?
- [ ] Sudah setup NConfigProvider?
- [ ] Sudah definisikan theme overrides?
- [ ] Menggunakan direct import (bukan global)?

## Checklist Sesudah Implementasi

- [ ] Semua components menggunakan direct import
- [ ] Forms memiliki validation rules
- [ ] DataTable memiliki row-key
- [ ] Theme centralized di file terpisah
- [ ] Loading states ter-handle
- [ ] Error handling terimplementasi
- [ ] Labels dan accessibility terjaga

## Best Practices

### Import
- Selalu gunakan **direct import**: `import { NButton } from 'naive-ui'`
- Hindari global import untuk bundle size optimal
- Gunakan auto-import dengan unplugin-vue-components

### TypeScript
- Selalu gunakan `<script setup lang="ts">`
- Import types: `import type { FormRules, DataTableColumns } from 'naive-ui'`
- Setup Volar untuk IDE support

### Forms
- Gunakan `FormInst` ref untuk programmatic validation
- Definisikan rules dengan trigger (`blur`, `change`)
- Gunakan `path` untuk nested objects

### DataTable
- Selalu gunakan `row-key` untuk selection
- Gunakan `h()` untuk custom render
- Gunakan virtual scroll untuk 1000+ rows

### Theming
- Definisikan theme overrides di file terpisah
- Gunakan TypeScript untuk type-safe theme
- Manfaatkan nested ConfigProvider untuk sections berbeda

### Layout
- Gunakan `has-sider` untuk sidebar layout
- Gunakan Grid system untuk responsive layouts
- Gunakan `native-scrollbar: false` untuk custom scrollbar

### Feedback
- Gunakan `useDialog` untuk confirmations
- Gunakan `useMessage` untuk simple toasts
- Gunakan `useNotification` untuk persistent notifications

### Performance
- Gunakan virtual scroll untuk large datasets
- Gunakan lazy loading untuk non-critical data
- Handle loading states dengan `NSpin`

## Conventions

- Gunakan `<script setup lang="ts">` untuk semua komponen
- Gunakan `ref()` untuk reactive state
- Gunakan `computed()` untuk derived state
- Gunakan `watch()` untuk side effects
- Gunakan `h()` untuk custom render di DataTable
- Gunakan `NConfigProvider` di root app
- Gunakan centralized theme overrides
- Gunakan direct imports untuk semua components

## Anti-Patterns (WAJIB Dihindari)

### ❌ Import Patterns
- Global import: `import naive from 'naive-ui'`
- Tanpa TypeScript

### ❌ Component Patterns
- Options API alih-alih Composition API
- Hardcode colors di components
- Tanpa loading states

### ❌ Form Patterns
- Tanpa FormInst ref
- Validation rules tanpa trigger
- Skip validation saat submit

### ❌ DataTable Patterns
- Tanpa row-key
- String di render function (gunakan h())
- Tanpa virtual scroll untuk large data

### ❌ Theme Patterns
- Inline theme overrides
- Hardcode colors di components
- Tanpa centralized theme

### ❌ Feedback Patterns
- Console.log alih-alih message/notification
- Tanpa confirmation untuk destructive actions
- Skip error handling

## Internal References

Untuk detail lebih lanjut, lihat folder `references/`:

- `references/official-documentation.md` - Ringkasan dokumentasi resmi
- `references/installation.md` - Panduan instalasi dan setup
- `references/theming.md` - Theme system dan customization
- `references/components.md` - Component categories dan patterns
- `references/form-system.md` - Form validation dan dynamic forms
- `references/datatable.md` - DataTable features dan usage
- `references/layout.md` - Layout components dan grid system
- `references/feedback.md` - Dialog, message, notification
- `references/best-practices.md` - Best practices lengkap
- `references/anti-patterns.md` - Anti-patterns yang harus dihindari

## Instruksi untuk AI

**WAJIB** mengikuti best practices yang telah dipelajari:

1. **Selalu gunakan direct import** untuk semua components
2. **Selalu gunakan TypeScript** dengan `<script setup lang="ts">`
3. **Selalu gunakan row-key** untuk DataTable
4. **Selalu gunakan h()** untuk custom render
5. **Selalu definisikan theme** di file terpisah
6. **Selalu handle loading states** dengan NSpin atau :loading
7. **Selalu handle errors** dengan try-catch
8. **Selalu gunakan labels** untuk accessibility
9. **Hindari global import** untuk bundle size
10. **Hindari hardcode colors** untuk theme consistency
