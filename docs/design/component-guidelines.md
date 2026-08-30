# Component Guidelines

## Component Reuse

Before creating a new component:

1. Search existing components
2. Check if existing component can be extended
3. Check if a variant is needed instead of a new component

## Component Naming

| Pattern | Example |
|---------|---------|
| Primitive | `AppButton`, `AppInput`, `AppSelect` |
| Pattern | `DataTable`, `FormSection`, `PropertyPanel` |
| Feature | `ColumnBuilder`, `ComponentBuilder`, `TemplateBuilder` |
| Page | `CollectionWorkspace`, `TemplateEditor` |

## Component Responsibility

Each component should have **one responsibility**:

- `AppButton` — renders a button
- `DataTable` — renders a data table
- `ColumnBuilder` — manages column creation/editing

**Avoid:** Components that do everything.

## Composition Over Inheritance

Prefer composing small components over creating large ones:

```vue
<!-- Good -->
<FormSection title="Basic Info">
  <AppInput v-model="name" label="Name" />
  <AppSelect v-model="type" label="Type" :options="types" />
</FormSection>

<!-- Bad -->
<ComplexForm type="basic-info" :fields="fields" />
```

## Variants

Use props for variants, not separate components:

```vue
<AppButton variant="primary">Save</AppButton>
<AppButton variant="secondary">Cancel</AppButton>
<AppButton variant="danger">Delete</AppButton>
```

## States

Every interactive component must handle:

- Default
- Hover
- Active/Pressed
- Focus
- Disabled
- Loading (if applicable)

## File Organization

```
app/app/components/
├── ui/                    # Design system primitives
│   ├── AppButton.vue
│   ├── AppInput.vue
│   └── ...
├── workspace/             # Workspace shell
│   ├── AppSidebar.vue
│   ├── AppCanvas.vue
│   └── ...
├── builders/              # Feature builders
│   ├── ColumnBuilder.vue
│   ├── ComponentBuilder.vue
│   └── ...
└── document/              # Document canvas
    ├── DocumentCanvas.vue
    ├── ComponentNode.vue
    └── ...
```
