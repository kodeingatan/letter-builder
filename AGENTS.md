# AGENTS.md

> Operational constitution for the Persuratan project.

## Project Overview

**Persuratan** is a Dynamic Administration & Document Composition Platform built with Nuxt 4 + Nitro. Users define data structures (Global Tables), create reusable document components, assemble them into templates, and generate documents via configurable workflows.

**Core Concept:**
```
Global Table → Component → Template → Administration → Document → PDF
```

**Reference:** [docs/product/core-concepts.md](docs/product/core-concepts.md)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 + Nitro |
| Frontend | Vue 3, TypeScript, Nuxt UI, Tailwind CSS |
| Backend | Nitro API routes, Services, Repositories |
| Database | SQLite + Drizzle ORM |
| Editor | Tiptap (ProseMirror) |
| Validation | Zod |
| Testing | Vitest, Playwright |
| Package Manager | pnpm |

**Reference:** [docs/architecture/technology-stack.md](docs/architecture/technology-stack.md)

## Repository Structure

```
persuratan/
├── app/                        # Nuxt 4 application root
│   ├── app/                    # Vue app root (client)
│   │   ├── pages/              # File-based routing
│   │   ├── components/         # Vue components
│   │   │   ├── ui/             # Design system primitives
│   │   │   ├── workspace/      # Workspace shell
│   │   │   ├── builders/       # Feature builders
│   │   │   └── document/       # Document canvas
│   │   ├── composables/        # Vue composables
│   │   ├── layouts/            # Page layouts
│   │   ├── middleware/          # Route middleware
│   │   ├── plugins/            # Nuxt plugins
│   │   └── utils/              # Client utilities
│   ├── server/                 # Nitro server (backend)
│   │   ├── api/                # API routes (thin controllers)
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access
│   │   ├── engines/            # Domain engines
│   │   │   ├── expression/     # Expression parser + evaluator
│   │   │   ├── binding/        # Data binding resolver
│   │   │   ├── component/      # Component resolver
│   │   │   ├── template/       # Template resolver
│   │   │   └── document/       # Document renderer
│   │   ├── database/           # Drizzle schema + migrations
│   │   ├── middleware/          # Server middleware
│   │   ├── plugins/            # Server plugins
│   │   ├── routes/             # Custom routes
│   │   └── utils/              # Server utilities
│   ├── shared/                 # Shared types and schemas
│   │   ├── types/              # TypeScript types
│   │   └── schemas/            # Zod schemas
│   ├── public/                 # Static assets
│   ├── nuxt.config.ts          # Nuxt configuration
│   ├── package.json            # Dependencies
│   └── tsconfig.json           # TypeScript config
├── docs/                       # SDD documentation
│   ├── product/                # Product requirements
│   ├── architecture/           # Architecture decisions
│   ├── design/                 # Design system
│   ├── specs/                  # Feature specifications
│   │   └── _template/          # Spec template
│   └── sdd/                    # SDD workflow rules
├── .opencode/                  # OpenCode configuration
│   ├── agents/                 # Agent definitions
│   ├── commands/               # Command definitions
│   └── skills/                 # Skill definitions
├── prompts/                    # Prompt templates
├── AGENTS.md                   # Operational constitution
└── README.md                   # Project documentation
```

## Architecture Rules

### Layer Separation (Mandatory)

```
Page → Component → Composable → API Route → Service → Repository → Database
```

| Layer | Responsibility | Must NOT |
|-------|---------------|----------|
| Page | Routing, layout | Business logic |
| Component | UI rendering, interaction | Direct API calls |
| Composable | State management, API calls | Business logic |
| API Route | Parse, validate, delegate | Business logic |
| Service | Business logic, domain rules | HTTP handling |
| Repository | Database queries | Business logic |

**Reference:** [docs/architecture/architecture-rules.md](docs/architecture/architecture-rules.md)

### Reuse Before Create

Before creating any new component, composable, service, or repository — search existing ones first.

### Do Not Modify Unrelated Code

When implementing a feature, only modify files related to that feature.

## Coding Rules

- TypeScript strict mode
- No `any` types
- Zod validation for all API inputs
- Consistent error handling
- Consistent naming conventions

## Frontend Rules

- Vue 3 Composition API with `<script setup>`
- Nuxt UI as base component library
- Tailwind CSS for styling (use design tokens)
- Tiptap for rich text editing
- All UI states must be handled (loading, empty, error, success)

**Reference:** [docs/design/design-system.md](docs/design/design-system.md)

## Backend Rules

- Nitro API routes as thin controllers
- Services for business logic
- Repositories for data access
- Zod for request validation
- Structured error responses

## UI/UX Rules

- Professional Workspace design (not admin panel)
- Design tokens for all visual properties
- Responsive design (desktop-first)
- Keyboard accessibility
- Consistent interaction patterns

**Reference:** [docs/design/ui-principles.md](docs/design/ui-principles.md)

## Testing Rules

- Unit tests for domain logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- All acceptance criteria must have tests

## Verification Rules

Before any feature is considered complete:

- [ ] Typecheck: PASS
- [ ] Lint: PASS
- [ ] Tests: PASS
- [ ] Build: PASS
- [ ] Acceptance criteria: ALL PASS
- [ ] Review: No CRITICAL/HIGH findings

**Reference:** [docs/sdd/definition-of-done.md](docs/sdd/definition-of-done.md)

## SDD Workflow

Every feature follows:

```
/spec → /plan → /implement → /verify → /review → DONE
```

**Reference:** [docs/sdd/workflow.md](docs/sdd/workflow.md)

## Key Principles

1. **Specification is the source of truth**
2. **Existing architecture must be respected**
3. **Reuse before create**
4. **Never implement unspecified behavior**
5. **UI/UX is part of the specification**
6. **Server routes must remain thin**
7. **Business logic belongs in services**
8. **Database access belongs in repositories**
9. **Verification is required before completion**
10. **Review is required before DONE**
