---
description: Verify implementation against specification
agent: qa
---

# Verification Phase

Feature:

$ARGUMENTS

Read:

- AGENTS.md
- docs/specs/$ARGUMENTS/requirements.md
- docs/specs/$ARGUMENTS/acceptance.md
- docs/specs/$ARGUMENTS/ui.md
- docs/specs/$ARGUMENTS/tasks.md

---

# 1. Type Safety

Run the project's typecheck commands.

Check:

- frontend TypeScript
- backend TypeScript

Do not ignore errors.

---

# 2. Lint

Run project linting.

Fix only feature-related lint issues.

---

# 3. Tests

Run relevant:

- unit tests
- integration tests
- API tests
- E2E tests

---

# 4. Build

Run:

- frontend build
- backend build

---

# 5. Acceptance Criteria

Check every acceptance criterion.

For each:

PASS
or
FAIL

Never assume PASS.

---

# 6. API Verification

Verify:

- request validation
- response structure
- authentication
- authorization
- error handling
- edge cases

---

# 7. UI Verification

Verify:

- page rendering
- loading
- empty
- error
- success
- validation
- disabled
- responsive layout
- keyboard interaction
- accessibility

---

# 8. Architecture Verification

Verify:

- no duplicated abstraction
- correct module boundaries
- correct data flow
- business logic placement
- API conventions
- design system usage

---

# Final Report

Return:

## Typecheck
PASS / FAIL

## Lint
PASS / FAIL

## Tests
PASS / FAIL

## Build
PASS / FAIL

## Acceptance Criteria
X / Y passed

## UI/UX
PASS / FAIL

## Accessibility
PASS / FAIL

## Architecture
PASS / FAIL

## Remaining Problems

List all remaining problems.

Do not claim DONE if critical verification fails.