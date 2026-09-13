<script setup lang="ts">
import { NFormItem, NInput, NSelect } from 'naive-ui'
import type { DocNode } from '~/shared/types/document'

const props = defineProps<{ node: DocNode }>()
const emit = defineEmits<{ (e: 'patch', props: Record<string, unknown>): void }>()

const operatorOptions = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'empty',
].map((op) => ({ label: op, value: op }))

function current(key: string): string {
  return String(props.node.props?.[key] ?? '')
}
</script>

<template>
  <div class="condition-editor">
    <NFormItem label="Field ({{path}})">
      <NInput :value="current('field')" placeholder="{{letter.type}}" @update:value="(v: string) => emit('patch', { field: v })" />
    </NFormItem>
    <NFormItem label="Operator">
      <NSelect :value="current('operator') || 'eq'" :options="operatorOptions" @update:value="(v: string) => emit('patch', { operator: v })" />
    </NFormItem>
    <NFormItem label="Value">
      <NInput :value="current('value')" placeholder="internal" @update:value="(v: string) => emit('patch', { value: v })" />
    </NFormItem>
  </div>
</template>
