# Backend Architecture

## Server Engine

**Nitro** (built into Nuxt 4) handles all server-side logic.

## Structure

The server code lives inside `app/server/` (Nuxt 4 convention).

```
app/                            # Nuxt 4 application root
├── server/                     # Nitro server (backend)
│   ├── api/                    # API route handlers
│   │   ├── collections/        # Global Table CRUD
│   │   ├── components/         # Component CRUD
│   │   ├── templates/          # Template CRUD
│   │   ├── workflows/          # Administration CRUD
│   │   ├── documents/          # Document generation
│   │   └── files/              # File upload/download
│   ├── services/               # Business logic layer
│   │   ├── collection.service.ts
│   │   ├── component.service.ts
│   │   ├── template.service.ts
│   │   ├── workflow.service.ts
│   │   └── document.service.ts
│   ├── repositories/           # Data access layer
│   │   ├── collection.repository.ts
│   │   ├── component.repository.ts
│   │   ├── template.repository.ts
│   │   ├── workflow.repository.ts
│   │   └── document.repository.ts
│   ├── engines/                # Domain engines
│   │   ├── expression/         # Expression parser + evaluator
│   │   ├── binding/            # Data binding resolver
│   │   ├── component/          # Component resolver + renderer
│   │   ├── template/           # Template resolver + renderer
│   │   └── document/           # Document renderer (HTML + PDF)
│   ├── database/               # Drizzle schema + migrations
│   ├── middleware/              # Server middleware
│   ├── plugins/                # Server plugins
│   ├── routes/                 # Custom routes
│   ├── utils/                  # Server utilities
│   └── types/                  # Server-side types
└── shared/                     # Shared types and schemas
    ├── types/
    └── schemas/
```

## Request Flow

```
HTTP Request
    │
    ▼
Nitro API Route
    │
    ├── Parse parameters
    ├── Validate input (Zod)
    ├── Authentication check
    ├── Authorization check
    │
    ▼
Service
    │
    ├── Business logic
    ├── Domain rules
    ├── Transaction management
    │
    ▼
Repository
    │
    ├── Drizzle ORM queries
    ├── Data mapping
    │
    ▼
SQLite Database
```

## Layer Responsibilities

### API Routes (Thin Controllers)
- Receive HTTP request
- Parse parameters and body
- Validate input with Zod
- Check authentication
- Check authorization
- Delegate to service
- Return response

### Services (Business Logic)
- Orchestrate business operations
- Enforce domain rules
- Manage transactions
- Call repositories
- Call domain engines

### Repositories (Data Access)
- Execute database queries
- Map database rows to domain objects
- Handle database-specific logic

### Domain Engines
- Expression Engine: parse and evaluate expressions
- Binding Engine: resolve data bindings
- Component Engine: resolve component data requirements
- Template Engine: resolve template structure
- Document Engine: render HTML and generate PDF
