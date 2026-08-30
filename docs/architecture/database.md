# Database Architecture

## Database

**SQLite** — lightweight, file-based, zero-configuration.

## ORM

**Drizzle ORM** — TypeScript-first, lightweight, SQL-like API.

## Strategy

The application uses a **hybrid approach**:

1. **Metadata tables** (fixed schema) — store Global Table definitions, Component definitions, Template definitions, etc.
2. **Dynamic data** (JSON-based) — store records created by users in Global Tables as JSONB columns, avoiding the need to create physical SQLite tables for each user-defined table.

### Why Not Physical Tables Per Global Table?

Creating a new SQLite table for each user-defined Global Table would require:
- Dynamic migration management
- Dynamic Drizzle schema generation
- Complex database introspection
- Risk of schema drift

Instead, records are stored in a normalized structure:

```sql
-- Fixed metadata tables
global_tables (id, name, display_name, status, created_at, updated_at)
global_table_columns (id, table_id, name, display_name, type, config, "order")
global_table_records (id, table_id, data JSONB, created_at, updated_at)

-- Fixed metadata tables
components (id, name, status, version, content JSONB, created_at, updated_at)
component_requirements (id, component_id, name, type, required)

templates (id, name, status, version, content JSONB, created_at, updated_at)
template_bindings (id, template_id, requirement_id, source_type, source_ref)

administrations (id, name, status, created_at, updated_at)
administration_steps (id, admin_id, name, "order", template_id, config JSONB)

documents (id, admin_id, title, data JSONB, rendered HTML, pdf_path, status, created_at)
```

## Conventions

- All tables use `id` as primary key (nanoid or UUID)
- Timestamps: `created_at`, `updated_at`
- Soft delete: use `status` field (draft/published/archived) instead of DELETE
- JSONB for flexible data: `config`, `data`, `content`
- Foreign keys use `*_id` suffix
- Indexes on frequently queried columns

## Migration Strategy

- Use Drizzle Kit for schema migrations
- Migrations stored in `app/server/database/migrations/`
- Run migrations on server startup or via CLI

## Schema Location

Drizzle schema files are located at:
- `app/server/database/schema.ts` — main schema definition
- `app/server/database/migrations/` — migration files
- `app/shared/schemas/` — Zod validation schemas (shared with client)
