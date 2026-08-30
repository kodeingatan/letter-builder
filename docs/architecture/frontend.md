# Frontend Architecture

## Framework

- **Nuxt 4** with Vue 3 Composition API
- **TypeScript** throughout
- **Nuxt UI** as base component library
- **Tailwind CSS** for utility styling

## Structure

The Nuxt application lives inside `app/`. The Vue app root is at `app/app/`.

```
app/                            # Nuxt 4 application root
├── app/                        # Vue app root (client)
│   ├── app.vue                 # Root component
│   ├── pages/                  # File-based routing
│   │   ├── index.vue           # Workspace home
│   │   ├── collections/        # Global Table pages
│   │   ├── components/         # Component builder pages
│   │   ├── templates/          # Template builder pages
│   │   ├── workflows/          # Administration pages
│   │   └── documents/          # Document management pages
│   ├── components/             # Reusable Vue components
│   │   ├── ui/                 # Design system primitives
│   │   ├── workspace/          # Workspace shell components
│   │   ├── builders/           # Feature-specific builders
│   │   └── document/           # Document canvas components
│   ├── composables/            # Vue composables
│   │   ├── useCollection.ts    # Collection data operations
│   │   ├── useComponent.ts     # Component data operations
│   │   ├── useTemplate.ts      # Template data operations
│   │   ├── useWorkflow.ts      # Workflow data operations
│   │   └── useDocument.ts      # Document data operations
│   ├── layouts/                # Page layouts
│   ├── middleware/              # Route middleware
│   ├── plugins/                # Nuxt plugins
│   └── utils/                  # Utility functions
├── server/                     # Nitro server (backend)
├── shared/                     # Shared types and schemas
├── public/                     # Static assets
├── nuxt.config.ts
└── package.json
```

## Component Architecture

```
Primitive (Button, Input, Select, ...)
    │
    ▼
Pattern (DataTable, FormSection, PropertyPanel, ...)
    │
    ▼
Feature (ColumnBuilder, ComponentBuilder, TemplateBuilder, ...)
    │
    ▼
Page (Workspace pages)
```

## State Management

- **Pinia** for global state (currently not installed — to be added)
- **Composables** for feature-specific state
- **VueUse** for utility state (keyboard, resize, drag, etc.)

## Editor Integration

- **Tiptap** for rich text editing (Component/Template editors)
- Custom Tiptap nodes for:
  - DynamicText (variable tokens)
  - Component (reusable block references)
  - Loop (repeat blocks)
  - Condition (conditional blocks)
  - PageBreak
