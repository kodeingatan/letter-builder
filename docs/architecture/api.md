# API Architecture

## Conventions

- All API routes are under `/api/`
- RESTful resource naming
- JSON request/response bodies
- Consistent error format

## Response Format

### Success

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "name", "message": "Required" }
    ]
  }
}
```

## HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Read list or single resource | `/api/collections` |
| POST | Create resource | `/api/collections` |
| PUT | Update resource | `/api/collections/:id` |
| PATCH | Partial update | `/api/collections/:id` |
| DELETE | Remove resource | `/api/collections/:id` |

## Validation

- Use **Zod** schemas for request validation
- Validate on server before processing
- Return structured validation errors

## Authentication

- Session-based authentication
- Middleware checks on protected routes
- User context available in all API routes

## Authorization

- Role-based access control (RBAC)
- Permissions checked at service layer
- Resource-level permissions for sensitive operations

## Pagination

```
GET /api/collections?page=1&per_page=20&sort=name&order=asc
```

Query parameters:
- `page` — page number (default: 1)
- `per_page` — items per page (default: 20, max: 100)
- `sort` — sort field
- `order` — sort direction (asc/desc)
- `search` — search query

## Filtering

```
GET /api/collections?status=published&search=pegawai
```
