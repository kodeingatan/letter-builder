# Bootstrap Notes

## Date

2026-08-30

## Supplied Project Information

The user provided a comprehensive document describing:

1. **Core Concept:** Dynamic Administration & Document Composition Platform
2. **Architecture:** Data → Component → Template → Administration → Document
3. **UI Direction:** Professional Workspace (Notion/Figma/Airtable-like)
4. **Technology Stack:** Nuxt 4 + Nitro (full-stack)
5. **Recommended Libraries:** Drizzle ORM, SQLite, Tiptap, TanStack Table, Pinia, Zod, Nuxt UI, Tailwind CSS, etc.

## Discovered Project Information

| Item | Finding |
|------|---------|
| Nuxt version | 4.5.0 |
| Vue version | 3.5.40 |
| UI library | naive-ui (installed) |
| Styling | Tailwind CSS v4 (installed) |
| Animation | animejs (installed) |
| Icons | @vicons/carbon, @vicons/ionicons5 |
| Package manager | pnpm |
| Project structure | Fresh (NuxtWelcome only) |
| Existing docs | None |
| Existing AGENTS.md | None |
| Existing .opencode | Agents + commands exist |

## Assumptions

1. The application will use **Nuxt UI** as the primary component library (per user specification)
2. **naive-ui** will be replaced or supplemented with Nuxt UI during implementation
3. The application is an **internal tool** (no public auth providers needed initially)
4. **SQLite** is sufficient for the initial version
5. The application is **desktop-first** with responsive support

## Conflicts

| User Specified | Actually Installed | Resolution |
|---|---|---|
| Nuxt UI | naive-ui | Install Nuxt UI, plan naive-ui removal |
| Drizzle ORM | None | Install during implementation |
| Tiptap | None | Install during implementation |
| TanStack Table | None | Install during implementation |
| Pinia | None | Install during implementation |
| Zod | None | Install during implementation |
| Playwright | None | Install during implementation |

## Unresolved Questions

1. **Authentication:** Should the initial version include user authentication, or is it a single-user internal tool?
2. **File Storage:** Where should uploaded files (images, PDFs) be stored? Local filesystem or cloud?
3. **Database Location:** Where should the SQLite database file be stored?
4. **Deployment:** How will the application be deployed? (Docker, PM2, direct Node.js?)
5. **User Management:** Is there a need for multiple user roles, or is a single admin sufficient initially?

## Recommended Follow-ups

1. Resolve naive-ui vs Nuxt UI decision
2. Define authentication approach
3. Define file storage strategy
4. Create first feature specification: `global-table`
5. Set up testing infrastructure (Vitest, Playwright)
