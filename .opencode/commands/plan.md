---

## description: Create a detailed implementation plan from a task specification

Create a detailed implementation plan from a task specification in `tasks/`.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Transform a task specification into a detailed, step-by-step implementation plan.

The goal is to answer:

> "How exactly should this task be implemented, file by file, function by function?"

The output is an implementation plan that can be directly executed by `/implement`.

---

# 2. Identify the Task

Determine which task to plan.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-nuxt.md`) → use that file
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

Read the identified task file completely.

---

# 3. Read Project Knowledge

Before planning, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

Also read:

```text
tasks/
```

to understand dependencies between tasks.

---

# 4. Understand Anything

If `.ua/` exists, use it as supplementary context for:

- existing modules and their relationships
- existing entities and patterns
- architecture boundaries
- dependency direction
- implementation patterns already in use

Priority:

```text
Current Source Code
        ↓
Task Specification
        ↓
Understand Anything
        ↓
Permanent Knowledge
```

---

# 5. Analyze the Task

From the task specification, extract:

### Scope

- What is included
- What is excluded

### Dependencies

- Which tasks must be completed first
- Which entities/modules are affected

### Affected Areas

- Backend files to create/modify
- Frontend files to create/modify
- Database changes
- Configuration changes
- Documentation changes

### Patterns to Follow

- Existing service patterns
- Existing component patterns
- Existing API route patterns
- Existing DTO patterns
- Existing entity patterns

---

# 6. Inspect Existing Code

Before planning new code, inspect what already exists:

### Backend

- Check existing entities in `server/entities/`
- Check existing services in `server/services/`
- Check existing API routes in `server/api/`
- Check existing DTOs in `server/dto/`
- Check existing utils in `server/utils/`

### Frontend

- Check existing pages in `app/pages/`
- Check existing components in `app/components/`
- Check existing composables in `app/composables/`
- Check existing stores in `app/stores/`
- Check existing plugins in `app/plugins/`
- Check existing middleware in `app/middleware/`

### Shared

- Check existing types in `shared/types/`

Identify what already exists and what needs to be created.

---

# 7. Generate Implementation Plan

Create a detailed plan with these sections:

````md
# Implementation Plan — Task NN: {Task Name}

## Overview

{Brief summary of what will be implemented}

## Prerequisites

- [ ] Task XX completed (if any)
- [ ] Dependencies installed
- [ ] Database ready

## Implementation Steps

### Step 1: {Step Name}

**Priority**: HIGH/MEDIUM/LOW

**Files to create/modify**:
- `path/to/file1.ts` — {what changes}
- `path/to/file2.ts` — {what changes}

**Details**:
{exact code changes, function signatures, type definitions}

**Verification**:
- [ ] {how to verify this step}

### Step 2: {Step Name}

...

## File Change Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `server/entities/xxx.entity.ts` | New entity |
| MODIFY | `server/services/xxx.service.ts` | Add new method |
| CREATE | `app/components/xxx/XXX.vue` | New component |

## Verification Plan

### Unit Tests
- [ ] {test file and what it tests}

### Component Tests
- [ ] {test file and what it tests}

### E2E Tests
- [ ] {test file and what it tests}

### Manual Verification
- [ ] {manual check}

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk} | {impact} | {mitigation} |

## Estimated Effort

- Files to create: N
- Files to modify: N
- Estimated time: X hours

## Execution Order

1. {step 1}
2. {step 2}
3. {step 3}
````

---

# 8. Plan Quality Rules

### Be Specific

BAD:

```text
Create the user service.
```

GOOD:

```text
Create `server/services/users.service.ts` with:
- `findAll(query)` — paginated list with search
- `findOne(id)` — single user with roles relation
- `create(data)` — hash password, save user
- `update(id, data)` — update fields, hash password if changed
- `remove(id)` — delete user and cascade relations
```

### Follow Existing Patterns

Inspect existing code and follow the same:

- naming conventions
- file structure
- function signatures
- error handling
- validation approach

### Minimize Changes

Plan the smallest consistent change that satisfies the task.

Do not:

- refactor unrelated code
- introduce new patterns when existing ones work
- create abstractions without clear need

### Consider Dependencies

Order steps so that:

1. Entities come before services
2. Services come before API routes
3. API routes come before frontend integration
4. Types come before usage
5. Base components come before feature components

---

# 9. Do Not Implement

This command ONLY creates the implementation plan.

Do NOT:

- write application code
- create entities
- create services
- create components
- modify existing files
- install packages
- run commands

The output of this command is the implementation plan only.

---

# 10. Final Response

After creating the plan, return:

```text
Implementation Plan Created

Task: tasks/NN-task-name.md
Plan: {summary}

Steps: N steps
Files to create: N
Files to modify: N
Estimated effort: X hours

Execution Order:
1. {step 1}
2. {step 2}
3. {step 3}

Next Step:

/implement tasks/NN-task-name.md
```

Do not execute the plan.
