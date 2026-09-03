# Naive UI Form System

## Form Structure

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

const formRef = ref<FormInst | null>(null)
const model = ref({
  name: '',
  email: '',
  password: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: 'Name is required', trigger: 'blur' },
    { min: 2, max: 50, message: 'Name must be 2-50 characters', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Invalid email format', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    // Form is valid, submit data
  } catch (errors) {
    // Validation failed
  }
}
</script>

<template>
  <n-form ref="formRef" :model="model" :rules="rules">
    <n-form-item label="Name" path="name">
      <n-input v-model:value="model.name" placeholder="Enter name" />
    </n-form-item>
    
    <n-form-item label="Email" path="email">
      <n-input v-model:value="model.email" placeholder="Enter email" />
    </n-form-item>
    
    <n-form-item label="Password" path="password">
      <n-input v-model:value="model.password" type="password" show-password-on="click" />
    </n-form-item>
    
    <n-form-item>
      <n-button type="primary" @click="handleSubmit">Submit</n-button>
    </n-form-item>
  </n-form>
</template>
```

## Validation Rules

### Basic Rules

```ts
const rules: FormRules = {
  // Required
  field1: [
    { required: true, message: 'Field is required', trigger: 'blur' },
  ],
  
  // String length
  field2: [
    { min: 3, max: 20, message: 'Must be 3-20 characters', trigger: 'blur' },
  ],
  
  // Pattern
  field3: [
    { pattern: /^[A-Za-z]+$/, message: 'Only letters allowed', trigger: 'blur' },
  ],
  
  // Type validation
  field4: [
    { type: 'email', message: 'Invalid email', trigger: 'blur' },
    { type: 'url', message: 'Invalid URL', trigger: 'blur' },
  ],
  
  // Custom validator
  field5: [
    {
      validator: (rule, value) => {
        if (value < 0) return new Error('Must be positive')
        return true
      },
      trigger: 'blur',
    },
  ],
}
```

### Async Validation

```ts
const rules: FormRules = {
  username: [
    {
      validator: async (rule, value) => {
        const exists = await checkUsernameExists(value)
        if (exists) throw new Error('Username already taken')
      },
      trigger: 'blur',
    },
  ],
}
```

## Form Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| model | `object` | - | Form data model |
| rules | `FormRules` | - | Validation rules |
| label-placement | `'left' \| 'top'` | `'top'` | Label position |
| label-width | `number \| string` | `undefined` | Label width |
| label-align | `'left' \| 'right'` | `'left'` | Label alignment |
| require-mark-placement | `'right' \| 'left'` | `'right'` | Required mark position |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | Form size |
| disabled | `boolean` | `false` | Disable all fields |

## FormItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | - | Field label |
| path | `string` | - | Path to field in model |
| required | `boolean` | `false` | Show required mark |
| validation-status | `'success' \| 'error' \| 'warning'` | - | Override validation status |
| feedback | `string` | - | Custom feedback message |
| ignore-path-change | `boolean` | `false` | Ignore path changes |

## Dynamic Forms

```vue
<script setup lang="ts">
import { ref } from 'vue'

const fields = ref([
  { key: 'name', label: 'Name', type: 'input', value: '' },
  { key: 'email', label: 'Email', type: 'input', value: '' },
])

function addField() {
  fields.value.push({
    key: `field-${Date.now()}`,
    label: 'New Field',
    type: 'input',
    value: '',
  })
}

function removeField(index: number) {
  fields.value.splice(index, 1)
}
</script>

<template>
  <n-form>
    <n-form-item
      v-for="(field, index) in fields"
      :key="field.key"
      :label="field.label"
    >
      <n-input v-model:value="field.value" />
      <n-button @click="removeField(index)" size="small" type="error">
        Remove
      </n-button>
    </n-form-item>
    
    <n-button @click="addField">Add Field</n-button>
  </n-form>
</template>
```

## Best Practices

- Gunakan `FormInst` ref untuk programmatic validation
- Definisikan rules di `<script setup>` untuk type safety
- Gunakan `trigger: 'blur'` untuk validation saat blur
- Gunakan `trigger: 'change'` untuk real-time validation
- Gunakan custom validators untuk complex logic
- Gunakan `path` di FormItem untuk nested objects
- Disable form saat submitting untuk prevent double submit
