# Token Diff — Off-Token Removal untuk Task 27

> Audit `grep -rn "indigo\|#6366f1"` di `apps/web/app` (Task 25 Appendix C UI-05…06). Semua harus 0 setelah Task 27. Mockups hi-fi sudah 0 indigo — ini daftar yang harus disapu bersih.

## Hits Saat Ini (akan dihapus Task 27)

| File | Line | Sebelum (off-token) | Sesudah (token) |
|------|------|---------------------|-----------------|
| `app/layouts/default.vue:341` | `text-indigo-500` | `text-indigo-500` (logo) | `color: var(--primary) #3B82F6` atau `text-[#3B82F6]` |
| `app/layouts/default.vue:375` | `bg-gradient-to-r from-indigo-500 to-purple-500` (avatar) | indigo→purple gradient | `from-[#3B82F6] to-[#2563EB]` atau `bg-primary` + no purple |
| `app/pages/login.vue:85` | `text-indigo-600 hover:text-indigo-500` (link Daftar) | indigo link | `text-[#3B82F6] hover:text-[#2563EB]` |
| `app/pages/register.vue:140` | `text-indigo-600 hover:text-indigo-500` | sda | sda |
| `app/components/common/AuthForm/AuthForm.vue:10` | `from-blue-50 to-indigo-100` bg | blue→indigo gradient | `from-[#EFF6FF] to-[#DBEAFE]` (primary-50→primary-100) atau `bg-[#F9FAFB]` |
| `app/pages/dashboard/settings.vue:17` | `['#1e40af', '#3b82f6', '#6366f1']` (gradient default) | includes #6366f1 indigo | `['#1e40af', '#3b82f6', '#2563eb']` (primary hover) |
| `app/pages/dashboard/settings.vue:129/141/153/183/241` | `text-indigo-500` icon | indigo icon | `text-[#3B82F6]` or `color: var(--primary)` |
| `app/stores/settings.ts:17` | `loginBgGradient` fallback `...#6366f1` | sda | `...#2563eb` |

## Ukuran Sider

| File | Line | Sebelum | Sesudah |
|------|------|---------|---------|
| `app/layouts/default.vue:335` | `width:240 collapsed:64` | 240/64 | 220/72 |
| `app/layouts/default.vue:347` | `collapsed-width 64` | 64 | 72 |
| `app/layouts/default.vue:348` | `collapsed-icon-size 22` | 22 | 22 (keep) |

## DataTable

| File | Line | Sebelum | Sesudah |
|------|------|---------|---------|
| `app/components/common/DataTable/DataTable.vue:154` | `min-width:280px` | 280 | **320** |
| `app/components/common/DataTable/DataTable.vue:168` | `width:140px` | 140 | **160** |
| `app/components/common/DataTable/DataTable.vue:157/187` | `<Search/>` / `<Settings/>` bare | bare | `<NIcon><Search/></NIcon>` via `h(NIcon)` |
| — | — | no Refresh | **+ Refresh** `Restart` + NIcon + aria-label |
| — | — | no error slot | **+ error** `NAlert` + retry |

## Verifikasi Task 27

```bash
# should be 0 after Task 27
grep -r "indigo" apps/web/app --include="*.vue" --include="*.ts" | wc -l  # → 0
grep -r "#6366f1" apps/web/app --include="*.vue" --include="*.ts" | wc -l # → 0
grep -r "280px\|140px" apps/web/app/components/common/DataTable --include="*.vue" | wc -l # → 0 (should be 320/160)
grep -r "useMessage()" apps/web/app --include="*.vue" --include="*.ts" | grep -v "import.meta.client" | wc -l # → 0 (all guarded)
```
