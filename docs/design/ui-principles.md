# UI Principles

## Visual Hierarchy

Every page must have a clear reading order:

1. Page title
2. Context/breadcrumb
3. Primary action
4. Main content
5. Secondary actions

## Consistency

- Use design tokens for all visual properties
- Never hardcode colors, spacing, or typography
- Match patterns from neighboring components
- Follow existing component API

## Density

- Desktop: dense but breathable
- Use space efficiently, not wastefully
- Avoid excessive padding
- Allow information density for power users

## Clarity

- One primary action per section
- Clear labels on all interactive elements
- No ambiguous icons without labels
- Progress disclosure over information overload

## Information Architecture

- Group related content
- Use tabs for parallel views
- Use breadcrumbs for navigation context
- Use sidebar for resource listing

## Workspace Concept

The application is a **workspace**, not a dashboard:

```
┌─────────────────────────────────────────────────┐
│  Breadcrumb / Search / Command    + New   User  │
├──────────┬──────────────────────┬───────────────┤
│ Sidebar  │     Main Canvas      │  Properties   │
│          │                      │  (contextual) │
│ Resources│                      │               │
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

- Sidebar collapses when not needed
- Properties panel appears on selection
- Command palette for global actions (Cmd+K)
