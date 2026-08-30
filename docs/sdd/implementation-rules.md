# Implementation Rules

These rules govern how code is implemented.

## Rule 1: Read Specification First

Before writing any code:
1. Read the full specification
2. Read the implementation plan (tasks.md)
3. Understand the acceptance criteria
4. Understand the business rules

## Rule 2: Inspect Existing Code First

Before creating new files:
1. Search for existing similar implementations
2. Check existing components, composables, services
3. Identify reusable abstractions
4. Follow existing patterns

## Rule 3: Reuse Existing Abstractions

Before creating new:
- Components → search `app/app/components/`
- Composables → search `app/app/composables/`
- Services → search `app/server/services/`
- Repositories → search `app/server/repositories/`
- Schemas → search `app/shared/schemas/`

## Rule 4: Do Not Modify Unrelated Code

When implementing a feature:
- Only modify files related to the feature
- Do not refactor unrelated code
- Do not upgrade unrelated dependencies
- Do not rename unrelated files

## Rule 5: Implement Incrementally

Implement one task at a time:
1. Complete the task
2. Run relevant checks
3. Fix any errors
4. Move to next task

## Rule 6: Follow Architecture Rules

Follow all rules in `docs/architecture/architecture-rules.md`:
- Layer separation
- Responsibility boundaries
- Naming conventions
- Error handling

## Rule 7: Follow Design System

Follow all rules in `docs/design/`:
- Use design tokens
- Follow component guidelines
- Follow interaction patterns
- Follow responsive patterns
- Follow accessibility rules

## Rule 8: Validate All Input

- Server-side: Zod validation on all API routes
- Client-side: Form validation for UX
- Never trust client-side validation alone

## Rule 9: Handle All States

Every UI component must handle:
- Loading state
- Empty state
- Error state
- Success state
- Disabled state (where applicable)

## Rule 10: Write Testable Code

- Keep functions small and focused
- Avoid side effects where possible
- Make dependencies injectable
- Write code that can be unit tested
