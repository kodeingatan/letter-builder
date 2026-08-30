---
description: Bootstrap a complete Spec-Driven Development system for the project
agent: plan
---

# SDD PROJECT BOOTSTRAP

You are initializing a complete Spec-Driven Development (SDD)
system for the current software project.

The user has provided project information below.

USER PROJECT INFORMATION:

$ARGUMENTS

============================================================
CORE OBJECTIVE
============================================================

Create a complete, maintainable, repository-native
Spec-Driven Development system for this project.

The SDD system must become the project's source of truth
for:

- product requirements
- core concepts
- domain model
- architecture
- business rules
- UI/UX
- design system
- API contracts
- feature specifications
- implementation plans
- acceptance criteria
- testing
- verification
- AI coding behavior

IMPORTANT:

DO NOT implement application features.

DO NOT modify existing application source code.

DO NOT refactor the existing application.

Your task is to create the SDD infrastructure and documentation.

============================================================
PHASE 0 — SAFETY
============================================================

Before creating anything:

1. Inspect the repository.
2. Identify the project root.
3. Identify existing documentation.
4. Identify existing AGENTS.md.
5. Identify existing .opencode configuration.
6. Identify existing docs/specs.
7. Identify existing design-system documentation.
8. Identify existing README files.
9. Identify package manager.
10. Identify frontend architecture.
11. Identify backend architecture.
12. Identify database technology.

Never overwrite valuable existing documentation.

If a file already exists:

- inspect it
- preserve useful information
- improve it when appropriate
- do not blindly replace it

============================================================
PHASE 1 — UNDERSTAND THE PROJECT
============================================================

Analyze the existing repository.

For this project determine:

## Product

- product name
- product type
- target users
- primary user problems
- primary user goals
- business objectives
- important workflows

## Core Concept

Identify the fundamental concepts that define the system.

Examples:

- entities
- resources
- modules
- actors
- workflows
- states
- relationships
- permissions
- lifecycle

Do not assume the example concepts are correct.

Infer the actual concepts from:

1. USER PROJECT INFORMATION
2. existing code
3. database schema
4. API
5. routes
6. components
7. existing documentation

The Core Concept must become the foundation
for all future specifications.

## Technical Stack

Determine:

- frontend framework
- backend framework
- language
- database
- ORM
- CSS/UI system
- package manager
- testing tools
- build tools
- deployment approach

## Architecture

Determine:

- frontend structure
- backend structure
- module boundaries
- domain boundaries
- API architecture
- data flow
- authentication
- authorization
- state management
- shared packages
- external integrations

## Existing Patterns

Identify:

- naming conventions
- folder conventions
- component patterns
- composable patterns
- service patterns
- DTO patterns
- repository patterns
- API response patterns
- error handling
- validation
- testing patterns

============================================================
PHASE 2 — CREATE SDD DIRECTORY
============================================================

Create:

docs/
├── product/
├── architecture/
├── design/
├── specs/
└── sdd/

The target structure is:

docs/
│
├── product/
│ ├── vision.md
│ ├── problem.md
│ ├── users.md
│ ├── use-cases.md
│ ├── core-concepts.md
│ ├── business-rules.md
│ └── glossary.md
│
├── architecture/
│ ├── overview.md
│ ├── system-context.md
│ ├── frontend.md
│ ├── backend.md
│ ├── database.md
│ ├── api.md
│ ├── security.md
│ ├── architecture-rules.md
│ └── technology-stack.md
│
├── design/
│ ├── design-system.md
│ ├── ui-principles.md
│ ├── ux-principles.md
│ ├── interaction-patterns.md
│ ├── responsive.md
│ ├── accessibility.md
│ └── component-guidelines.md
│
├── specs/
│ ├── README.md
│ └── \_template/
│ ├── requirements.md
│ ├── domain.md
│ ├── business-rules.md
│ ├── api.md
│ ├── ui.md
│ ├── ux.md
│ ├── acceptance.md
│ ├── test-cases.md
│ └── tasks.md
│
└── sdd/
├── README.md
├── workflow.md
├── specification-rules.md
├── implementation-rules.md
├── verification-rules.md
├── review-rules.md
└── definition-of-done.md

============================================================
PHASE 3 — PRODUCT FOUNDATION
============================================================

Create:

docs/product/vision.md

Document:

- product vision
- product purpose
- target users
- value proposition
- product goals
- non-goals

Create:

docs/product/problem.md

Document:

- problems
- causes
- consequences
- desired outcomes

Create:

docs/product/users.md

Document:

- user types
- roles
- responsibilities
- goals
- permissions when known

Create:

docs/product/use-cases.md

Document major user workflows.

Create:

docs/product/core-concepts.md

THIS IS EXTREMELY IMPORTANT.

Document the Core Concept of the system.

For every core concept define:

- name
- definition
- purpose
- attributes
- relationships
- lifecycle
- ownership
- constraints

Distinguish:

CORE CONCEPTS

from:

IMPLEMENTATION DETAILS.

Do not make framework-specific implementation
the core concept.

Create:

docs/product/business-rules.md

Document important business rules.

Create:

docs/product/glossary.md

Define domain terminology.

============================================================
PHASE 4 — ARCHITECTURE FOUNDATION
============================================================

Create:

docs/architecture/overview.md

Describe:

- architectural style
- major layers
- major modules
- dependencies
- data flow

Create:

docs/architecture/system-context.md

Describe:

- users
- application
- external systems
- integrations
- data boundaries

Create:

docs/architecture/frontend.md

Describe actual frontend architecture.

Create:

docs/architecture/backend.md

Describe actual backend architecture.

Create:

docs/architecture/database.md

Describe:

- database
- ORM
- entities
- relationships
- migration strategy
- conventions

Create:

docs/architecture/api.md

Describe:

- API conventions
- response format
- error format
- validation
- authentication
- authorization
- pagination
- filtering
- sorting

Create:

docs/architecture/security.md

Document:

- authentication
- authorization
- validation
- secrets
- sensitive data
- security boundaries

Create:

docs/architecture/architecture-rules.md

Define rules that future AI agents MUST follow.

Examples:

- where business logic belongs
- where database access belongs
- where API calls belong
- component boundaries
- dependency direction
- naming
- reuse
- error handling

Create:

docs/architecture/technology-stack.md

Document the actual stack.

============================================================
PHASE 5 — DESIGN FOUNDATION
============================================================

Create:

docs/design/design-system.md

Document the EXISTING design system.

If no design system exists:

create a conservative foundation based on
existing project styles.

Do not invent excessive design tokens.

Document:

- colors
- typography
- spacing
- radius
- shadows
- icons
- buttons
- forms
- tables
- cards
- dialogs
- navigation
- feedback
- states

Create:

docs/design/ui-principles.md

Define:

- visual hierarchy
- consistency
- density
- clarity
- hierarchy of actions
- information architecture

Create:

docs/design/ux-principles.md

Define:

- discoverability
- feedback
- error prevention
- progressive disclosure
- predictable interaction
- user efficiency

Create:

docs/design/interaction-patterns.md

Define reusable patterns.

Create:

docs/design/responsive.md

Define:

- breakpoints
- mobile behavior
- tablet behavior
- desktop behavior
- responsive tables
- responsive forms
- navigation behavior

Create:

docs/design/accessibility.md

Define:

- keyboard navigation
- focus
- labels
- semantic structure
- contrast
- screen readers
- validation feedback

Create:

docs/design/component-guidelines.md

Define:

- component reuse
- component naming
- component responsibility
- composition
- variants
- states

============================================================
PHASE 6 — SDD SPEC TEMPLATE
============================================================

Create:

docs/specs/README.md

Explain:

A feature specification is the contract
between product requirements and implementation.

Every significant feature must have:

docs/specs/<feature>/

Create:

docs/specs/\_template/

with:

requirements.md
domain.md
business-rules.md
api.md
ui.md
ux.md
acceptance.md
test-cases.md
tasks.md

============================================================
SPECIFICATION FILE RULES
============================================================

requirements.md

Must define:

- problem
- objective
- actors
- user stories
- functional requirements
- non-functional requirements
- constraints
- edge cases

Every requirement must have an ID.

Example:

REQ-001
REQ-002
REQ-003

---

domain.md

Must define:

- entities
- relationships
- states
- invariants
- lifecycle

---

business-rules.md

Must define:

- validation rules
- permissions
- state transitions
- business constraints
- side effects

---

api.md

Must define:

- endpoints
- methods
- request
- response
- validation
- errors
- authentication
- authorization

---

ui.md

Must define:

- pages
- layouts
- components
- information hierarchy
- forms
- tables
- navigation
- states
- responsive behavior

---

ux.md

Must define:

- user flow
- interactions
- feedback
- empty states
- loading
- errors
- success
- confirmation
- destructive actions

---

acceptance.md

Use:

Given
When
Then

Every acceptance criterion must be testable.

---

test-cases.md

Define:

- unit tests
- integration tests
- API tests
- E2E tests
- edge cases

Only include tests relevant to the feature.

---

tasks.md

Break implementation into:

- database
- domain
- backend
- API
- frontend data layer
- UI
- tests
- verification

Each task must have:

TASK-ID
description
dependencies
affected area
verification

============================================================
PHASE 7 — SDD WORKFLOW
============================================================

Create:

docs/sdd/workflow.md

Define:

IDEA
↓
UNDERSTAND
↓
SPEC
↓
REVIEW SPEC
↓
PLAN
↓
IMPLEMENT
↓
VERIFY
↓
REVIEW
↓
FIX
↓
VERIFY AGAIN
↓
DONE

Define what each phase is allowed to do.

Important:

SPEC phase MUST NOT implement code.

PLAN phase MUST NOT implement code.

IMPLEMENT phase MUST follow approved specification.

VERIFY phase MUST produce evidence.

REVIEW phase MUST challenge the implementation.

============================================================
PHASE 8 — SDD RULES
============================================================

Create:

docs/sdd/specification-rules.md

Rules:

1. Specification is the source of truth.
2. Ambiguity must be surfaced.
3. AI must not invent important business behavior.
4. Requirements must be testable.
5. UI/UX must be specified.
6. Business rules must be explicit.
7. Architecture impact must be documented.

Create:

docs/sdd/implementation-rules.md

Rules:

1. Read specification first.
2. Inspect existing code first.
3. Reuse existing abstractions.
4. Do not modify unrelated code.
5. Implement incrementally.
6. Follow architecture rules.
7. Follow design system.

Create:

docs/sdd/verification-rules.md

Define:

- typecheck
- lint
- tests
- build
- acceptance criteria
- API verification
- UI verification
- accessibility

Create:

docs/sdd/review-rules.md

Define severity:

CRITICAL
HIGH
MEDIUM
LOW

CRITICAL and HIGH findings block completion.

Create:

docs/sdd/definition-of-done.md

A feature is DONE only when:

- requirements pass
- acceptance criteria pass
- tests pass
- typecheck passes
- lint passes
- build passes
- architecture passes
- UI/UX passes
- accessibility passes
- no CRITICAL/HIGH review findings

============================================================
PHASE 9 — CREATE AGENTS.MD
============================================================

Create or update:

AGENTS.md

AGENTS.md must become the concise operational constitution
of this project.

It MUST contain:

1. Project overview
2. Core concept summary
3. Technology stack
4. Repository structure
5. Architecture rules
6. Coding rules
7. Frontend rules
8. Backend rules
9. UI/UX rules
10. Testing rules
11. Verification rules
12. SDD workflow

Keep AGENTS.md concise.

Detailed knowledge belongs in docs/.

AGENTS.md should reference:

docs/product/core-concepts.md
docs/architecture/architecture-rules.md
docs/design/design-system.md
docs/sdd/workflow.md
docs/sdd/definition-of-done.md

Do not duplicate the complete documentation inside AGENTS.md.

============================================================
PHASE 10 — CREATE OPENCODE AGENTS
============================================================

Create:

.opencode/agents/

Required agents:

product.md
architect.md
uiux.md
backend.md
frontend.md
qa.md
reviewer.md

Each agent must:

- have one clear responsibility
- read relevant SDD documentation
- respect AGENTS.md
- avoid duplicating responsibilities

============================================================
PHASE 11 — CREATE OPENCODE COMMANDS
============================================================

Create:

.opencode/commands/

Required commands:

setup-sdd.md
spec.md
plan.md
implement.md
verify.md
review.md
feature.md

IMPORTANT:

Do not recursively generate setup-sdd.md.

The existing command is the bootstrap command.

The other commands must use:

$ARGUMENTS

where appropriate.

============================================================
PHASE 12 — COMMAND BEHAVIOR
============================================================

/spec <feature>

Creates or updates:

docs/specs/<feature>/

Must NOT implement code.

/plan <feature>

Reads the specification and creates
an implementation plan.

/implement <feature>

Implements only approved specification.

/verify <feature>

Runs verification and reports evidence.

/review <feature>

Performs strict review.

/feature <feature>

Runs the complete:

SPEC
→ PLAN
→ IMPLEMENT
→ VERIFY
→ REVIEW

workflow.

============================================================
PHASE 13 — PROJECT-SPECIFIC INFORMATION
============================================================

Use the user's project information:

$ARGUMENTS

as the primary product-level input.

However:

DO NOT blindly trust it.

Cross-check against the repository.

If information conflicts with the codebase:

document the conflict.

Do not silently choose one.

Create:

docs/sdd/bootstrap-notes.md

containing:

- supplied project information
- discovered project information
- assumptions
- unresolved questions
- conflicts
- recommended follow-ups

============================================================
PHASE 14 — CORE CONCEPT VALIDATION
============================================================

Before finishing, validate the Core Concept.

Ask internally:

1. What is the primary purpose of this application?
2. Who are the primary actors?
3. What are the core entities/resources?
4. What are the primary workflows?
5. What are the important state transitions?
6. What business rules define the system?
7. What concepts are stable regardless of framework?
8. What concepts are merely implementation details?

The resulting:

docs/product/core-concepts.md

must represent the stable conceptual model
of the product.

============================================================
PHASE 15 — CONSISTENCY CHECK
============================================================

Verify consistency across:

USER INFORMATION
↓
PRODUCT
↓
CORE CONCEPT
↓
DOMAIN
↓
ARCHITECTURE
↓
API
↓
UI/UX
↓
ACCEPTANCE
↓
TASKS

Identify contradictions.

Fix documentation inconsistencies before finishing.

============================================================
PHASE 16 — FINAL REPORT
============================================================

Do not implement application code.

Report:

## Project Understanding

- product
- target users
- core concept
- major workflows
- technology stack

## Created

List all created files.

## Updated

List all updated files.

## Core Concept

Summarize the final Core Concept.

## Architecture

Summarize the architecture.

## Design System

Summarize the design foundation.

## SDD Workflow

Summarize:

SPEC
PLAN
IMPLEMENT
VERIFY
REVIEW

## Assumptions

List assumptions.

## Unresolved Questions

List questions requiring human decisions.

## Conflicts

List discovered conflicts between:

- user information
- documentation
- source code

## Next Step

Recommend the first feature to specify.

IMPORTANT:

The SDD bootstrap is complete only when
the documentation and OpenCode structure are created
and internally consistent.
