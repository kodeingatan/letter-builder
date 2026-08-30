# Security

## Authentication

- Session-based authentication using Nitro session handling
- Login/logout via server API routes
- Session stored in HTTP-only cookies
- No JWT tokens (simpler for single-app architecture)

## Authorization

- Role-based: Administrator, Staff, Manager
- Permission checks at service layer
- Resource-level ownership not required (internal app)

## Validation

- All API inputs validated with Zod schemas
- Server-side validation is authoritative
- Client-side validation for UX only (never trust it)

## Data Protection

- No sensitive data in client-side storage
- File uploads validated (type, size)
- SQL injection prevented by Drizzle ORM parameterized queries
- XSS prevented by Vue's template escaping

## Secrets

- Environment variables for configuration
- No secrets in source code
- `.env` files excluded from version control

## Security Boundaries

- All API routes require authentication (except public routes if any)
- File upload restricted to allowed types
- Maximum file size enforced
- Rate limiting on auth endpoints (future)
