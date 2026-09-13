# Task 06 — Master Data DDL (pengganti Global Tabel)

> Entrypoint folder (mode B). Urutan baca: `spec.md` → `flow-requirements.md` → `domain-api-ui.md` → `acceptance-tasks.md` → `verification.md`.

## Status

DONE

## Panduan baca

- Istilah kanonis: **Master Data** (dipilih user). Meta `master_tables / master_table_columns`, fisik `mst_<slug>`, baris = Data Master.
- Keputusan terkunci: **DDL dinamis** (bukan rows-JSON), 13 tipe kolom + operasi-teks `++ "" * / + -`, engine Task 05 sebagai konsumen (`Data Source type=master_data`).
- UI design digabung inline di folder ini (Storybook `stories/master-data/`) — tanpa folder `-ui-design` terpisah, sesuai permintaan tepat 3 folder.
