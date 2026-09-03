<script setup lang="ts">
interface Props {
  label: string
  error?: string
  required?: boolean
}
withDefaults(defineProps<Props>(), {
  error: '',
  required: false,
})
</script>

<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <slot />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
