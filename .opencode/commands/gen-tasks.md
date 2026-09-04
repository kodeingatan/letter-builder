---

## description: Generate the complete SDD task roadmap from one Core Concept and project context

# Generate Complete Tasks

Generate the complete `tasks/` specification roadmap from exactly ONE parameter containing the project's general information and Core Concept.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the high-level product and Core Concept definition.

This command generates the FEATURE ROADMAP and MINI-SPECIFICATIONS.

It does NOT implement application code.

---

# 1. Objective

Transform one high-level Core Concept into a complete, logically ordered set of SDD task specifications.

The goal is to answer:

> "What features must be built to turn this Core Concept into a production-ready application?"

The output is:

```text
tasks/
├── 01-xxx.md
├── 02-xxx.md
├── 03-xxx.md
├── ...
└── NN-xxx.md
```

Every task must be a complete mini-specification.

Do NOT generate simple TODO lists.

---

# 2. Project Understanding

Before generating tasks, inspect the existing project.

Read:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

Also inspect:

```text
tasks/
```

if it already exists.

---

# 3. Understand Anything

If the project contains Understand Anything knowledge, use it as supplementary codebase context.

Check whether:

```text
.ua/
```

exists.

If available, use it to understand:

* existing modules
* existing entities
* existing relationships
* architecture
* dependencies
* existing features
* project boundaries
* implementation patterns

Priority:

```text
Current Source Code
        ↓
Tests / Configuration
        ↓
Understand Anything
        ↓
AGENTS.md
        ↓
Permanent Knowledge
        ↓
User Core Concept
```

When generating tasks for an existing project, do not generate tasks for functionality that already exists unless the user explicitly requests a rebuild or enhancement.

Do NOT modify `.ua/`.

---

# 4. Input

The entire input is:

```text
$ARGUMENTS
```

Example:

```text
/tasks "Platform aplikasi bisnis dinamis dengan Core Concept Global Table → Component → Template → Administration. Administrator dapat mendefinisikan struktur data, membangun component, menyusun template, dan mengelola aplikasi secara dinamis."
```

The input may contain:

* product idea
* Core Concept
* business domain
* target users
* technology information
* major capabilities
* constraints
* high-level workflows

Do not require the user to provide a task list.

The command must derive the task list.

---

# 5. Core Concept Analysis

Extract:

### Product

What is being built?

### Users

Who uses the system?

### Business Domain

What business problem does it solve?

### Core Entities

What are the central entities?

### Relationships

How do the entities interact?

### Lifecycle

How does the system operate from beginning to production?

Represent the Core Concept as a model.

Example:

```text
Global Table
      │
      ▼
Component
      │
      ▼
Template
      │
      ▼
Administration
      │
      ▼
Generated Application
```

Do not assume this exact model.

Derive it from `$ARGUMENTS` and project knowledge.

---

# 6. Feature Decomposition

Break the Core Concept into functional capabilities.

Consider, where relevant:

```text
Foundation
Authentication
Authorization
User Management
Role & Permission
Core Domain
Configuration
Master Data
Transactions
Workflow
Search
Filtering
Import
Export
Notifications
Audit Log
Dashboard
Reporting
Settings
Administration
Integration
Security
Testing
Production Readiness
```

Do not blindly create every category.

Only generate capabilities relevant to the product.

---

# 7. Dependency Analysis

Determine the correct dependency order.

Example:

```text
Authentication
      ↓
User Management
      ↓
Role & Permission
      ↓
Global Table
      ↓
Component
      ↓
Template
      ↓
Administration
```

Tasks must be ordered based on actual dependencies.

Do NOT order tasks merely by UI navigation order.

---

# 8. Task Granularity

Each task should represent one meaningful feature capability.

GOOD:

```text
01-authentication.md
02-user-management.md
03-role-permission.md
04-global-table.md
05-global-table-column.md
06-component.md
07-component-property.md
08-template.md
09-administration.md
```

BAD:

```text
01-create-button.md
02-create-input.md
03-create-modal.md
04-create-table.md
```

UI elements should normally belong to the feature task that owns them.

Avoid both:

### Too Large

```text
01-build-entire-application.md
```

### Too Small

```text
01-add-button.md
02-add-input.md
```

The target is:

```text
Business Capability
        ↓
Feature Task
        ↓
Implementation Plan
```

---

# 9. Existing Tasks

If `tasks/` already contains tasks:

1. inspect all existing tasks
2. identify completed functionality
3. identify TODO functionality
4. identify overlapping tasks
5. identify missing capabilities
6. preserve existing valid tasks
7. update tasks only when necessary
8. never create duplicates

Do not renumber existing tasks casually.

If the existing task structure already represents the correct roadmap, extend it rather than rebuilding it.

---

# 10. Determine Task Number

For new tasks:

```text
NN-feature-name.md
```

Use sequential numbering.

Example:

```text
tasks/
├── 01-authentication.md
├── 02-user-management.md
├── 03-global-table.md
└── 04-component.md
```

If existing numbering contains gaps, preserve the existing numbering unless there is a strong reason to reorganize it.

Do not rename existing task files merely for cosmetic consistency.

---

# 11. Task Specification

Every generated task MUST be a mini-specification.

Use:

````md
# Task NN — {Task Name}

## Status

TODO

## Objective

{What this feature accomplishes}

## Context

{Why this feature exists}

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Actors

- ...

## Dependencies

- ...

## Requirements

- REQ-001 ...
- REQ-002 ...

## Business Rules

- BR-001 ...
- BR-002 ...

## Domain

```text
{domain relationship}
````

## Data Model

### {Entity}

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| ...   | ...  | ...      | ...         |

## API

### List

GET /...

### Create

POST /...

### Detail

GET /.../:id

### Update

PATCH /.../:id

### Delete

DELETE /.../:id

Include request/response contracts where important.

## UI/UX

### Information Architecture

...

### User Flow

...

### List

...

### Editor

...

### Detail

...

### Interaction

...

### States

* loading
* empty
* error
* success
* validation
* disabled
* permission denied

### Responsive Behavior

...

## Validation

...

## Security & Permission

...

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

* [ ] Types
* [ ] API service
* [ ] Store/composable
* [ ] Page
* [ ] Components
* [ ] Form
* [ ] Validation
* [ ] Loading state
* [ ] Empty state
* [ ] Error state
* [ ] Success state
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
* [ ] Design System verification

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

* Task generated from Core Concept.

````

Only include sections that are relevant, but these are mandatory:

```text
Status
Objective
Requirements
Business Rules
Domain
UI/UX
Acceptance Criteria
Implementation
Verification
````

---

# 12. UI/UX Requirements

Every user-facing task MUST contain UI/UX requirements.

Do not leave:

```text
## UI/UX

TBD
```

unless the feature genuinely has no user interface.

Consider:

* information architecture
* navigation
* workspace
* list
* detail
* editor
* form
* actions
* dialogs
* confirmation
* feedback
* loading
* empty
* error
* validation
* permissions
* responsive behavior

Follow:

```text
docs/design-system.md
```

and existing UI implementation.

Do not create a generic admin dashboard if the project's design language specifies a desktop/workspace-oriented application.

---

# 13. Business Rules

Business rules must be explicit.

Example:

```md
## Business Rules

- BR-001: Table name must be unique.
- BR-002: Column name must be unique within a table.
- BR-003: A table must contain at least one column.
- BR-004: A table already referenced by another resource cannot be deleted.
```

Do not invent business rules without evidence.

When a rule cannot be determined, put it under:

```md
## Open Questions
```

---

# 14. Acceptance Criteria

Acceptance Criteria MUST be testable.

Use:

```text
Given
When
Then
```

Cover:

* happy path
* validation
* business rules
* error handling
* empty state
* permissions
* important edge cases

Example:

```md
### AC-001

Given the administrator is on the Global Table page

When the administrator clicks Create

Then the Global Table editor is displayed.
```

---

# 15. API Specification

Define API requirements only when the feature requires backend interaction.

Follow existing project API conventions.

Do not invent API patterns that conflict with:

```text
docs/architecture.md
```

or existing implementation.

---

# 16. Database Specification

Define database impact only when required.

Use:

```text
docs/database.md
```

and existing entities as references.

Identify:

* new entities
* modified entities
* relationships
* indexes
* unique constraints
* migrations
* lifecycle rules

Do not redesign the entire database for one task.

---

# 17. Production Readiness

The generated roadmap should consider the complete product lifecycle.

When relevant, include final tasks for:

```text
Security
Audit Log
Error Handling
Observability
Performance
Testing
E2E
Accessibility
Responsive UX
Documentation
Deployment
Production Configuration
Backup / Recovery
```

Do not generate irrelevant tasks.

---

# 18. Task Dependency Map

After generating the task list, create a dependency map.

Example:

```text
01 Authentication
       │
       ▼
02 User Management
       │
       ▼
03 Role & Permission
       │
       ├──────────────┐
       ▼              ▼
04 Global Table     06 Component
       │              │
       └──────┬───────┘
              ▼
        08 Template
              │
              ▼
       09 Administration
              │
              ▼
       10 Generated App
```

The dependency map is used to validate task ordering.

---

# 19. Completeness Check

Before finishing, verify that the roadmap covers:

### Product

* [ ] Core Concept
* [ ] Main user workflows
* [ ] Main entities
* [ ] Core business rules

### Backend

* [ ] API
* [ ] Domain
* [ ] Database
* [ ] Validation
* [ ] Authorization
* [ ] Error handling

### Frontend

* [ ] Navigation
* [ ] Pages
* [ ] Components
* [ ] Forms
* [ ] States
* [ ] Responsive behavior
* [ ] Accessibility where relevant

### Quality

* [ ] Unit tests
* [ ] Integration/API tests
* [ ] E2E tests
* [ ] UI/UX verification
* [ ] Security
* [ ] Performance where relevant

### Production

* [ ] Observability
* [ ] Deployment
* [ ] Production configuration
* [ ] Documentation where relevant

Do not create separate tasks for these categories unless they represent meaningful capabilities.

---

# 20. Consistency Check

Validate every generated task against:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
Understand Anything
existing tasks
```

Check:

* terminology
* entities
* architecture
* dependencies
* API conventions
* database conventions
* UI/UX conventions
* task duplication
* task ordering

If a contradiction exists, do not silently invent a solution.

Record it under:

```text
Open Questions
```

---

# 21. Scope of Modification

This command may:

```text
create/update tasks/*.md
```

It MUST NOT:

```text
modify application source code
modify .ua/
modify AGENTS.md
modify docs/PRD.md
modify docs/architecture.md
modify docs/database.md
modify docs/design-system.md
```

unless explicitly requested by the user.

This command is for task decomposition only.

---

# 22. Final Output

After generation, return:

```text
Complete SDD Task Roadmap Generated

Input:
{short summary of Core Concept}

Tasks:
NN tasks generated

Created:
- tasks/01-xxx.md
- tasks/02-xxx.md
- tasks/03-xxx.md
...

Updated:
- ...

Skipped:
- ...

Core Concept:
{summary}

Dependency Flow:

01 → 02 → 03 → ...

Coverage:
- Authentication: ...
- Authorization: ...
- Core Domain: ...
- Database: ...
- API: ...
- Frontend: ...
- UI/UX: ...
- Testing: ...
- Production: ...

Detected Conflicts:
- ...

Open Questions:
- ...

Next Step:

/plan
```

Do not implement any task.

The generated tasks are the source input for `/plan`.
