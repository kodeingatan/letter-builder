# Feature Specifications

A feature specification is the **contract** between product requirements and implementation.

Every significant feature must have its own specification directory:

```
docs/specs/<feature>/
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

This creates the directory and all template files.

## Template

See `_template/` directory for the specification template.
