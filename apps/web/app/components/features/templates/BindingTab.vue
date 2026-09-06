<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  NButton, NCard, NEmpty, NSelect, NInput, NSpace,
  NTag, NText, NAlert, NSpin, NDivider,
} from 'naive-ui'
import { useTemplateBindings, isBindingRowBound } from '~/composables/useTemplateBindings'
import type { BindingPlacementGroup, BindingRow, PreviewSlot } from '~/composables/useTemplateBindings'

const props = defineProps<{
  templateId: number
}>()

const emit = defineEmits<{
  (e: 'update:unbound-count', count: number): void
}>()

const {
  loading, saving, previewing, error,
  previewSlots, totalUnbound, placementGroups,
  fetchBindings, saveBindings, removeBinding, previewBindings,
} = useTemplateBindings(computed(() => props.templateId))

// Share the unbound counter with the canvas tab (Task 15 publish guard badge).
watch(totalUnbound, (count) => emit('update:unbound-count', count), { immediate: true })

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

// Rendered rows overlay local edits onto server state so source changes
// reflect immediately (previously selects were bound to server rows and
// visually snapped back on every change).
const displayGroups = computed<BindingPlacementGroup[]>(() =>
  placementGroups.value.map((group) => ({
    ...group,
    bindings: group.bindings.map(
      (row) => editedBindings.value.get(slotKey(row.placementId, row.requirementName)) ?? row,
    ),
  })),
)

// --- REQ-004: loop placements default per-item bindings to item.* ---
function defaultGroupToItem(group: BindingPlacementGroup) {
  for (const row of group.bindings) {
    const key = slotKey(row.placementId, row.requirementName)
    const current = editedBindings.value.get(key) ?? { ...row }
    if (current.status === 'stale') continue
    editedBindings.value.set(key, {
      ...current,
      source: 'global_table',
      sourceRef: `item.${current.requirementName}`,
      literalValue: null,
      expression: null,
    })
  }
}

// --- Unbind (slot returns to unbound) ---
const unbindingId = ref<number | null>(null)

async function handleUnbind(row: BindingRow) {
  if (row.id == null) return
  unbindingId.value = row.id
  try {
    await removeBinding(row.id)
  } catch {
    // error is set by composable
  } finally {
    unbindingId.value = null
  }
}

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
  return isBindingRowBound(row)
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
        v-if="!loading && !displayGroups.length"
        description="No component placements found. Add components to the canvas first (Task 15)."
      />

      <div v-for="group in displayGroups" :key="group.placementId" style="margin-bottom: 16px;">
        <NCard size="small">
          <template #header>
            <NSpace align="center" :size="8">
              <NText strong>{{ group.componentName }}</NText>
              <NText depth="3" style="font-size: 12px;">Placement #{{ group.placementId.slice(0, 8) }}</NText>
              <NTag v-if="group.inLoop" size="small" :bordered="false" type="info">Loop item scope</NTag>
              <NTag v-if="group.orphaned" size="small" :bordered="false" type="error">Orphaned placement</NTag>
            </NSpace>
          </template>
          <template #header-extra>
            <NSpace align="center" :size="8">
              <NText depth="3" style="font-size: 12px;">
                {{ group.bindings.filter(b => isBound(b)).length }}/{{ group.bindings.length }} bound
              </NText>
              <NButton
                v-if="group.inLoop && !group.orphaned"
                size="tiny"
                secondary
                @click="defaultGroupToItem(group)"
              >
                Use item.* defaults
              </NButton>
            </NSpace>
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

                <!-- Global table source: table + column (or item.* inside loops) -->
                <template v-if="row.source === 'global_table'">
                  <NInput
                    :value="row.sourceRef ?? ''"
                    size="small"
                    style="flex: 1;"
                    placeholder="tableName.columnName (e.g. pegawai.nama) or item.field in loops"
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

            <!-- Unbind action for persisted rows -->
            <div v-if="row.id != null" style="margin-top: 6px;">
              <NButton
                size="tiny"
                tertiary
                type="error"
                :loading="unbindingId === row.id"
                @click="handleUnbind(row)"
              >
                Unbind
              </NButton>
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
