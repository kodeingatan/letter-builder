---

## description: Generate or update an SDD task specification from a single feature/context parameter

Generate or update a task specification using exactly one parameter.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the complete task/feature context.

Follow this workflow strictly.

# 1. Read Project Knowledge

Before generating the task, inspect and understand:

* `AGENTS.md`
* `docs/PRD.md`
* `docs/architecture.md`
* `docs/database.md`
* `docs/design-system.md`
* all existing files inside `tasks/`

Do not generate the task based only on the user input.

The task must be consistent with the project's Permanent Knowledge.

---

# 2. Understand Existing Tasks

Inspect the existing `tasks/` directory.

Determine:

* latest task number
* existing task naming convention
* whether the requested feature already exists
* whether the request is a new feature
* whether it is an enhancement to an existing task
* whether an existing task should be updated instead of creating a duplicate

Never create duplicate tasks.

If an existing task represents the same feature, update that task instead of creating another task.

---

# 3. Determine Task Identity

If creating a new task:

Determine the next sequential number.

Example:

```text
tasks/
├── 01-authentication.md
├── 02-user-management.md
└── 03-global-table.md
```

New task:

```text
tasks/04-component.md
```

Use:

```text
NN-kebab-case-name.md
```

Examples:

```text
04-component.md
05-template.md
06-role-permission.md
07-dashboard.md
```

The task filename must be concise and domain-oriented.

---

# 4. Determine Scope

Analyze the request and determine:

* objective
* actors
* business capability
* domain entities
* dependencies
* business rules
* API requirements
* database impact
* UI/UX impact
* frontend requirements
* backend requirements
* validation
* states
* security implications
* acceptance criteria
* testing requirements

Do not invent requirements that contradict the Permanent Knowledge.

If information is missing, make the smallest reasonable assumption and explicitly document it under `Assumptions`.

---

# 5. Generate Mini-Specification

Every task MUST be a complete mini-specification.

Do not create simple TODO documents.

The generated task must use this structure:

````md
# Task NN — {Task Name}

## Status

TODO

## Objective

{Clear objective of the feature}

## Context

{Why this feature exists and how it fits into the product}

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Actors

- ...

## Requirements

- ...

## Business Rules

- ...

## Domain

```text
Entity
├── ...
└── ...
````

## Data Model

### {Entity}

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| ...   | ...  | ...      | ...         |

## API

### List

```http
GET /...
```

### Create

```http
POST /...
```

### Detail

```http
GET /.../:id
```

### Update

```http
PATCH /.../:id
```

### Delete

```http
DELETE /.../:id
```

Include request/response contracts when necessary.

## UI/UX

### Information Architecture

Describe where this feature lives in the application.

### List

* ...

### Create / Editor

* ...

### Detail

* ...

### Interaction

* ...

### States

* loading
* empty
* error
* success
* validation
* disabled
* permission denied

### Responsive Behavior

Describe desktop/tablet/mobile behavior where relevant.

### Design System

Follow:

* `docs/design-system.md`
* existing component patterns
* existing interaction patterns

Do not introduce arbitrary colors, typography, spacing, or interaction patterns.

## Validation

* ...

## Security & Permission

* ...

## Dependencies

* ...

## Acceptance Criteria

### AC-001

Given ...

When ...

Then ...

### AC-002

Given ...

When ...

Then ...

## Implementation

### Backend

* [ ] Entity
* [ ] Migration
* [ ] DTO
* [ ] Validation
* [ ] Repository
* [ ] Service
* [ ] Controller
* [ ] Authorization
* [ ] Unit tests
* [ ] Integration/API tests

### Frontend

* [ ] API service
* [ ] Types
* [ ] Store/composable
* [ ] Page
* [ ] Components
* [ ] Form
* [ ] Validation
* [ ] Loading state
* [ ] Empty state
* [ ] Error state
* [ ] Success state
* [ ] Permission state
* [ ] Responsive behavior
* [ ] Unit tests
* [ ] E2E tests

## Verification

* [ ] Typecheck
* [ ] Lint
* [ ] Unit test
* [ ] Integration test
* [ ] API test
* [ ] E2E test
* [ ] Database verification
* [ ] Permission verification
* [ ] UI/UX verification
* [ ] Responsive verification
* [ ] Design-system consistency verification

## Assumptions

* ...

## Open Questions

* ...

## Related Knowledge

* `docs/PRD.md`
* `docs/architecture.md`
* `docs/database.md`
* `docs/design-system.md`

## Change Log

### Initial

* Task specification created.

````

Only include sections that are relevant, but the following sections are mandatory:

- Status
- Objective
- Requirements
- Business Rules
- Domain
- UI/UX
- Acceptance Criteria
- Implementation
- Verification

---

# 6. Acceptance Criteria

Acceptance Criteria MUST be testable.

Use:

```text
Given
When
Then
````

Avoid vague criteria such as:

```text
- Feature works correctly.
- UI looks good.
- CRUD works.
```

Instead:

```md
### AC-001

Given the user is on the Global Table list

When the user clicks "Create"

Then the Global Table editor is displayed.
```

Create enough acceptance criteria to cover:

* happy path
* validation
* error handling
* empty state
* permissions
* important business rules
* destructive actions
* edge cases

---

# 7. UI/UX Specification

UI/UX is part of the task specification, not an afterthought.

The task MUST describe:

* information architecture
* user flow
* page/workspace structure
* primary action
* secondary actions
* forms
* tables/lists
* navigation
* dialogs/drawers
* feedback
* loading
* empty states
* error states
* validation
* confirmation
* responsive behavior

The UI must follow the project's existing Design System.

The application should not regress into a generic admin dashboard if the project's design direction specifies a modern desktop/workspace-oriented experience.

---

# 8. Cross-Document Consistency

After generating the task, verify consistency against:

```text
PRD
Architecture
Database
Design System
Existing Tasks
```

Check for:

* conflicting terminology
* conflicting entity names
* conflicting API conventions
* conflicting database rules
* conflicting UI patterns
* duplicated functionality
* dependency problems
* missing requirements

If a conflict is found:

DO NOT silently overwrite Permanent Knowledge.

Document it under:

```md
## Open Questions
```

and explain the conflict.

---

# 9. Do Not Implement

This command ONLY generates or updates the task specification.

Do NOT:

* modify application source code
* create entities
* create controllers
* create services
* create Vue/Nuxt components
* create migrations
* install packages
* run implementation

The output of this command is the SDD task specification only.

---

# 10. Final Response

After generating/updating the task, report:

```text
Task: tasks/NN-task-name.md

Action:
- CREATED
or
- UPDATED

Objective:
...

Affected Areas:
- Backend
- Frontend
- Database
- UI/UX

Dependencies:
...

Consistency:
- PRD: OK/CONFLICT
- Architecture: OK/CONFLICT
- Database: OK/CONFLICT
- Design System: OK/CONFLICT

Next recommended step:

/plan tasks/NN-task-name.md
```

Do not provide implementation code unless explicitly requested.
