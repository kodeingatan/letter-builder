# Audit Screenshots — Task 25

Placeholder directory for manual audit evidence (FR-002).

- Screenshots are **optional** per task spec (bukti `file:line` already satisfies AC-002). This folder is git-tracked via `.gitkeep` but **ignored for binaries** — see `apps/web/.gitignore` entry `docs/audit/screenshots/*`.
- During live audit (Appendix B) auditor captured browser screenshots per module/state/breakpoint (320/768/1024) but they are not committed as binary to keep repo lean. If needed, add PNGs here locally — `git status` will remain clean except `tasks/25-*.md` per BR-001 (screenshots are not required for Verified).
- To add: `docs/audit/screenshots/global-table_list.png`, `template_editor_canvas.png`, etc. Do not commit >5 MB; prefer WebP.

Verification fix for suggestion in verify report: directory now exists (`git status` still clean — placeholder `.gitkeep` tracked as doc, not app code).
