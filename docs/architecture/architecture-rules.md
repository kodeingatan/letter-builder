# Architecture Rules

These rules are **mandatory** for all AI agents working on this project.

## 1. Layer Separation

```
Page → Component → Composable → API Route → Service → Repository → Database
```

Each layer has one responsibility. Never mix layers.

### Page
- Handles routing and layout
- Delegates to components
- No business logic

### Component
- Handles UI rendering and user interaction
- Calls composables for data
- No direct API calls

### Composable
- Manages feature state
- Calls API routes via `$fetch` or `useFetch`
- No business logic

### API Route
- Thin controller: parse, validate, delegate
- No business logic

### Service
- Business logic and domain rules
- Calls repositories and engines
- No HTTP handling

### Repository
- Database queries via Drizzle
- Data mapping
- No business logic

## 2. Reuse Before Create

Before creating any new:
- Component → search existing components
- Composable → search existing composables
- Service → search existing services
- Repository → search existing repositories

## 3. Do Not Modify Unrelated Code

When implementing a feature:
- Only modify files related to the feature
- Do not refactor unrelated code
- Do not upgrade unrelated dependencies

## 4. Follow Existing Patterns

- Match naming conventions of neighboring files
- Match code style of existing implementations
- Match API response format of existing routes

## 5. TypeScript Strictness

- Use TypeScript for all files
- No `any` types
- Define interfaces for all data structures
- Use Zod for runtime validation

## 6. Error Handling

- API routes return structured error responses
- Services throw domain errors
- Composables handle API errors gracefully
- Components show error states to users

## 7. Metadata-Driven Design

- Never hardcode data structures that should be user-defined
- Use metadata from Global Tables to drive UI generation
- Use expressions for computed values, not hardcoded logic

## 8. Domain Engine Independence

Domain engines (Expression, Binding, Component, Template, Render) are:
- Framework-independent
- Testable in isolation
- Located in `app/server/engines/`
- Never imported by client code directly
