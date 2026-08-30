# Naive UI Best Practices

## Import Patterns

### ✅ Direct Import (Recommended)
```vue
<script setup lang="ts">
import { NButton, NInput, NCard } from 'naive-ui'
</script>
```

### ❌ Global Import
```ts
// Avoid - larger bundle size
import naive from 'naive-ui'
app.use(naive)
```

## Component Usage

### ✅ Composition API dengan TypeScript
```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'

const value = ref('')
const columns: DataTableColumns = [...]
</script>
```

### ❌ Options API
```vue
<!-- Avoid -->
<script>
export default {
  data() {
    return { value: '' }
  }
}
</script>
```

## Form Handling

### ✅ Proper Form Structure
```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

const formRef = ref<FormInst | null>(null)
const model = ref({ name: '' })
const rules: FormRules = {
  name: [{ required: true, message: 'Required', trigger: 'blur' }]
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    // Submit
  } catch {}
}
</script>

<template>
  <n-form ref="formRef" :model="model" :rules="rules">
    <n-form-item label="Name" path="name">
      <n-input v-model:value="model.name" />
    </n-form-item>
  </n-form>
</template>
```

## Data Table

### ✅ Proper Table Setup
```vue
<script setup lang="ts">
import { h } from 'vue'
import { NButton } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const columns: DataTableColumns = [
  { title: 'Name', key: 'name' },
  {
    title: 'Actions',
    key: 'actions',
    render(row) {
      return h(NButton, { size: 'small', onClick: () => edit(row) }, () => 'Edit')
    }
  }
]
</script>

<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :row-key="(row: any) => row.id"
  />
</template>
```

## Theme Customization

### ✅ Centralized Theme
```ts
// theme.ts
import type { GlobalThemeOverrides } from 'naive-ui'

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
  },
  Button: {
    borderRadiusMedium: '4px',
  }
}
```

```vue
// App.vue
<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <App />
  </n-config-provider>
</template>
```

## Layout

### ✅ Proper Layout Structure
```vue
<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider bordered width="240">
      <AppSidebar />
    </n-layout-sider>
    
    <n-layout>
      <n-layout-header bordered height="64">
        <AppHeader />
      </n-layout-header>
      
      <n-layout-content :native-scrollbar="false" style="padding: 24px">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
```

## Performance

### ✅ Virtual Scroll untuk Large Data
```vue
<template>
  <n-data-table
    :data="largeDataSet"
    :virtual-scroll="true"
    :max-height="400"
  />
</template>
```

### ✅ Lazy Loading
```vue
<script setup lang="ts">
const { data, loading } = useFetch('/api/data', { lazy: true })
</script>

<template>
  <n-spin :show="loading">
    <n-data-table :data="data" />
  </n-spin>
</template>
```

## Icons

### ✅ Use xicons
```vue
<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { HomeOutlined } from '@vicons/ionicons5'
</script>

<template>
  <n-icon :component="HomeOutlined" />
</template>
```

## Composition

### ✅ Composable Pattern
```ts
// composables/useTableSelection.ts
import { ref } from 'vue'

export function useTableSelection<T>(keyFn: (row: T) => string | number) {
  const selectedKeys = ref<(string | number)[]>([])
  
  function handleCheck(keys: (string | number)[]) {
    selectedKeys.value = keys
  }
  
  return { selectedKeys, handleCheck }
}
```

## Accessibility

### ✅ Proper Labels
```vue
<template>
  <n-form-item label="Email" path="email">
    <n-input v-model:value="email" placeholder="Enter your email" />
  </n-form-item>
</template>
```

### ✅ Keyboard Navigation
```vue
<template>
  <n-button @keydown.enter="handleClick">Submit</n-button>
</template>
```

## Common Patterns

### ✅ Confirmation Pattern
```vue
<script setup lang="ts">
import { useDialog, useMessage } from 'naive-ui'

const dialog = useDialog()
const message = useMessage()

function handleDelete(item: any) {
  dialog.warning({
    title: 'Delete Confirmation',
    content: `Are you sure you want to delete "${item.name}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      await deleteItem(item.id)
      message.success('Deleted successfully')
    },
  })
}
</script>
```

### ✅ Form Submission Pattern
```vue
<script setup lang="ts">
const loading = ref(false)

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await submitData(model.value)
    message.success('Submitted successfully')
  } catch (errors) {
    // Validation failed
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <n-button :loading="loading" @click="handleSubmit">Submit</n-button>
</template>
```

## Anti-Patterns (Hindari)

- ❌ Global import untuk semua components
- ❌ Options API alih-alih Composition API
- ❌ Hardcode colors di components
- ❌ Skip TypeScript types
- ❌ Ignore form validation
- ❌ Tidak handle loading states
- ❌ Tidak gunakan virtual scroll untuk large data
- ❌ Tidak gunakan row-key untuk selection
