# Referensi Arsitektur — Statamic CMS → BMS

> Pemetaan arsitektur [Statamic CMS](https://github.com/statamic/cms) (Laravel flat-file CMS) ke tech stack BMS
> (Nuxt 4 + Nitro + TypeORM + SQLite + Naive UI). Statamic dipakai sebagai **referensi pola**,
> bukan sebagai dependensi — tidak ada kode Laravel di BMS.

## Diagram Adaptasi (Tech Stack BMS)

```mermaid
flowchart TD

subgraph group_framework["Nuxt Integration"]
  node_package["App bootstrap<br/>Nuxt config + plugin<br/>[nuxt.config.ts]"]
  node_providers["Server plugin &amp; DataSource<br/>DB init + seed + drift check<br/>[database.server.ts]"]
  node_routes["HTTP route surfaces<br/>file-based routes<br/>[server/api/* + app/pages/*]"]
end

subgraph group_content["Content &amp; Authoring"]
  node_domain["Content domain<br/>EntitySchema models<br/>[server/entities/*]"]
  node_contracts["Content contracts<br/>Zod DTO validation<br/>[server/dto/*]"]
  node_stache[("Metadata store<br/>SQLite + JSON rows<br/>[db.ts + orm-data-source.ts]")]
  node_entry_repository["Entity services<br/>plain-object services<br/>[server/services/*]"]
  node_content_files["Table defs &amp; row JSON<br/>global_tables + rows<br/>[global-table.service.ts]"]
  node_field_schema["Columns &amp; step fields<br/>authoring schema<br/>[global-table-columns.dto.ts]"]
  node_fieldtypes["Column types<br/>14 content transforms<br/>[column-type-catalog]"]
end

subgraph group_delivery["Delivery &amp; Rendering"]
  node_cp_ui["Dashboard Naive UI client<br/>authoring client<br/>[app/pages/dashboard/*]"]
  node_save_pipeline["Run save pipeline<br/>wizard autosave + complete<br/>[runs.service.ts]"]
  node_cp_controller["Dashboard API controllers<br/>Nitro route handlers<br/>[server/api/*]"]
  node_access_control["RBAC authorization<br/>route-guard + matrix<br/>[route-guard.ts]"]
  node_frontend["Document delivery<br/>HTML/PDF endpoints<br/>[documents.service.ts]"]
  node_templates["Rendering pipeline<br/>resolve tree runtime<br/>[rendering/pipeline.ts]"]
  node_static_cache["Projection cache<br/>navigation 30s + frozen PDF"]
end

subgraph group_extensions["Extensions &amp; Infrastructure"]
  node_api_graphql["REST data APIs<br/>no GraphQL (decision)<br/>[server/api/*]"]
  node_addons_events["Audit &amp; lifecycle hooks<br/>activity-logger + startup<br/>[activity-logger.ts]"]
  node_search["Table search &amp; lookup<br/>search/sort/lookup<br/>[table-data.service.ts]"]
  node_asset_imaging["Asset storage &amp; uploads<br/>storage allowlist + 5MB<br/>[storage.service.ts]"]
end

node_package -->|"boots"| node_providers
node_providers -->|"registers"| node_routes
node_routes -->|"document requests"| node_frontend
node_routes -->|"dashboard requests"| node_cp_controller
node_routes -->|"API requests"| node_api_graphql
node_cp_ui -->|"submits edits"| node_save_pipeline
node_save_pipeline -->|"completes"| node_cp_controller
node_access_control -->|"authorizes"| node_cp_controller
node_cp_controller -->|"uses schema"| node_field_schema
node_field_schema -->|"applies transforms"| node_fieldtypes
node_cp_controller -->|"validates through"| node_contracts
node_frontend -->|"queries"| node_contracts
node_api_graphql -->|"queries"| node_contracts
node_contracts -->|"served by"| node_entry_repository
node_entry_repository -->|"reads and writes"| node_stache
node_stache -->|"stores"| node_content_files
node_stache -->|"hydrates"| node_domain
node_frontend -->|"renders"| node_templates
node_templates -->|"augments"| node_domain
node_static_cache -->|"serves frozen"| node_frontend
node_addons_events -.->|"reacts to writes"| node_stache
node_addons_events -.->|"feeds search"| node_search
node_domain -->|"uses assets"| node_asset_imaging
```

## Tabel Pemetaan (Statamic → BMS)

| Statamic (Laravel) | BMS (Nuxt 4) | Catatan adaptasi |
|---|---|---|
| `Statamic.php` package bootstrap | `nuxt.config.ts` + `server/plugins/database.server.ts` | Bootstrap Nuxt: DB init, seed, drift check, startup self-check |
| Service & route providers | Nitro plugin + `server/utils/orm-data-source.ts` | DataSource singleton 23 EntitySchema; `server/api/*` file routes ganti `web.php` |
| `Entry.php` domain model | `server/entities/*.entity.ts` (EntitySchema) | `global_tables`, `components`, `templates`, `administrations`, `documents`, … |
| `Contracts/Data` interfaces | `server/dto/*.dto.ts` (Zod, bukan interface) | Kontrak = validasi runtime; service plain-object (bukan class) |
| Stache flat-file store | SQLite + `global_table_rows` (JSON-per-row) | Stache diadaptasi jadi metadata store relasional; search/sort service-level |
| `EntryRepository` | `*-*.service.ts` (`findAll/findOne/create/update/remove`) | Pola sama: repository melayani kontrak |
| YAML/Markdown content | Definisi tabel + row JSON + template content JSON | Konten = metadata + data, bukan file |
| `Blueprint.php` | Kolom Global Table + step fields administration | Schema authoring; `STEP_FIELD_TYPES` subset kolom |
| `Bard.php` fieldtype | Katalog 14 column types ([[column-type-catalog]]) | `++` concat + computed ops menggantikan transform Bard |
| CP Inertia/Vue + `App.vue` | Dashboard Nuxt + Naive UI (`app/pages/dashboard/*`) | `SavePipeline.js` → wizard autosave + atomic complete (`runs.service.ts`) |
| `EntriesController` (CP) | Nitro handlers `server/api/*` + `requireApiAccess` | Controller = route file; otorisasi via permission-matrix |
| `Authorize.php` middleware | `requireAuth`/`requireApiAccess` (`route-guard.ts`) | Guard allow/deny hanya client-side gating |
| `FrontendController` | `documents.service.ts` (`getHtml/getPdf`) + `/api/render/preview` | Delivery = HTML tersanitasi + PDF frozen |
| Antlers `Engine.php` | `server/utils/rendering/pipeline.ts` | Resolve tree (binding/loop/condition) → HTML DOM → PDF; satu engine generik |
| Static cache manager | Cache proyeksi navigasi 30 dtk + PDF tersimpan | Tidak ada full-page static cache (decision) |
| GraphQL `Manager.php` | REST saja — **tanpa GraphQL** (decision) | Alasan: RBAC per-URL berbasis REST; GraphQL akan melemahkan enforcement |
| `AddonRepository` + events | `activity-logger` + startup checks + coverage endpoint | Ekstensi = audit trail + health; addon runtime pihak-ketiga non-goal |
| `IndexManager` search | Search/sort/lookup per-tabel + `rows/lookup` | In-memory atas JSON store (batas skala didokumentasikan) |
| Filesystem `Manager` + Glide | `storage.service.ts` (allowlist subfolder + 5 MB) | Tanpa image transform on-the-fly (decision; upload + preview saja) |

## Keputusan Adaptasi (Decision Log)

- **D-01 REST-only**: tanpa GraphQL agar enforcement RBAC method+URL tetap utuh.
- **D-02 SQLite JSON-row store** sebagai pengganti Stache: cukup untuk skala instansi kecil–menengah; FTS per-tabel adalah batas upgrade.
- **D-03 Satu rendering pipeline** (Antlers → `pipeline.ts`): tidak ada PDF per-template.
- **D-04 Tanpa Glide**: imaging = upload + preview; transformasi gambar non-goal.
- **D-05 Blueprint = kolom + step fields**: dua schema authoring berbagi enum tipe (step = subset).

## Related Concepts

- [[core-concept]] — konsep implementasi keseluruhan di atas peta ini
- [[column-type-catalog]] — katalog 14 column types (pengganti Bard)
- [[administration-runtime]] — runtime penuh + `step_field` + nested component
- [[konsep-utama]] — rantai Data → Component → Template → Administration → Document
- [[architecture-principles]] — 7 prinsip yang dipertahankan dari adaptasi ini
