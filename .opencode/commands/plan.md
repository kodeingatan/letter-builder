---
description: Analyze specification and create implementation plan
agent: architect
---

# Implementation Planning

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

---

# Step 1 — Inspect Repository

Inspect the existing implementation.

Check:

Frontend:

- pages
- layouts
- components
- composables
- stores
- services
- types

Backend:

- modules
- controllers
- services
- DTOs
- entities
- repositories
- guards
- tests

---

# Step 2 — Architecture Analysis

Determine:

- existing abstractions to reuse
- new abstractions required
- affected modules
- affected files
- dependencies
- data flow
- API flow
- UI flow

Do not duplicate existing functionality.

---

# Step 3 — Implementation Strategy

Determine implementation order.

Prefer:

1. database/domain
2. backend
3. API
4. frontend data layer
5. UI
6. tests
7. verification

Adjust the order if the architecture requires otherwise.

---

# Step 4 — Update tasks.md

Update:

docs/specs/$ARGUMENTS/tasks.md

Each task must include:

- ID
- description
- affected files
- dependencies
- verification method

---

# Step 5 — Risks

Document:

- technical risks
- architecture risks
- UX risks
- security risks
- performance risks

---

# IMPORTANT

Do not implement code.

The result of this command must be an implementation plan.