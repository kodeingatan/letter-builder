---
description: Run the complete Spec-Driven Development workflow
agent: build
---

# Feature Development Workflow

Requested feature:

$ARGUMENTS

You must follow the complete SDD lifecycle.

---

# PHASE 1 — SPECIFICATION

First determine whether a specification exists.

Expected location:

docs/specs/<feature>/

If the specification does not exist:

STOP.

Tell the user to run:

/spec <feature>

Do not implement an unspecified feature.

---

# PHASE 2 — PLAN

Read:

requirements.md
domain.md
api.md
ui.md
acceptance.md
tasks.md

Inspect the repository.

Ensure tasks.md contains a valid implementation plan.

---

# PHASE 3 — IMPLEMENT

Implement tasks incrementally.

Follow:

AGENTS.md

Do not modify unrelated code.

---

# PHASE 4 — VERIFY

Verify:

- typecheck
- lint
- tests
- build
- acceptance criteria
- UI/UX
- accessibility

---

# PHASE 5 — REVIEW

Perform strict review.

Check:

- requirements
- architecture
- backend
- frontend
- UI/UX
- security
- performance
- maintainability

---

# PHASE 6 — FIX

If review reports:

CRITICAL
or
HIGH

fix them.

Then run verification again.

---

# PHASE 7 — FINAL

Only report DONE if:

- all required tasks are complete
- acceptance criteria pass
- verification passes
- no CRITICAL findings
- no HIGH findings

Final report:

Feature:
Status:
Requirements:
Acceptance:
Tests:
Build:
UI/UX:
Review:
Remaining risks:
