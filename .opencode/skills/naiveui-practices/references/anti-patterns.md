# Naive UI Anti-Patterns

## Import Patterns

### ❌ Global Import
```ts
// JANGAN - bundle size besar
import naive from 'naive-ui'
app.use(naive)
```

```ts
// ✅ BENAR - tree-shakable
import { NButton, NInput } from 'naive-ui'
```

## Component Patterns

### ❌ Options API
```vue
<!-- JANGAN -->
<script>
export default {
  data() {
    return { value: '' }
  }
}
</script>
```

```vue
<!-- ✅ BENAR -->
<script setup lang="ts">
const value = ref('')
</script>
```

### ❌ Tanpa TypeScript
```vue
<!-- JANGAN -->
<script setup>
const columns = [
  { title: 'Name', key: 'name' }
]
</script>
```

```vue
<!-- ✅ BENAR -->
<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'

const columns: DataTableColumns = [
  { title: 'Name', key: 'name' }
]
</script>
```

## Form Patterns

### ❌ Tanpa Ref untuk Form
```vue
<!-- JANGAN -->
<script setup lang="ts">
function handleSubmit() {
  // Tidak bisa validate programmatically
}
</script>
```

```vue
<!-- ✅ BENAR -->
<script setup lang="ts">
const formRef = ref<FormInst | null>(null)

async function handleSubmit() {
  await formRef.value?.validate()
}
</script>
```

### ❌ Validation Rules Salah
```ts
// JANGAN - tidak ada trigger
const rules = {
  name: [{ required: true, message: 'Required' }]
}

// ✅ BENAR - dengan trigger
const rules: FormRules = {
  name: [{ required: true, message: 'Required', trigger: 'blur' }]
}
```

## Data Table Patterns

### ❌ Tanpa row-key
```vue
<!-- JANGAN -->
<n-data-table :columns="columns" :data="data" />

<!-- ✅ BENAR -->
<n-data-table
  :columns="columns"
  :data="data"
  :row-key="(row: any) => row.id"
/>
```

### ❌ Custom Render Tanpa h()
```vue
<!-- JANGAN - tidak akan render -->
<script setup lang="ts">
const columns = [
  {
    title: 'Actions',
    key: 'actions',
    render(row) {
      return `<n-button>Edit</n-button>` // String, bukan VNode
    }
  }
]
</script>
```

```vue
<!-- ✅ BENAR - gunakan h() -->
<script setup lang="ts">
import { h } from 'vue'
import { NButton } from 'naive-ui'

const columns = [
  {
    title: 'Actions',
    key: 'actions',
    render(row) {
      return h(NButton, { size: 'small' }, () => 'Edit')
    }
  }
]
</script>
```

## Theme Patterns

### ❌ Hardcode Colors
```vue
<!-- JANGAN -->
<n-button style="color: #18a058; background: #fff">Submit</n-button>

<!-- ✅ BENAR - gunakan theme -->
<n-button type="primary">Submit</n-button>
```

### ❌ Inline Theme Overrides
```vue
<!-- JANGAN - sulit maintain -->
<n-config-provider :theme-overrides="{ common: { primaryColor: '#18a058' } }">
  <App />
</n-config-provider>
```

```ts
// ✅ BENAR - centralized
const themeOverrides: GlobalThemeOverrides = {
  common: { primaryColor: '#18a058' }
}
```

## Layout Patterns

### ❌ Tanpa Responsive
```vue
<!-- JANGAN -->
<n-grid :cols="3">
  <n-gi>Fixed 3 columns</n-gi>
</n-grid>
```

```vue
<!-- ✅ BENAR - responsive -->
<n-grid :cols="3" item-responsive>
  <n-gi span="3 m:1">Responsive</n-gi>
</n-grid>
```

## Feedback Patterns

### ❌ Console.log untuk Notifications
```ts
// JANGAN
console.log('Success!')
console.error('Error!')
```

```ts
// ✅ BENAR - gunakan message/notification
const message = useMessage()
message.success('Success!')
message.error('Error!')
```

### ❌ Tanpa Loading State
```vue
<!-- JANGAN -->
<n-button @click="handleSubmit">Submit</n-button>

<!-- ✅ BENAR - dengan loading -->
<n-button :loading="loading" @click="handleSubmit">Submit</n-button>
```

## Performance Patterns

### ❌ Tanpa Virtual Scroll
```vue
<!-- JANGAN - untuk 1000+ rows -->
<n-data-table :data="largeDataSet" />

<!-- ✅ BENAR - virtual scroll -->
<n-data-table :data="largeDataSet" :virtual-scroll="true" />
```

### ❌ Tidak Handle Loading
```vue
<!-- JANGAN -->
<n-data-table :data="data" />

<!-- ✅ BENAR -->
<n-spin :show="loading">
  <n-data-table :data="data" />
</n-spin>
```

## Error Handling Patterns

### ❌ Try-Catch Kosong
```ts
// JANGAN
try {
  await fetchData()
} catch {}
```

```ts
// ✅ BENAR
try {
  await fetchData()
} catch (error) {
  message.error('Failed to fetch data')
  console.error(error)
}
```

## Accessibility Patterns

### ❌ Tanpa Labels
```vue
<!-- JANGAN -->
<n-input v-model:value="email" />

<!-- ✅ BENAR - dengan label -->
<n-form-item label="Email" path="email">
  <n-input v-model:value="email" placeholder="Enter email" />
</n-form-item>
```

## Summary

| Anti-Pattern | Best Practice |
|--------------|---------------|
| Global import | Direct import |
| Options API | Composition API + `<script setup>` |
| Tanpa TypeScript | Gunakan TypeScript |
| Hardcode colors | Gunakan theme system |
| Tanpa validation | Gunakan FormRules |
| Tanpa row-key | Selalu gunakan row-key |
| String di render | Gunakan h() |
| Console.log | Gunakan message/notification |
| Tanpa loading state | Gunakan :loading prop |
| Tanpa virtual scroll | Gunakan untuk large data |
| Try-catch kosong | Handle errors properly |
| Tanpa labels | Selalu gunakan labels |
