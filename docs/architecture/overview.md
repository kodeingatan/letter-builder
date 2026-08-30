# Architecture Overview

## Architectural Style

**Unified Full-Stack Application** using Nuxt 4 with Nitro server engine.

The application is a single deployable unit where:
- Client-side rendering (Vue 3 + Nuxt UI) handles the workspace UI
- Server-side API routes (Nitro) handle domain logic, data access, and document generation
- Both share TypeScript types and validation schemas

## Major Layers

```
┌─────────────────────────────────────────────┐
│              CLIENT (Nuxt UI)               │
│  Pages → Components → Composables → State   │
└──────────────────┬──────────────────────────┘
                   │ HTTP / Fetch
┌──────────────────┴──────────────────────────┐
│              SERVER (Nitro)                  │
│  API Routes → Services → Domain Engines     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│              DATA LAYER                      │
│  Drizzle ORM → SQLite                        │
└─────────────────────────────────────────────┘
```

## Major Modules

| Module | Responsibility |
|--------|---------------|
| **Collections** | Global Table CRUD, column management, record operations |
| **Components** | Reusable document block creation, data requirements |
| **Templates** | Document composition canvas, binding, looping, conditions |
| **Workflows** | Administration steps, data gathering, document generation |
| **Documents** | Generated output storage, PDF rendering |
| **Expression Engine** | Math/string expression evaluation |
| **Render Engine** | Template → HTML → PDF resolution |

## Data Flow

```
User Action
    │
    ▼
Nuxt Page/Component
    │
    ▼
Composable (state + API calls)
    │
    ▼
Nitro API Route
    │
    ▼
Service (business logic)
    │
    ├── Domain Engine (expression, binding, component, template)
    │
    ▼
Repository (data access)
    │
    ▼
Drizzle ORM → SQLite
```

## Key Architecture Decisions

1. **Single Database** — SQLite for simplicity, metadata-driven schema
2. **No Separate Backend** — Nitro handles all server logic within Nuxt
3. **Custom Domain Engines** — Expression, Binding, Component, Template, Render engines are hand-built
4. **Tiptap for Document Model** — ProseMirror-based editor with custom nodes
5. **HTML-to-PDF via Playwright** — Consistent preview-to-PDF rendering
