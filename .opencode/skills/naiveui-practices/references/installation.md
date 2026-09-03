# Naive UI Installation

## Package Installation

```bash
# npm
npm i naive-ui

# pnpm
pnpm add naive-ui

# yarn
yarn add naive-ui
```

## Additional Packages

```bash
# Icons (recommended: xicons)
npm i @vicons/ionicons5

# Fonts (optional)
npm i vfonts
```

## Usage Patterns

### 1. Direct Import (Recommended)

Tree-shakable, efficient bundle size:

```vue
<script setup lang="ts">
import { NButton, NInput } from 'naive-ui'
</script>

<template>
  <n-button type="primary">Click me</n-button>
  <n-input placeholder="Type here" />
</template>
```

### 2. Global Installation

Not recommended for production (larger bundle):

```ts
// main.ts
import naive from 'naive-ui'

app.use(naive)
```

### 3. Selective Global Installation

Install specific components globally:

```ts
// main.ts
import { create, NButton, NInput } from 'naive-ui'

const naive = create({
  components: [NButton, NInput]
})

app.use(naive)
```

### 4. Auto Import (Build-time)

Configure with unplugin-vue-components:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    Components({
      resolvers: [NaiveUiResolver()]
    })
  ]
}
```

## TypeScript Setup

### Volar Integration

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["naive-ui/volar"]
  }
}
```

### Global Component Types

For auto-import without explicit imports, add to your type declarations:

```ts
// env.d.ts or shims-naive-ui.d.ts
/// <reference types="naive-ui/volar" />
```

## Nuxt Integration

For Nuxt projects, use the official module:

```bash
npx nuxt module add naive-ui
```

Or manual setup with auto-import resolver.

## Best Practices

- Gunakan **direct import** untuk production (tree-shaking)
- Gunakan **selective global** untuk components yang sering dipakai
- Hindari **global install** untuk bundle size optimal
- Setup TypeScript types untuk IDE support
- Gunakan xicons untuk icons
