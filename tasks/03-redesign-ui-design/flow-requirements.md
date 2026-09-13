<!-- tasks/03-redesign-ui-design/flow-requirements.md — FASE 1 -->

## User Flow

> MANDATORY — flow interaksi di prototype. Menjadi ACUAN task FASE 2 (`tasks/04-redesign.md`).

### Diagram

```text
[Entry: /login] --(kredensial valid)--> [/dashboard hero] --(sidebar App-Shell Row)--> [List pages: users|roles|permissions|guards]
        |                                     |                                             |
        +--(invalid)--> [Inline error]         +--(sidebar)--> [Sistem: activity-logs|system-logs|settings|profile]
        |                                     |
[Entry: /register] --(valid)--> [/login]       +--(CRUD)--> [Modal Card] --(submit)--> [Toast Berhasil] + re-fetch
                                                      |                    |
                                                      +--(403)--> [AccessDeniedAlert single]
                                                      +--(empty)--> [Empty-State Card + CTA]
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Guest | Buka `/login` | Auth Card | Card putih hairline di canvas `#f6f5f4`, pill CTA primer |
| 2 | Guest | Submit invalid | Auth Card + `NFormItem` | Inline error, fokus + micro-shadow |
| 3 | Guest | Submit valid | Auth Card → redirect | Toast + `/dashboard` hero band `#213183` |
| 4 | Guest | Buka `/register` → submit valid | Auth Card | 201 + redirect `/login` |
| 5 | Auth user | Navigasi sidebar | App-Shell Row (indikator `#0075de`) | Halaman aktif ter-highlight |
| 6 | Auth user | Buka list page | PageShell + DataTable (header eyebrow, hairline) | Tabel + toolbar 320/160 + pagination ID |
| 7 | Auth user | Klik Create/Edit | Modal Card xl16 + Level-2 shadow | Form tight 4px, focus trap |
| 8 | Auth user | Submit → sukses | Toast | `Berhasil`, re-fetch tabel |
| 9 | Auth user | Aksi tanpa permission | AccessDeniedAlert | Satu floating `NAlert` 4s |
| 10 | Auth user | Buka activity/system-logs | Badge Pill + LogDetailDrawer | Level badge eyebrow, drawer detail |
| 11 | Auth user | Buka settings/profile | SettingsForm / Profile cards | Key-value + upload, self-service |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Tabel kosong | List → Empty | Empty-State Card `#f6f5f4` xl16 + `Belum ada data` + CTA |
| ALT-02 | User tanpa role menu | Sidebar | Item tersembunyi (gating), bukan disabled |
| ERR-01 | Validasi gagal | Form → Inline | `NFormItem` feedback + border error |
| ERR-02 | 403 Forbidden | Any → Denied | `NAlert` single + event `rbac-denied` |
| ERR-03 | Fetch gagal | List → Error | `NAlert` full-width + `Coba lagi` (tanpa reset state) |
| ERR-04 | 401 | Any → Login | Redirect `/login`, token dibersihkan |
