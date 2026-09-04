# Rencana Implementasi: Perbaikan Sistem Logging

## Masalah yang Ditemukan

### 1. No Data Duplikat di System Logs
- `DataTable.vue:216` me-render `<NEmpty>` custom **di luar** `<NSpin>`
- `NDataTable` (line 203) sudah punya built-in empty state sendiri
- Akibatnya: 2 empty state tampil bersamaan saat data kosong

### 2. Activity Logs Tidak Lengkap
- Middleware `activity-logger.ts` hanya log request `POST/PUT/DELETE/PATCH`
- **Tidak log**: Login, Logout, Register, profile update, password change
- Action filter di frontend uppercase (`CREATE`, `UPDATE`, `DELETE`) tapi data di DB lowercase (`create`, `update`, `delete`) → filter tidak pernah match
- Entity `/api/auth/profile` dan `/api/auth/password` ter-group ke `'unknown'`
- Field `level` dan `metadata` tidak pernah diisi

### 3. System Logs Tidak Berfungsi
- Folder `logs/` tidak ada dan tidak ada yang membuatnya
- Tidak ada logging library yang terinstall (winston/pino/bunyan)
- Service mengembalikan raw `string[]`, bukan `LogEntry[]` yang di-expect frontend
- Frontend kirim params `page`/`sortBy`/`sortOrder` tapi DTO hanya terima `offset`/`limit`
- `DataTable` pakai `row.id` sebagai row key tapi `LogEntry` tidak punya field `id`
- Statistik hanya punya 5 level tapi frontend tampilkan 9 level

---

## Rencana Implementasi

### Tahap 1: Fix No Data Duplikat
**File:** `app/app/components/common/DataTable/DataTable.vue`

- Hapus `<NEmpty v-if="!loading && data.length === 0" description="No data found" />` (line 216)
- `NDataTable` sudah punya built-in empty state, tidak perlu custom lagi
- Pastikan `NDataTable` menampilkan empty state yang konsisten

---

### Tahap 2: Fix Activity Logs — Action Filter Case Mismatch
**File:** `app/app/pages/dashboard/activity-logs.vue`

- Ubah filter options dari uppercase ke lowercase agar match dengan data di DB:
  - `'CREATE'` → `'create'`
  - `'UPDATE'` → `'update'`
  - `'DELETE'` → `'delete'`
  - `'LOGIN'` → `'login'`
  - `'LOGOUT'` → `'logout'`
- Atau alternatif: ubah data di DB ke uppercase saat insert (lebih baik untuk readability)

**File:** `app/server/middleware/activity-logger.ts`

- Ubah action mapping ke uppercase saat insert:
  - `POST` → `'CREATE'`
  - `PUT`/`PATCH` → `'UPDATE'`
  - `DELETE` → `'DELETE'`
- Tambah entity mapping untuk `/api/auth/profile` → `'user'` dan `/api/auth/password` → `'user'`

---

### Tahap 3: Activity Logs — Tambah Logging Login/Logout
**File:** `app/server/services/auth.service.ts`

- Pada method `login()`: panggil `ActivityLogsService.log()` setelah login berhasil
  - action: `'LOGIN'`, entity: `'auth'`, level: `'INFO'`
- Pada method `register()`: panggil `ActivityLogsService.log()` setelah register berhasil
  - action: `'CREATE'`, entity: `'auth'`, level: `'INFO'`

**File:** `app/server/api/auth/logout.post.ts` (buat baru jika belum ada)
- Tambah endpoint logout yang log activity `'LOGOUT'`

**File:** `app/server/middleware/activity-logger.ts`
- Tambah logging untuk `GET /api/auth/profile` (profile view) — optional, atau skip karena GET

---

### Tahap 4: Activity Logs — Tambah Level dan Metadata
**File:** `app/server/middleware/activity-logger.ts`

- Set `level` berdasarkan HTTP method:
  - `POST` (create) → `'INFO'`
  - `PUT`/`PATCH` (update) → `'INFO'`
  - `DELETE` → `'WARNING'`
- Tambah `metadata` berisi JSON.stringify dari response info (entity, entityId, method, path)

**File:** `app/server/entities/activity-log.entity.ts`
- Pastikan field `level` dan `metadata` ada (sudah ada, hanya perlu diisi)

---

### Tahap 5: System Logs — Install Logging Library & Setup
**File:** `app/package.json`

- Install `pino` dan `pino-pretty` (lightweight, high performance)
  ```
  npm install pino pino-pretty
  ```

**File:** `app/server/utils/logger.ts` (buat baru)
- Buat singleton logger instance dengan pino
- Config: write to `logs/app.log` (JSON format untuk production, pretty untuk development)
- Level: configurable via env `LOG_LEVEL` (default: `'info'`)
- Rotation: gunakan `pino-roll` atau manual file rotation (optional, bisa tahap lanjut)

**File:** `app/nuxt.config.ts`
- Register logger sebagai Nitro plugin atau server plugin

---

### Tahap 6: System Logs — Integrasi Logger ke Server
**File:** `app/server/plugins/logger.ts` (buat baru)
- Buat Nitro plugin yang inject `event.context.logger` ke setiap request
- Log setiap request: method, path, status code, duration
- Log errors ke file saat terjadi exception

**File:** `app/server/middleware/activity-logger.ts`
- Tambahkan logging ke file menggunakan logger saat activity log dibuat

**File:** `app/server/api/auth/*.ts`
- Tambahkan logging di auth endpoints (login, register, profile, password)

---

### Tahap 7: System Logs — Perbaiki Service Parsing
**File:** `app/server/services/system-logs.service.ts`

- **Parse raw log lines** menjadi `LogEntry` objects:
  - Format log pino JSON: `{ "level": 30, "time": ..., "msg": "...", "context": "..." }`
  - Parse timestamp, level, context, message dari JSON
  - Extract stack trace jika ada
  - Extract code path/line jika ada
- **Fix pagination**: ubah dari offset-based ke page-based (match frontend)
  - Terima `page` dan `limit` params
  - Hitung `offset` dari `page` dan `limit`
- **Fix level mapping**: map angka pino ke nama level:
  - 10 → TRACE, 20 → DEBUG, 30 → INFO, 40 → NOTICE, 50 → WARNING, 60 → ERROR, 70 → CRITICAL, 80 → FATAL, 90 → EMERGENCY

**File:** `app/server/dto/system-logs.dto.ts`
- Tambah field `page` ke schema (ganti `offset` dengan `page`)
- Tambah field `sortBy` dan `sortOrder`

---

### Tahap 8: System Logs — Fix Frontend Type & Row Key
**File:** `app/app/pages/dashboard/system-logs.vue`

- Pastikan response parsing menghasilkan `LogEntry[]` yang valid
- Fix row key: gunakan `timestamp` atau index sebagai row key (karena tidak ada `id`)
- Fix data extraction: pastikan `response.data.lines` adalah parsed `LogEntry[]`

**File:** `app/shared/types/system-log.ts`
- Pastikan type `LogEntry` sesuai dengan data yang di-return service

---

### Tahap 9: System Logs — Fix Statistik Level
**File:** `app/app/pages/dashboard/system-logs.vue`

- Sesuaikan `levelStats` computed agar match dengan level yang ada di pino:
  - TRACE (10), DEBUG (20), INFO (30), NOTICE (40), WARNING (50), ERROR (60), CRITICAL (70), FATAL (80), EMERGENCY (90)
- Update `levelOptions` jika diperlukan

**File:** `app/server/services/system-logs.service.ts`
- Fix `getStats()` method untuk menghitung semua level yang ada di file

---

### Tahap 10: System Logs — Buat Log Directory
**File:** `app/server/plugins/init-logs-dir.ts` (buat baru)
- Buat folder `logs/` saat aplikasi start jika belum ada
- Gunakan `fs.mkdirSync` dengan `recursive: true`

---

## Urutan Eksekusi

1. **Tahap 1** — Fix No Data duplikat (DataTable)
2. **Tahap 2** — Fix action filter case mismatch (activity-logs)
3. **Tahap 3** — Tambah login/logout logging (auth service)
4. **Tahap 4** — Tambah level & metadata ke activity logs
5. **Tahap 5** — Install pino & setup logger
6. **Tahap 10** — Buat log directory plugin
7. **Tahap 6** — Integrasi logger ke server
8. **Tahap 7** — Perbaiki service parsing system logs
9. **Tahap 8** — Fix frontend type & row key
10. **Tahap 9** — Fix statistik level

---

## File yang Perlu Diubah

| File | Aksi | Tahap |
|------|------|-------|
| `app/app/components/common/DataTable/DataTable.vue` | Edit | 1 |
| `app/app/pages/dashboard/activity-logs.vue` | Edit | 2 |
| `app/server/middleware/activity-logger.ts` | Edit | 2, 4 |
| `app/server/services/auth.service.ts` | Edit | 3 |
| `app/server/api/auth/logout.post.ts` | Buat baru | 3 |
| `app/server/utils/logger.ts` | Buat baru | 5 |
| `app/server/plugins/logger.ts` | Buat baru | 6 |
| `app/server/plugins/init-logs-dir.ts` | Buat baru | 10 |
| `app/server/services/system-logs.service.ts` | Edit | 7 |
| `app/server/dto/system-logs.dto.ts` | Edit | 7 |
| `app/app/pages/dashboard/system-logs.vue` | Edit | 8, 9 |
| `app/shared/types/system-log.ts` | Edit | 8 |
| `app/nuxt.config.ts` | Edit | 5 |
| `app/package.json` | Edit (install) | 5 |

---

## Estimasi

- **Tahap 1-4** (Activity Logs fixes): ~30 menit
- **Tahap 5-6** (Logger setup): ~20 menit
- **Tahap 7-10** (System Logs full fix): ~40 menit
- **Total**: ~90 menit
