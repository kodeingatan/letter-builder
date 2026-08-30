---
description: Create or update a feature specification
agent: product
---

# Spec-Driven Development — Specification Phase

The user wants to create or modify a feature:

$ARGUMENTS

You are responsible for creating a complete specification.

DO NOT implement application code.

---

## Step 1 — Understand

Read:

- AGENTS.md
- existing documentation
- existing relevant specifications

Inspect the repository when necessary.

Determine:

- user goal
- business goal
- actors
- use cases
- constraints
- dependencies
- edge cases

---

## Step 2 — Inspect Existing System

Before creating requirements, inspect:

- existing routes
- existing modules
- existing database entities
- existing API conventions
- existing UI components
- existing composables
- existing design system

Avoid proposing functionality that already exists.

---

## Step 3 — Create Specification

Create:

docs/specs/<feature>/

Use:

requirements.md
domain.md
api.md
ui.md
acceptance.md
tasks.md

---

## requirements.md

Define:

- problem
- objective
- actors
- user stories
- functional requirements
- business rules
- edge cases
- constraints

Requirements must have unique IDs.

Example:

REQ-001
REQ-002
REQ-003

---

## domain.md

Define:

- entities
- properties
- relationships
- states
- invariants
- domain rules

---

## api.md

Define:

- endpoints
- HTTP methods
- authentication
- request parameters
- request body
- validation
- response structure
- errors
- pagination/filtering/sorting if required

---

## ui.md

Define:

- pages
- layouts
- navigation
- components
- interactions
- forms
- tables
- responsive behavior
- loading states
- empty states
- error states
- success states
- accessibility requirements

Follow the existing design system.

---

## acceptance.md

Create testable acceptance criteria.

Use:

Given
When
Then

Each criterion must map to one or more requirements.

---

## tasks.md

Break implementation into small tasks.

Each task must:

- be independently understandable
- have a clear scope
- identify affected layer
- be verifiable

Example:

TASK-001 Database
TASK-002 Backend domain
TASK-003 Backend API
TASK-004 Frontend data layer
TASK-005 UI
TASK-006 Tests
TASK-007 Verification

---

## Final Rule

Do not write implementation code.

If requirements are ambiguous:

STOP and ask for clarification.

Do not invent product behavior.