---
description: Implement a feature from its specification
agent: build
---

# Implementation Phase

Feature:

$ARGUMENTS

The specification is the source of truth.

Read:

- AGENTS.md
- docs/specs/$ARGUMENTS/requirements.md
- docs/specs/$ARGUMENTS/domain.md
- docs/specs/$ARGUMENTS/api.md
- docs/specs/$ARGUMENTS/ui.md
- docs/specs/$ARGUMENTS/acceptance.md
- docs/specs/$ARGUMENTS/tasks.md

---

# RULE 1 — Inspect First

Before modifying code:

- inspect relevant existing code
- identify reusable components
- identify reusable services
- identify existing API patterns
- identify existing validation patterns
- identify existing UI patterns

---

# RULE 2 — Follow Tasks

Implement tasks in order.

Do not skip tasks.

Do not implement unspecified functionality.

Do not modify unrelated features.

---

# RULE 3 — Backend

Follow NestJS architecture.

Use:

- controllers
- services
- DTOs
- entities/repositories
- guards
- validation

as appropriate.

Keep controllers thin.

---

# RULE 4 — Frontend

Follow Nuxt/Vue architecture.

Reuse:

- components
- composables
- stores
- utilities
- design-system primitives

Do not duplicate logic.

---

# RULE 5 — UI/UX

Follow ui.md exactly.

Verify:

- visual hierarchy
- spacing
- responsive behavior
- keyboard interaction
- loading
- empty
- error
- success
- validation
- disabled states

Do not create generic AI-looking UI.

---

# RULE 6 — Incremental Implementation

Implement one logical task at a time.

After meaningful changes:

- inspect changed files
- run relevant checks
- fix errors immediately

---

# RULE 7 — Testing

Add appropriate tests.

At minimum verify behavior required by:

acceptance.md

---

# RULE 8 — Scope

Do not:

- rewrite unrelated code
- upgrade dependencies unnecessarily
- rename unrelated files
- refactor unrelated architecture

---

# RULE 9 — Completion

Do not claim completion yet.

After implementation, report:

- files changed
- tasks completed
- tests added
- known issues
- remaining verification steps