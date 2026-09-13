<script setup lang="ts">
import { computed } from 'vue'
import { NInputNumber } from 'naive-ui'

const props = defineProps<{ modelValue: number | null, placeholder?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>()

const displayFormatter = (value: number | null) => {
  if (value == null) return ''
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}
const parser = (input: string) => {
  const num = Number(input.replace(/[^0-9-]/g, ''))
  return isNaN(num) ? 0 : num
}
const val = computed({
  get: () => props.modelValue,
  set: (v: number | null) => emit('update:modelValue', v),
})
</script>

<template>
  <NInputNumber
    v-model:value="val"
    :placeholder="placeholder ?? 'Rp 2.500.000'"
    :format="displayFormatter"
    :parse="parser"
    class="w-full"
    clearable
  />
</template>
