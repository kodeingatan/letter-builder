# Specification Rules

These rules govern how specifications are written.

## Rule 1: Specification is the Source of Truth

The specification defines what must be implemented. Implementation must follow the specification exactly.

## Rule 2: Ambiguity Must Be Surfaced

If a requirement is ambiguous, the specification phase must STOP and request clarification. Never assume ambiguous behavior.

## Rule 3: AI Must Not Invent Business Behavior

AI agents must not invent business rules, workflows, or domain logic. If the user has not specified it, it does not exist.

## Rule 4: Requirements Must Be Testable

Every requirement must have at least one acceptance criterion that can be verified. If it cannot be tested, it is not a requirement.

## Rule 5: UI/UX Must Be Specified

UI/UX is part of the specification, not an afterthought. Every feature must define:
- Pages and layout
- Components and hierarchy
- States (loading, empty, error, success)
- Responsive behavior
- Accessibility requirements

## Rule 6: Business Rules Must Be Explicit

Business rules must be documented in `business-rules.md` with:
- Unique ID
- Clear description
- Severity level
- Validation logic

## Rule 7: Architecture Impact Must Be Documented

If a feature affects the architecture (new module, new dependency, new pattern), this must be documented in the specification.

## Rule 8: Edge Cases Must Be Identified

Every specification must identify edge cases and define expected behavior for each.

## Rule 9: Dependencies Must Be Identified

If a feature depends on other features or external systems, these dependencies must be documented.

## Rule 10: Specifications Must Be Reviewable

A specification must be complete and clear enough for an independent reviewer to evaluate implementation against it.
