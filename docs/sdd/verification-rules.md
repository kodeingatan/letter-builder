# Verification Rules

These rules govern how implementation is verified.

## Verification Pipeline

```
1. Typecheck
2. Lint
3. Unit Tests
4. Integration Tests
5. Build
6. API Verification
7. UI Verification
8. Acceptance Criteria
9. Accessibility
10. Architecture
```

## 1. Typecheck

**Command:** `npx nuxi typecheck` (or project-specific)

**Requirements:**
- Zero TypeScript errors
- No `any` types in new code
- All interfaces properly defined

## 2. Lint

**Command:** `npx eslint .` (or project-specific)

**Requirements:**
- Zero lint errors in new/modified files
- Follow project lint configuration

## 3. Unit Tests

**Command:** `npx vitest run` (or project-specific)

**Requirements:**
- All new functions/modules have unit tests
- All tests pass
- No skipped tests without justification

## 4. Integration Tests

**Command:** `npx vitest run --reporter=verbose` (or project-specific)

**Requirements:**
- Feature flows are tested
- API endpoints are tested
- All tests pass

## 5. Build

**Command:** `npx nuxi build`

**Requirements:**
- Build succeeds without errors
- No warnings related to new code

## 6. API Verification

**Check:**
- All endpoints respond correctly
- Validation works (invalid input rejected)
- Authentication works (unauthorized rejected)
- Authorization works (forbidden rejected)
- Response format matches specification

## 7. UI Verification

**Check:**
- Page renders correctly
- Loading state displays
- Empty state displays
- Error state displays
- Success feedback works
- Form validation displays
- Responsive layout works

## 8. Acceptance Criteria

**Check every criterion in `acceptance.md`:**

For each:
- **PASS** — criterion met with evidence
- **FAIL** — criterion not met

Never assume PASS without evidence.

## 9. Accessibility

**Check:**
- Keyboard navigation works
- Focus is visible
- Labels are present
- Contrast is sufficient
- Screen reader announcements work

## 10. Architecture

**Check:**
- Layer separation maintained
- No duplicated abstractions
- Correct module boundaries
- Correct data flow
- Design system followed

## Verification Report Format

```markdown
## Typecheck
PASS / FAIL

## Lint
PASS / FAIL

## Unit Tests
PASS / FAIL (X/Y tests pass)

## Integration Tests
PASS / FAIL (X/Y tests pass)

## Build
PASS / FAIL

## API Verification
PASS / FAIL

## UI Verification
PASS / FAIL

## Acceptance Criteria
X / Y PASS

## Accessibility
PASS / FAIL

## Architecture
PASS / FAIL

## Remaining Problems
[List any remaining issues]
```
