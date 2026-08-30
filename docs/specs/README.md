# Feature Specifications

A feature specification is the **contract** between product requirements and implementation.

Every significant feature must have its own specification directory:

```
docs/specs/{no}-{feature-name}/
├── requirements.md    # What and why
├── domain.md          # Entities and relationships
├── business-rules.md  # Validation and constraints
├── api.md             # API contracts
├── ui.md              # UI specification
├── ux.md              # User experience flows
├── acceptance.md      # Testable acceptance criteria
├── test-cases.md      # Test plan
└── tasks.md           # Implementation tasks
```

**Naming Convention:**
- Format: `{no urut}-{feature-name}`
- `no urut`: sequential number (01, 02, 03, ...)
- `feature-name`: kebab-case (e.g., user-management, approval-workflow)
- Auto-numbered: scan existing folders, increment highest number

## Spec Lifecycle

```
Draft → Review → Approved → Implemented → Verified → Done
```

## Rules

1. Specification is the source of truth
2. Implementation must follow the specification
3. No code without a specification
4. Specs must be reviewable before implementation
5. Changes to specs require re-review

## Creating a New Spec

Use the `/spec` command:

```
/spec <feature-name>
```

This auto-numbers the folder and creates all template files.

Example:
```
/spec user-management
→ creates docs/specs/08-user-management/
```

## Template

See `_template/` directory for the specification template.

## Feature Index

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 01 | [global-table](01-global-table/) | Collections and fields for structured data | Draft |
| 02 | [expression-engine](02-expression-engine/) | Math/string expression evaluation | Draft |
| 03 | [component](03-component/) | Reusable document building blocks | Draft |
| 04 | [template](04-template/) | Document composition with bindings, loops, conditions | Draft |
| 05 | [administration](05-administration/) | Workflows with steps, conditions, roles | Draft |
| 06 | [document](06-document/) | Generated output (HTML/PDF) with search | Draft |
| 07 | [render-engine](07-render-engine/) | Template → HTML → PDF resolution | Draft |

## Core Concept Chain

```
Global Table → Component → Template → Administration → Document → PDF
```
