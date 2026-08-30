# System Context

## Actors

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│   User   │────▶│   Persuratan     │────▶│   SQLite     │
│ (Browser)│     │   (Nuxt App)     │     │  Database    │
└──────────┘     └──────────────────┘     └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  File System │
                  │  (Storage)   │
                  └──────────────┘
```

## Boundaries

### In Scope

- Dynamic data structure management (Global Tables)
- Reusable document component system
- Template composition engine
- Administration workflow engine
- Document rendering (HTML + PDF)
- File upload/download (images, attachments)
- Authentication and authorization

### Out of Scope

- External database systems (MySQL, PostgreSQL) — SQLite only
- Third-party document services
- External authentication providers (for now)
- Mobile native applications
- Real-time collaboration

## External Integrations

| System | Purpose | Status |
|--------|---------|--------|
| File System | Image/document storage | Required |
| Browser Print API | PDF preview | Client-side |
| Playwright | PDF generation | Server-side |
