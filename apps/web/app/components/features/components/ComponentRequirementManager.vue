<script setup lang="ts">
import { NButton, NEmpty, NIcon, NInput, NSelect, NSpace, NText } from 'naive-ui'
import { Add, TrashCan } from '@vicons/carbon'
import { COMPONENT_REQUIREMENT_TYPES, isValidRequirementName } from '~/composables/useComponentsData'
import type { ComponentRequirement } from '~/shared/types/component'

const props = defineProps<{
  requirements: ComponentRequirement[]
  samples: Record<string, string>
  showSamples?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:requirements', value: ComponentRequirement[]): void
  (e: 'update:samples', value: Record<string, string>): void
}>()

const typeOptions = COMPONENT_REQUIREMENT_TYPES.map((t) => ({ label: t, value: t }))

function updateRequirements(next: ComponentRequirement[]) {
  emit('update:requirements', next)
}

function handleAdd() {
  updateRequirements([...props.requirements, { name: '', type: 'text' }])
}

function handleRemove(index: number) {
  const removed = props.requirements[index]
  updateRequirements(props.requirements.filter((_, i) => i !== index))
  if (removed?.name) {
    const next = { ...props.samples }
    delete next[removed.name]
    emit('update:samples', next)
  }
}

function handleNameChange(index: number, value: string) {
  const next = props.requirements.map((r, i) => (i === index ? { ...r, name: value } : r))
  updateRequirements(next)
}

function handleTypeChange(index: number, value: string) {
  const next = props.requirements.map((r, i) =>
    i === index ? { ...r, type: value as ComponentRequirement['type'] } : r,
  )
  updateRequirements(next)
}

function handleSampleChange(name: string, value: string) {
  emit('update:samples', { ...props.samples, [name]: value })
}

function nameStatus(name: string, index: number): 'error' | undefined {
  if (!name) return undefined
  if (!isValidRequirementName(name)) return 'error'
  const dup = props.requirements.some((r, i) => i !== index && r.name.toLowerCase() === name.toLowerCase())
  return dup ? 'error' : undefined
}

</script>

<template>
  <div>
    <NSpace vertical :size="8">
      <div
        v-for="(req, i) in requirements"
        :key="`req-${i}`"
        class="flex flex-col gap-2 rounded-md border p-3"
        style="border-color: #e2e8f0;"
      >
        <div class="flex items-start gap-2">
          <NInput
            :value="req.name"
            placeholder="e.g. nama"
            :status="nameStatus(req.name, i)"
            class="flex-1"
            style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
            @update:value="(v) => handleNameChange(i, v)"
          />
          <NSelect
            :value="req.type"
            :options="typeOptions"
            style="width: 130px;"
            @update:value="(v) => handleTypeChange(i, v)"
          />
          <NButton quaternary type="error" size="small" @click="handleRemove(i)">
            <template #icon><NIcon><TrashCan /></NIcon></template>
          </NButton>
        </div>
        <NText
          v-if="req.name && nameStatus(req.name, i) === 'error'"
          type="error"
          style="font-size: 12px;"
        >
          Use unique snake_case (start with a letter; a–z, 0–9, _).
        </NText>
        <NInput
          v-if="showSamples && req.name"
          :value="samples[req.name] ?? ''"
          :placeholder="`Sample ${req.name} (optional override)`"
          size="small"
          @update:value="(v) => handleSampleChange(req.name, v)"
        />
      </div>
      <NEmpty v-if="!requirements.length" size="small" description="No requirements — add nama, nip, jabatan…" />
      <NButton dashed size="small" @click="handleAdd">
        <template #icon><NIcon><Add /></NIcon></template>
        Add Requirement
      </NButton>
    </NSpace>
  </div>
</template>
