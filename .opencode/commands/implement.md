---
description: Implement code based on the task specification and implementation plan
---

Implement code based on a task specification and its implementation plan.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Execute the implementation plan to produce working code.

The goal is to answer:

> "Write the actual code that satisfies the task specification."

The output is:

- new files created
- existing files modified
- code that follows project conventions

---

# 2. Identify the Task

Determine which task to implement.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-nuxt.md`) → use that file
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

Read the identified task file completely.

---

# 3. Read Project Knowledge

Before implementing, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

These define the conventions and patterns you MUST follow.

---

# 4. Understand Anything

If `.ua/` exists, use it as supplementary context for:

- existing implementation patterns
- module relationships
- entity relationships
- code conventions

Priority:

```text
Current Source Code (HIGHEST)
        ↓
Task Specification
        ↓
Implementation Plan
        ↓
Understand Anything
        ↓
Permanent Knowledge
```

Always verify against actual source code.

---

# 5. Pre-Implementation Checklist

Before writing any code:

- [ ] Task specification fully understood
- [ ] Implementation plan reviewed
- [ ] Existing code patterns identified
- [ ] Dependencies verified
- [ ] No conflicts with existing code detected

---

# 6. Implementation Rules

### Follow Conventions

Inspect existing code and follow the same:

- naming conventions
- file structure
- function signatures
- error handling
- validation approach
- import patterns
- type definitions

### Reuse Existing Code

Before creating new code:

1. Check if similar functionality exists
2. Check if components can be reused
3. Check if utilities can be reused
4. Check if patterns can be followed

### Minimal Changes

Implement the smallest consistent change that satisfies the task.

Do NOT:

- refactor unrelated code
- introduce new patterns when existing ones work
- create abstractions without clear need
- "improve" existing code while implementing new features

### One Step at a Time

Follow the implementation plan step by step.

After each step:

1. Verify the code is syntactically correct
2. Check for type errors
3. Ensure imports resolve

---

# 7. Backend Implementation

### Entity Pattern

```typescript
// server/entities/{name}.entity.ts
import { EntitySchema } from 'typeorm'

export const {Name}Schema = new EntitySchema({
  name: '{name}',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    // ... columns
  },
  relations: {
    // ... relations
  },
})
```

### Service Pattern

```typescript
// server/services/{name}.service.ts
import { getDataSource } from '~/server/utils/db'
import { {Name}Schema } from '~/server/entities/{name}.entity'

export const {Name}Service = {
  async findAll(query: QueryInput) { /* ... */ },
  async findOne(id: number) { /* ... */ },
  async create(data: CreateInput) { /* ... */ },
  async update(id: number, data: UpdateInput) { /* ... */ },
  async remove(id: number) { /* ... */ },
}
```

### API Route Pattern

```typescript
// server/api/{name}/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { QuerySchema } from '~~/server/dto/{name}.dto'
import { {Name}Service } from '~~/server/services/{name}.service'

export default defineEventHandler(async (event) => {
  const query = QuerySchema.parse(getQuery(event))
  return {Name}Service.findAll(query)
})
```

### DTO Pattern

```typescript
// server/dto/{name}.dto.ts
import { z } from 'zod'

export const CreateSchema = z.object({ /* ... */ })
export type CreateInput = z.infer<typeof CreateSchema>

export const QuerySchema = z.object({ /* ... */ })
export type QueryInput = z.infer<typeof QuerySchema>
```

---

# 8. Frontend Implementation

### Page Pattern

```vue
<!-- app/pages/dashboard/{name}.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

// ... logic
</script>

<template>
  <!-- ... template -->
</template>
```

### Component Pattern

```vue
<!-- app/components/features/{name}/{Name}.vue -->
<script setup lang="ts">
// ... props, emits, logic
</script>

<template>
  <!-- ... template -->
</template>
```

### Composable Pattern

```typescript
// app/composables/use{Name}.ts
export function use{Name}() {
  // ... logic
  return { /* ... */ }
}
```

### Store Pattern

```typescript
// app/stores/{name}.ts
import { defineStore } from 'pinia'

export const use{Name}Store = defineStore('{name}', () => {
  // ... state, actions, getters
})
```

---

# 9. During Implementation

### Track Progress

Update the task file's Implementation section:

```markdown
## Implementation

### Backend

* [x] Entity
* [x] Service
* [ ] API routes
* [ ] DTO
```

### Handle Errors

If you encounter an error:

1. Read the error message carefully
2. Check if the pattern exists in the codebase
3. Follow existing error handling patterns
4. Do not introduce new error handling patterns

### Document Decisions

If you make a decision not covered by the task or plan:

1. Document it in the task file under `Assumptions`
2. Keep it minimal
3. Follow existing patterns

---

# 10. Post-Implementation

After implementing all steps:

### Verify Code Quality

1. Check all imports resolve
2. Check TypeScript types are correct
3. Check no `any` types were introduced unnecessarily
4. Check naming conventions are followed

### Run Verification

```bash
# From apps/web/
npm run dev          # Check server starts
npm run build        # Check production build
npm run test         # Run tests
```

### Update Task Status

Update the task file:

```markdown
## Status

IN PROGRESS → TODO REVIEW
```

---

# 11. Do Not

Do NOT:

- skip reading the task specification
- ignore existing code patterns
- create duplicate functionality
- introduce new libraries without justification
- modify unrelated code
- change database schema without task specification
- commit changes (wait for `/verify` and `/review`)

Exception: updating `tasks/task-logs.md` per #13 IS required and allowed.

---

# 12. Final Response

After implementation, return:

```text
Implementation Complete

Task: tasks/NN-task-name.md

Files Created:
- path/to/file1.ts
- path/to/file2.ts

Files Modified:
- path/to/file3.ts
- path/to/file4.ts

Task Logs:
- tasks/task-logs.md updated — Implemented checked for this task (see #13)

Status: Ready for verification

Next Step:

/verify tasks/NN-task-name.md
```

---

# 13. Update Task Logs (Mandatory Final Step)

After `/implement` finishes, you MUST update `tasks/task-logs.md` by checking off what has been implemented.

This step is mandatory — do NOT skip it.

### 13.1 Rules

1. Read `tasks/task-logs.md`. If it does not exist → CREATE it using the template in `/gen-tasks` #23.2, then mark the current task as implemented.
2. Update ONLY the implementation tracking for the current task (`tasks/NN-task-name.md`):
   - Overview table: set `Implemented` column to `[x]` for this task row.
   - Move entry from `## Belum Implementasi` (`- [ ] tasks/NN-...`) to `## Sudah Implementasi` (`- [x] tasks/NN-... — {Task Name} — {date} by /implement`).
   - Detail per Task section: set `Implemented: [x] {date} by /implement — {short notes: files created/modified}`.
   - Update `## Last Updated` (`Date`, `By: /implement`, task file name).
3. Do NOT touch `Verified` or `Reviewed` checklists — those belong to `/verify` and `/review`.
4. Do NOT reset any existing `[x]` to `[ ]`.
5. Do NOT mark implementation `[x]` if implementation failed or was aborted — leave `[ ]` and note the reason under Detail `Notes`.

### 13.2 Verification

Before finishing `/implement`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task `Implemented` is `[x]` in Overview + Detail
- [ ] Current task moved from Belum → Sudah Implementasi
- [ ] Verified / Reviewed states untouched
