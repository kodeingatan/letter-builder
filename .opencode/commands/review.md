---
description: Review the implementation quality and provide feedback
---

Review the implementation quality, architecture decisions, and code quality.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Perform a thorough code review of the implementation.

The goal is to answer:

> "Is the implementation high quality? Does it follow best practices? Are there improvements needed?"

The output is a review report with actionable feedback.

---

# 2. Identify the Task

Determine which task to review.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-nuxt.md`) → use that file
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

Read the identified task file completely.

---

# 3. Read Project Knowledge

Before reviewing, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

These define the standards the implementation should meet.

---

# 4. Understand Anything

If `.ua/` exists, use it to verify:

- architecture consistency
- pattern consistency
- module relationship correctness
- entity relationship correctness

---

# 5. Review Criteria

Review the implementation against these criteria:

### 5.1 Architecture

| Criterion | Check |
|-----------|-------|
| Separation of concerns | Is logic properly separated? |
| Dependency direction | Are dependencies pointing the right way? |
| Module boundaries | Are module boundaries respected? |
| API design | Is the API consistent with existing endpoints? |
| Data flow | Is the data flow clear and correct? |

### 5.2 Code Quality

| Criterion | Check |
|-----------|-------|
| Readability | Is the code easy to understand? |
| Naming | Are names descriptive and consistent? |
| Functions | Are functions focused and not too long? |
| Types | Are TypeScript types correct and complete? |
| Comments | Are complex parts documented? |

### 5.3 Security

| Criterion | Check |
|-----------|-------|
| Authentication | Is auth properly checked? |
| Authorization | Is RBAC properly enforced? |
| Input validation | Is all input validated? |
| SQL injection | Are queries safe? |
| XSS | Is output properly escaped? |
| Secrets | Are secrets not hardcoded? |

### 5.4 Performance

| Criterion | Check |
|-----------|-------|
| N+1 queries | Are queries optimized? |
| Pagination | Is pagination implemented? |
| Caching | Is caching considered? |
| Bundle size | Are imports optimized? |

### 5.5 Maintainability

| Criterion | Check |
|-----------|-------|
| Testability | Is the code testable? |
| Error handling | Are errors handled properly? |
| Logging | Is logging appropriate? |
| Documentation | Is the code self-documenting? |

### 5.6 Consistency

| Criterion | Check |
|-----------|-------|
| Pattern consistency | Does it follow existing patterns? |
| Naming consistency | Does it use existing naming conventions? |
| Structure consistency | Does it follow existing file structure? |
| Import consistency | Does it use correct import aliases? |

---

# 6. Review Process

### 6.1 Read All Changed Files

Read every file that was created or modified.

### 6.2 Compare with Existing Code

Compare the new code with existing similar code:

- Are patterns consistent?
- Are conventions followed?
- Is the quality comparable?

### 6.3 Check Task Compliance

Verify the implementation satisfies all task requirements:

- All acceptance criteria met
- All business rules implemented
- All UI/UX requirements satisfied
- All security requirements met

### 6.4 Identify Improvements

Identify:

- code smells
- potential bugs
- performance issues
- security concerns
- architecture violations
- missing error handling
- missing validation
- missing tests

---

# 7. Review Report

Generate a review report:

````md
# Review Report — Task NN: {Task Name}

## Summary

- **Status**: APPROVED / CHANGES REQUESTED / REVISION NEEDED
- **Date**: {date}
- **Reviewer**: /review command

## Architecture Review

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Separation of concerns | OK/ISSUE | {notes} |
| Dependency direction | OK/ISSUE | {notes} |
| Module boundaries | OK/ISSUE | {notes} |
| API consistency | OK/ISSUE | {notes} |

## Code Quality Review

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Readability | OK/ISSUE | {notes} |
| Naming | OK/ISSUE | {notes} |
| Function design | OK/ISSUE | {notes} |
| Type safety | OK/ISSUE | {notes} |
| Documentation | OK/ISSUE | {notes} |

## Security Review

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Authentication | OK/ISSUE | {notes} |
| Authorization | OK/ISSUE | {notes} |
| Input validation | OK/ISSUE | {notes} |
| SQL injection | OK/ISSUE | {notes} |
| Secrets | OK/ISSUE | {notes} |

## Performance Review

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Query optimization | OK/ISSUE | {notes} |
| Pagination | OK/ISSUE | {notes} |
| Import optimization | OK/ISSUE | {notes} |

## Task Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| {requirement 1} | MET/NOT MET | {notes} |
| {requirement 2} | MET/NOT MET | {notes} |

## Issues

### Must Fix (Before Approval)

1. **{issue title}**
   - File: `{file path}`
   - Line: {line number}
   - Problem: {what is wrong}
   - Solution: {how to fix}

### Should Fix (Recommended)

1. **{issue title}**
   - File: `{file path}`
   - Problem: {what is wrong}
   - Solution: {how to fix}

### Consider (Optional)

1. **{improvement title}**
   - {description}

## Positive Notes

- {what was done well}
- {good patterns used}
- {clean code examples}

## Conclusion

{overall assessment}

## Recommended Action

- [ ] Fix must-fix issues
- [ ] Consider should-fix issues
- [ ] Approve implementation
- [ ] Request re-review after fixes
````

---

# 8. Review Quality Rules

### Be Specific

BAD:

```text
Code quality could be better.
```

GOOD:

```text
The `createUser` function in `server/services/users.service.ts:45` is 120 lines long.
Consider extracting the password validation logic into a separate function.
```

### Be Actionable

Every issue should have a clear solution.

### Be Fair

- Acknowledge what was done well
- Focus on improving the code, not criticizing
- Provide constructive feedback

### Be Thorough

- Review all changed files
- Check all task requirements
- Consider edge cases

---

# 9. Severity Levels

### Must Fix

Issues that block approval:

- Security vulnerabilities
- Data loss risks
- Breaking existing functionality
- Architecture violations
- Missing required functionality

### Should Fix

Issues that should be addressed:

- Convention violations
- Missing error handling
- Missing validation
- Code smells
- Performance issues

### Consider

Optional improvements:

- Code optimization
- Additional tests
- Documentation improvements
- Refactoring suggestions

---

# 10. Approval Criteria

The implementation can be approved when:

- [ ] All must-fix issues resolved
- [ ] All task requirements met
- [ ] No security vulnerabilities
- [ ] No breaking changes to existing functionality
- [ ] Code follows project conventions
- [ ] Tests pass
- [ ] Build succeeds

---

# 11. Do Not

Do NOT:

- approve code with critical issues
- skip reviewing changed files
- ignore security concerns
- approve without reading the code
- modify code (this is review only)

Exception: updating `tasks/task-logs.md` per #13 IS required and allowed.

---

# 12. Final Response

After review, return:

```text
Review Complete

Task: tasks/NN-task-name.md
Status: APPROVED / CHANGES REQUESTED / REVISION NEEDED

Must Fix: N issues
Should Fix: N issues
Consider: N suggestions

Task Logs:
- tasks/task-logs.md updated — Reviewed checked for this task if Status APPROVED, otherwise left unchecked (see #13)

Next Step:

# If APPROVED:
Task is complete! Consider:
- Updating task status to DONE
- Running /knowledge if significant changes

# If CHANGES REQUESTED:
Fix the issues, then:
/implement tasks/NN-task-name.md
/verify tasks/NN-task-name.md
/review tasks/NN-task-name.md

# If REVISION NEEDED:
The task specification may need updating:
/task "describe what needs to change"
```

---

# 13. Update Task Logs (Mandatory Final Step)

After `/review` finishes, you MUST update `tasks/task-logs.md` by checking off what has been reviewed.

This step is mandatory — do NOT skip it.

### 13.1 Rules

1. Read `tasks/task-logs.md`. If it does not exist → CREATE it using the template in `/gen-tasks` #23.2, then apply rule 2.
2. Update ONLY the review tracking for the current task (`tasks/NN-task-name.md`):
   - If Status is **APPROVED**:
     - Overview table: set `Reviewed` column to `[x]` for this task row.
     - Move entry from `## Belum Direview` (`- [ ] tasks/NN-...`) to `## Sudah Direview` (`- [x] tasks/NN-... — {Task Name} — {date} by /review — APPROVED`).
     - Detail per Task: set `Reviewed: [x] {date} by /review — APPROVED: {short summary}`.
     - Optionally update the task file `## Status` to `DONE` if it was `TODO REVIEW` and review is APPROVED.
   - If Status is **CHANGES REQUESTED / REVISION NEEDED**:
     - Do NOT check `[x]`. Keep `[ ]` in Overview and `Belum Direview`.
     - Detail per Task: set `Reviewed: [ ] {date} by /review — CHANGES REQUESTED/REVISION NEEDED: {N must-fix, N should-fix}`.
   - Update `## Last Updated` (`Date`, `By: /review`, task file name).
3. Do NOT touch `Implemented` or `Verified` checklists — those belong to `/implement` and `/verify`.
4. Do NOT reset any existing `[x]` to `[ ]`.
5. Only mark `Reviewed [x]` when review genuinely APPROVED (no must-fix issues, per #10 Approval Criteria).

### 13.2 Verification

Before finishing `/review`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task `Reviewed` state matches review Status (APPROVED → `[x]`, otherwise → `[ ]`)
- [ ] Current task in correct section (Sudah vs Belum Direview)
- [ ] Implemented / Verified states untouched
