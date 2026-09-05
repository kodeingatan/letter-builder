<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NButton, NCard, NEmpty, NSelect, NInput, NInputNumber, NSpace,
  NTag, NText, NAlert, NSpin, NDivider, NPopover,
} from 'naive-ui'
import { useTemplateBindings } from '~/composables/useTemplateBindings'
import type { BindingPlacementGroup, BindingRow, PreviewSlot } from '~/composables/useTemplateBindings'

const props = defineProps<{
  templateId: number
}>()

const emit = defineEmits<{
  (e: 'update:unbound-count', count: number): void
}>()

const {
  bindings, loading, saving, previewing, error,
  previewSlots, totalUnbound, placementGroups,
  fetchBindings, saveBindings, removeBinding, previewBindings,
} = useTemplateBindings(computed(() => props.templateId))

// --- Source options ---
const SOURCE_OPTIONS = [
  { label: 'Administration', value: 'administration' },
  { label: 'Global Table', value: 'global_table' },
  { label: 'Manual (literal)', value: 'manual' },
  { label: 'Expression', value: 'expression' },
  { label: 'System', value: 'system' },
]

const SYSTEM_KEY_OPTIONS = [
  { label: 'Current Date', value: 'current_date' },
  { label: 'User Name', value: 'user.name' },
  { label: 'User Username', value: 'user.username' },
]

// --- Local editing state ---
const editedBindings = ref<Map<string, BindingRow>>(new Map())
const hasChanges = computed(() => editedBindings.value.size > 0)

function slotKey(placementId: string, requirementName: string) {
  return `${placementId}:${requirementName}`
}

function getEdited(placementId: string, requirementName: string): BindingRow | undefined {
  return editedBindings.value.get(slotKey(placementId, requirementName))
}

function setEdited(placementId: string, row: BindingRow) {
  editedBindings.value.set(slotKey(placementId, row.requirementName), { ...row })
}

function initEditState() {
  editedBindings.value.clear()
  for (const group of placementGroups.value) {
    for (const binding of group.bindings) {
      if (binding.status !== 'stale') {
        editedBindings.value.set(slotKey(binding.placementId, binding.requirementName), { ...binding })
      }
    }
  }
}

watch(placementGroups, () => {
  initEditState()
}, { immediate: true })

// --- Source change handler ---
function handleSourceChange(placementId: string, requirementName: string, newSource: string) {
  const existing = editedBindings.value.get(slotKey(placementId, requirementName))
  if (!existing) return
  const updated: BindingRow = {
    ...existing,
    source: newSource,
    sourceRef: null,
    literalValue: null,
    expression: null,
  }
  setEdited(placementId, updated)
}

// --- Field change handlers ---
function handleSourceRefChange(placementId: string, requirementName: string, value: string | null) {
  const existing = editedBindings.value.get(slotKey(placementId, requirementName))
  if (!existing) return
  setEdited(placementId, { ...existing, sourceRef: value })
}

function handleLiteralChange(placementId: string, requirementName: string, value: string) {
  const existing = editedBindings.value.get(slotKey(placementId, requirementName))
  if (!existing) return
  setEdited(placementId, { ...existing, literalValue: value })
}

function handleExpressionChange(placementId: string, requirementName: string, value: string) {
  const existing = editedBindings.value.get(slotKey(placementId, requirementName))
  if (!existing) return
  setEdited(placementId, { ...existing, expression: value })
}

function handleSystemKeyChange(placementId: string, requirementName: string, value: string) {
  const existing = editedBindings.value.get(slotKey(placementId, requirementName))
  if (!existing) return
  setEdited(placementId, { ...existing, sourceRef: value })
}

// --- Status helpers ---
function getStatusType(row: BindingRow): 'success' | 'warning' | 'error' | 'info' {
  if (row.status === 'stale') return 'error'
  if (isBound(row)) return 'success'
  return 'warning'
}

function isBound(row: BindingRow): boolean {
  if (row.source === 'manual') return !!row.literalValue?.trim()
  if (row.source === 'expression') return !!row.expression?.trim()
  if (row.source === 'administration' || row.source === 'global_table' || row.source === 'system') return !!row.sourceRef?.trim()
  return false
}

function getStatusLabel(row: BindingRow): string {
  if (row.status === 'stale') return 'Stale'
  if (isBound(row)) return 'Bound'
  return 'Unbound'
}

// --- Save handler ---
async function handleSave() {
  const rowsToSave: BindingRow[] = []
  for (const [, row] of editedBindings.value) {
    rowsToSave.push(row)
  }
  if (!rowsToSave.length) return
  try {
    await saveBindings(rowsToSave)
    editedBindings.value.clear()
  } catch {
    // error is set by composable
  }
}

// --- Preview handler ---
async function handlePreview() {
  await previewBindings()
}

// --- Unbound alert ---
const showUnboundAlert = computed(() => totalUnbound.value > 0)

// --- Preview value lookup ---
function findPreviewValue(placementId: string, requirementName: string): unknown {
  const slot = previewSlots.value.find(
    (s) => s.placementId === placementId && s.requirementName === requirementName,
  )
  return slot?.resolvedValue ?? null
}

const expandedPlacements = ref<Set<string>>(new Set())

function toggleExpand(placementId: string) {
  if (expandedPlacements.value.has(placementId)) {
    expandedPlacements.value.delete(placementId)
  } else {
    expandedPlacements.value.add(placementId)
  }
}

onMounted(() => {
  fetchBindings()
})

// Expose for parent
defineExpose({ fetchBindings, totalUnbound })
</script>

<template>
  <div>
    <NSpin :show="loading">
      <NAlert
        v-if="showUnboundAlert"
        type="warning"
        title="Unbound requirement slots"
        style="margin-bottom: 12px;"
      >
        <NText>{{ totalUnbound }} requirement slot(s) are not yet bound. Publish will be blocked until all slots are bound.</NText>
      </NAlert>

      <NAlert
        v-if="error"
        type="error"
        :title="error"
        style="margin-bottom: 12px;"
        closable
        @close="error = null"
      />

      <NEmpty
        v-if="!loading && !placementGroups.length"
        description="No component placements found. Add components to the canvas first (Task 15)."
      />

      <div v-for="group in placementGroups" :key="group.placementId" style="margin-bottom: 16px;">
        <NCard size="small">
          <template #header>
            <NSpace align="center" :size="8">
              <NText strong>{{ group.componentName }}</NText>
              <NText depth="3" style="font-size: 12px;">Placement #{{ group.placementId.slice(0, 8) }}</NText>
            </NSpace>
          </template>
          <template #header-extra>
            <NText depth="3" style="font-size: 12px;">
              {{ group.bindings.filter(b => isBound(b)).length }}/{{ group.bindings.length }} bound
            </NText>
          </template>

          <!-- Binding rows -->
          <div v-for="row in group.bindings" :key="row.requirementName" class="binding-row">
            <div class="binding-header">
              <NSpace align="center" :size="8">
                <NTag
                  size="small"
                  :bordered="false"
                  :type="getStatusType(row)"
                >
                  {{ getStatusLabel(row) }}
                </NTag>
                <NText strong style="font-size: 13px;">{{ row.requirementName }}</NText>
                <NText depth="3" style="font-size: 12px;">({{ row.requirementType }})</NText>
              </NSpace>
            </div>

            <!-- Stale alert -->
            <NAlert
              v-if="row.status === 'stale'"
              type="error"
              :title="`Stale: ${row.staleReason}`"
              style="margin: 8px 0;"
              :bordered="false"
              size="small"
            >
              <NText>The bound resource no longer exists. Rebind or remove this binding.</NText>
            </NAlert>

            <!-- Source selector -->
            <div class="binding-controls">
              <NSpace :size="8" align="center" style="width: 100%;">
                <NSelect
                  :value="row.source"
                  :options="SOURCE_OPTIONS"
                  size="small"
                  style="width: 160px;"
                  placeholder="Source"
                  :disabled="row.status === 'stale'"
                  @update:value="(v) => handleSourceChange(row.placementId, row.requirementName, v)"
                />

                <!-- Administration source: field picker placeholder -->
                <NSelect
                  v-if="row.source === 'administration'"
                  :value="row.sourceRef"
                  size="small"
                  style="flex: 1;"
                  placeholder="Select administration field (Task 17)"
                  disabled
                />

                <!-- Global table source: table + column -->
                <template v-if="row.source === 'global_table'">
                  <NInput
                    :value="row.sourceRef ?? ''"
                    size="small"
                    style="flex: 1;"
                    placeholder="tableName.columnName (e.g. pegawai.nama)"
                    @update:value="(v) => handleSourceRefChange(row.placementId, row.requirementName, v)"
                  />
                </template>

                <!-- Manual source: literal input -->
                <NInput
                  v-if="row.source === 'manual'"
                  :value="row.literalValue ?? ''"
                  size="small"
                  style="flex: 1;"
                  placeholder="Enter literal value"
                  @update:value="(v) => handleLiteralChange(row.placementId, row.requirementName, v)"
                />

                <!-- Expression source: monospace input -->
                <NInput
                  v-if="row.source === 'expression'"
                  :value="row.expression ?? ''"
                  size="small"
                  style="flex: 1; font-family: monospace;"
                  placeholder='e.g. data.nama + " " + data.gelar'
                  @update:value="(v) => handleExpressionChange(row.placementId, row.requirementName, v)"
                />

                <!-- System source: key picker -->
                <NSelect
                  v-if="row.source === 'system'"
                  :value="row.sourceRef"
                  :options="SYSTEM_KEY_OPTIONS"
                  size="small"
                  style="flex: 1;"
                  placeholder="Select system key"
                  @update:value="(v) => handleSystemKeyChange(row.placementId, row.requirementName, v)"
                />
              </NSpace>
            </div>

            <!-- Preview value -->
            <div
              v-if="previewSlots.length"
              class="binding-preview"
            >
              <NText depth="3" style="font-size: 12px;">
                Preview:
                <NText code>{{ findPreviewValue(row.placementId, row.requirementName) ?? '—' }}</NText>
              </NText>
            </div>
          </div>
        </NCard>
      </div>
    </NSpin>

    <!-- Actions -->
    <NDivider />
    <NSpace justify="end">
      <NButton
        size="small"
        :disabled="!placementGroups.length"
        :loading="previewing"
        @click="handlePreview"
      >
        Preview
      </NButton>
      <NButton
        type="primary"
        size="small"
        :loading="saving"
        :disabled="!hasChanges"
        @click="handleSave"
      >
        Save Bindings
      </NButton>
    </NSpace>
  </div>
</template>

<style scoped>
.binding-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--n-border-color, #efeff5);
}
.binding-row:last-child {
  border-bottom: none;
}
.binding-header {
  margin-bottom: 8px;
}
.binding-controls {
  display: flex;
  align-items: center;
}
.binding-preview {
  margin-top: 6px;
}
</style>
