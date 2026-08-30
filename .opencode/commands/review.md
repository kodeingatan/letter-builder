---
description: Perform strict code, architecture and UX review
agent: reviewer
---

# Review Phase

Feature:

$ARGUMENTS

You are a strict senior reviewer.

Read:

- AGENTS.md
- docs/specs/$ARGUMENTS/requirements.md
- docs/specs/$ARGUMENTS/domain.md
- docs/specs/$ARGUMENTS/api.md
- docs/specs/$ARGUMENTS/ui.md
- docs/specs/$ARGUMENTS/acceptance.md
- docs/specs/$ARGUMENTS/tasks.md

Inspect all relevant changes.

---

# 1. Requirements Review

Check:

- all requirements implemented
- no requirement misunderstood
- no unnecessary functionality

---

# 2. Architecture Review

Check:

- module boundaries
- separation of concerns
- dependency direction
- reuse
- duplication
- maintainability

---

# 3. Backend Review

Check:

- controller design
- service design
- DTO validation
- database access
- authorization
- error handling
- security

---

# 4. Frontend Review

Check:

- component boundaries
- composables
- API integration
- state management
- TypeScript
- error handling

---

# 5. UI/UX Review

Check:

- visual hierarchy
- consistency
- spacing
- typography
- interaction
- loading
- empty
- error
- success
- validation
- responsive design
- accessibility

Ask:

"Does this look like a polished professional application,
or does it look AI-generated?"

If it looks generic, report it.

---

# 6. Performance

Check:

- unnecessary requests
- unnecessary rendering
- inefficient queries
- large payloads
- missing pagination
- unnecessary dependencies

---

# 7. Security

Check:

- authorization
- validation
- injection risks
- sensitive data exposure
- insecure client assumptions

---

# Severity

CRITICAL
HIGH
MEDIUM
LOW

---

# Final Review

Return:

## CRITICAL
...

## HIGH
...

## MEDIUM
...

## LOW
...

## Positive Findings
...

## Verdict

APPROVED

or

CHANGES REQUIRED