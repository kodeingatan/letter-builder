---

## description: Verify the implementation against the task specification

Verify the implementation against the task specification and run all checks.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Verify that the implementation satisfies the task specification.

The goal is to answer:

> "Does the implementation match the task requirements? Are there any issues?"

The output is a verification report with pass/fail status for each criterion.

---

# 2. Identify the Task

Determine which task to verify.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-nuxt.md`) → use that file
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

Read the identified task file completely.

---

# 3. Read Project Knowledge

Before verifying, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

These define the standards the implementation must meet.

---

# 4. Understand Anything

If `.ua/` exists, use it to verify:

- module relationships are correct
- entity relationships are correct
- architecture boundaries are respected
- patterns are consistent

---

# 5. Verification Checklist

Verify against each criterion from the task specification.

### 5.1 Code Verification

Check that all files listed in the Implementation section exist:

```markdown
## Implementation

### Backend

* [ ] Entity → verify entity file exists
* [ ] Service → verify service file exists
* [ ] API routes → verify route files exist
* [ ] DTO → verify DTO file exists
```

For each implemented item:

1. Read the file
2. Verify it follows project conventions
3. Verify it matches the task requirements
4. Verify it works with existing code

### 5.2 Convention Verification

Check that the implementation follows project conventions:

| Convention | Check |
|------------|-------|
| Naming | Files, functions, variables follow existing patterns |
| Structure | Files are in correct directories |
| Imports | Import paths use correct aliases |
| Types | TypeScript types are correct, no unnecessary `any` |
| Error handling | Follows existing error handling patterns |
| Validation | Uses Zod DTOs for API validation |
| Auth | Uses JWT verification pattern |
| RBAC | Follows RBAC patterns |

### 5.3 Integration Verification

Check that the implementation integrates with existing code:

1. New entities are registered in `server/utils/db.ts`
2. New services are importable from API routes
3. New API routes are accessible
4. New frontend components render correctly
5. New stores/composables work with existing code

### 5.4 Test Verification

Run existing tests:

```bash
# From apps/web/
npm run test          # All tests
npm run test:unit     # Unit tests
npm run test:nuxt     # Component tests
```

Verify:

- [ ] All existing tests still pass
- [ ] New tests are written (if required by task)
- [ ] New tests pass

### 5.5 Build Verification

```bash
# From apps/web/
npm run build         # Production build
```

Verify:

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No import resolution errors

### 5.6 Runtime Verification

```bash
# From apps/web/
npm run dev           # Development server
```

Verify:

- [ ] Server starts without errors
- [ ] API endpoints respond correctly
- [ ] Pages render without errors
- [ ] No console errors in browser

---

# 6. Verification Report

Generate a verification report:

````md
# Verification Report — Task NN: {Task Name}

## Summary

- **Status**: PASS / FAIL / PARTIAL
- **Date**: {date}
- **Verified by**: /verify command

## Checklist

### Code Implementation

| Item | Status | Notes |
|------|--------|-------|
| Entity created | PASS/FAIL | {notes} |
| Service created | PASS/FAIL | {notes} |
| API routes created | PASS/FAIL | {notes} |
| DTO created | PASS/FAIL | {notes} |
| Frontend page created | PASS/FAIL | {notes} |
| Components created | PASS/FAIL | {notes} |

### Convention Compliance

| Convention | Status | Notes |
|------------|--------|-------|
| Naming conventions | PASS/FAIL | {notes} |
| File structure | PASS/FAIL | {notes} |
| Import patterns | PASS/FAIL | {notes} |
| Error handling | PASS/FAIL | {notes} |
| Type safety | PASS/FAIL | {notes} |

### Integration

| Integration | Status | Notes |
|-------------|--------|-------|
| Entity registered | PASS/FAIL | {notes} |
| Service importable | PASS/FAIL | {notes} |
| API routes accessible | PASS/FAIL | {notes} |
| Frontend renders | PASS/FAIL | {notes} |

### Tests

| Test Type | Status | Notes |
|-----------|--------|-------|
| Unit tests | PASS/FAIL/SKIPPED | {notes} |
| Component tests | PASS/FAIL/SKIPPED | {notes} |
| E2E tests | PASS/FAIL/SKIPPED | {notes} |
| Existing tests pass | PASS/FAIL | {notes} |

### Build & Runtime

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript build | PASS/FAIL | {notes} |
| Production build | PASS/FAIL | {notes} |
| Dev server starts | PASS/FAIL | {notes} |
| API endpoints work | PASS/FAIL | {notes} |
| Pages render | PASS/FAIL | {notes} |

## Issues Found

### Critical

- {issue that must be fixed}

### Minor

- {issue that should be fixed}

### Suggestions

- {optional improvement}

## Verification Commands Run

```bash
npm run test          # {result}
npm run build         # {result}
npm run dev           # {result}
```

## Conclusion

{summary of verification results}

## Recommended Action

- [ ] Fix critical issues before review
- [ ] Proceed to /review
- [ ] Task is complete
````

---

# 7. Issue Classification

### Critical

Issues that MUST be fixed before proceeding:

- Code does not compile
- Existing tests fail
- Security vulnerabilities
- Data loss risks
- Breaking changes to existing functionality

### Minor

Issues that SHOULD be fixed but are not blocking:

- Convention violations
- Missing error handling
- Missing validation
- Missing types

### Suggestions

Optional improvements:

- Code optimization
- Additional tests
- Documentation updates

---

# 8. Auto-Fix Critical Issues

If critical issues are found:

1. Report the issue
2. Ask the user if they want to fix it
3. If yes, fix the issue
4. Re-verify

Do NOT auto-fix minor issues or suggestions.

---

# 9. Do Not

Do NOT:

- skip verification steps
- ignore failing tests
- approve code with critical issues
- modify code (except auto-fix critical issues)
- commit changes

Exception: updating `tasks/task-logs.md` per #11 IS required and allowed.

---

# 10. Final Response

After verification, return:

```text
Verification Complete

Task: tasks/NN-task-name.md
Status: PASS / FAIL / PARTIAL

Critical Issues: N
Minor Issues: N
Suggestions: N

Tests: {pass}/{total} passing
Build: PASS/FAIL

Task Logs:
- tasks/task-logs.md updated — Verified checked for this task if Status PASS, otherwise left unchecked (see #11)

Next Step:

# If PASS:
/review tasks/NN-task-name.md

# If FAIL:
Fix issues, then:
/verify tasks/NN-task-name.md
```

---

# 11. Update Task Logs (Mandatory Final Step)

After `/verify` finishes, you MUST update `tasks/task-logs.md` by checking off what has been verified.

This step is mandatory — do NOT skip it.

### 11.1 Rules

1. Read `tasks/task-logs.md`. If it does not exist → CREATE it using the template in `/gen-tasks` #23.2, then apply rule 2.
2. Update ONLY the verification tracking for the current task (`tasks/NN-task-name.md`):
   - If Status is **PASS**:
     - Overview table: set `Verified` column to `[x]` for this task row.
     - Move entry from `## Belum Diverifikasi` (`- [ ] tasks/NN-...`) to `## Sudah Diverifikasi` (`- [x] tasks/NN-... — {Task Name} — {date} by /verify — PASS`).
     - Detail per Task: set `Verified: [x] {date} by /verify — {summary: tests/build results}`.
   - If Status is **FAIL / PARTIAL**:
     - Do NOT check `[x]`. Keep `[ ]` in Overview and `Belum Diverifikasi`.
     - Detail per Task: set `Verified: [ ] {date} by /verify — FAIL/PARTIAL: {N critical, N minor — see report}`.
   - Update `## Last Updated` (`Date`, `By: /verify`, task file name).
3. Do NOT touch `Implemented` or `Reviewed` checklists — those belong to `/implement` and `/review`.
4. Do NOT reset any existing `[x]` to `[ ]`.
5. Only mark `Verified [x]` when verification genuinely PASSED (build + tests + checklist per #5).

### 11.2 Verification

Before finishing `/verify`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task `Verified` state matches verification Status (PASS → `[x]`, FAIL/PARTIAL → `[ ]`)
- [ ] Current task in correct section (Sudah vs Belum Diverifikasi)
- [ ] Implemented / Reviewed states untouched
