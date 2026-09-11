<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NSelect, NRadioGroup, NRadio,
  NSpace, NButton, NTag, NText, NAlert, NEmpty, NSpin,
} from 'naive-ui'
import type { CompositionNode, SlotChip, LoopSourceConfig } from '~/shared/types/template'
import type { ComponentDetail, ComponentListItem } from '~/shared/types/component'
import type { GlobalTable } from '~/shared/types/global-table'
import {
  unwrapTokenExpression,
  isBooleanShapedExpression,
  LOOP_FILTER_OPERATORS,
  validateTreeExpression,
} from '~/composables/useCompositionTree'

const props = defineProps<{
  node: CompositionNode | null
  slots: SlotChip[]
  componentDetail: ComponentDetail | null
  loadingComponent: boolean
  components: ComponentListItem[]
  tables: GlobalTable[]
  rowOptions: Array<{ label: string; value: number }>
  loadingRows: boolean
}>()

const emit = defineEmits<{
  (e: 'patch', patch: Record<string, any>): void
}>()

const attrs = computed(() => props.node?.attrs ?? {})
const kind = computed(() => props.node?.kind ?? null)

function patch(patch: Record<string, any>) {
  emit('patch', patch)
}

function patchSource(sourcePatch: Partial<LoopSourceConfig>) {
  const current = (attrs.value.source ?? { tableName: '', mode: 'all', rowIds: [], filter: [] }) as LoopSourceConfig
  patch({ source: { ...current, ...sourcePatch } })
}

// --- Component placement ---
const versionOptions = computed(() => {
  const versions = props.componentDetail?.versions ?? []
  if (!versions.length && props.componentDetail) {
    return [{ label: `v${props.componentDetail.version} (working copy)`, value: props.componentDetail.version }]
  }
  return versions.map((v) => ({ label: `v${v.version}`, value: v.version }))
})

const componentOptions = computed(() =>
  props.components.map((c) => ({ label: `${c.name} (v${c.version})`, value: c.id })),
)

// --- Loop source ---
const tableOptions = computed(() =>
  props.tables.map((t) => ({ label: `${t.displayName || t.name} (${t.name})`, value: t.name })),
)

function addFilterRule() {
  const filter = [...(((attrs.value.source as LoopSourceConfig | undefined)?.filter) ?? [])]
  filter.push({ field: '', operator: '==', value: '' })
  patchSource({ filter })
}

function updateFilterRule(index: number, rulePatch: Partial<{ field: string; operator: string; value: unknown }>) {
  const filter = [...(((attrs.value.source as LoopSourceConfig | undefined)?.filter) ?? [])]
  filter[index] = { ...filter[index], ...rulePatch }
  patchSource({ filter })
}

function removeFilterRule(index: number) {
  const filter = (((attrs.value.source as LoopSourceConfig | undefined)?.filter) ?? []).filter((_, i) => i !== index)
  patchSource({ filter })
}

// --- Condition / token live validation (Task 09 subset) ---
const expressionCheck = computed(() => {
  if (kind.value !== 'condition' && kind.value !== 'data-token') return null
  const raw = String(attrs.value.expression ?? '')
  if (!raw.trim()) return { valid: false as boolean, error: 'Expression is required', booleanShaped: false }
  const inner = unwrapTokenExpression(raw)
  const result = validateTreeExpression(raw)
  if (!result.valid) return { valid: false as boolean, error: result.error ?? 'Invalid expression', booleanShaped: false }
  return { valid: true as boolean, error: undefined as string | undefined, booleanShaped: isBooleanShapedExpression(inner) }
})

// --- Table structure ---
function addTableRow() {
  const cols = Array.isArray(attrs.value.headers) ? attrs.value.headers.length : 1
  patch({ rows: [...(attrs.value.rows ?? []), Array(cols).fill('')] })
}

function addTableColumn() {
  patch({
    headers: [...(attrs.value.headers ?? []), `Column ${(attrs.value.headers ?? []).length + 1}`],
    rows: (attrs.value.rows ?? []).map((r: unknown[]) => [...(Array.isArray(r) ? r : []), '']),
  })
}
</script>

<template>
  <NCard size="small" title="Inspector" style="height: 100%;">
    <NEmpty v-if="!node" size="small" description="Select a node on the canvas to configure it" />
    <NSpin v-else :show="loadingComponent">
      <NForm label-placement="top">
        <!-- Component placement -->
        <template v-if="kind === 'component'">
          <NFormItem label="Component">
            <NSelect
              :value="attrs.componentId"
              :options="componentOptions"
              filterable
              @update:value="(v) => patch({ componentId: v, componentVersion: undefined, bindings: {} })"
            />
          </NFormItem>
          <NFormItem label="Pinned version">
            <NSelect
              :value="attrs.componentVersion ?? null"
              :options="versionOptions"
              placeholder="Latest published by default"
              clearable
              @update:value="(v) => patch({ componentVersion: v })"
            />
          </NFormItem>
          <NFormItem label="Slot requirement">
            <NSpace :size="4">
              <NTag
                v-for="slot in slots"
                :key="slot.name"
                size="small"
                :bordered="false"
                :type="slot.bound ? 'success' : 'warning'"
              >
                {{ slot.name }} · {{ slot.type }}
              </NTag>
              <NText v-if="!slots.length" depth="3" style="font-size: 12px;">No slots.</NText>
            </NSpace>
          </NFormItem>
        </template>

        <!-- Loop source -->
        <template v-if="kind === 'loop'">
          <NFormItem label="Source table (BR-002)">
            <NSelect
              :value="attrs.source?.tableName ?? ''"
              :options="tableOptions"
              filterable
              placeholder="Pick a Global Table"
              @update:value="(v) => patchSource({ tableName: v })"
            />
          </NFormItem>
          <NFormItem label="Row selection mode">
            <NRadioGroup
              :value="attrs.source?.mode ?? 'all'"
              @update:value="(v) => patchSource({ mode: v })"
            >
              <NSpace :size="8">
                <NRadio value="all">All rows</NRadio>
                <NRadio value="selected">Selected</NRadio>
                <NRadio value="filtered">Filtered</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
          <NFormItem v-if="attrs.source?.mode === 'selected'" label="Rows (≥1 required)">
            <NSelect
              :value="attrs.source?.rowIds ?? []"
              :options="rowOptions"
              multiple
              filterable
              :loading="loadingRows"
              placeholder="Pick rows"
              @update:value="(v) => patchSource({ rowIds: v })"
            />
          </NFormItem>
          <template v-if="attrs.source?.mode === 'filtered'">
            <NFormItem label="Filter rules (AND-chain, lite)">
              <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                <div
                  v-for="(rule, i) in (attrs.source?.filter ?? [])"
                  :key="i"
                  style="display: flex; gap: 6px;"
                >
                  <NInput
                    :value="rule.field"
                    size="small"
                    placeholder="field"
                    @update:value="(v) => updateFilterRule(i, { field: v })"
                  />
                  <NSelect
                    :value="rule.operator"
                    size="small"
                    :options="[...LOOP_FILTER_OPERATORS].map((o) => ({ label: o, value: o }))"
                    style="width: 110px;"
                    @update:value="(v) => updateFilterRule(i, { operator: v })"
                  />
                  <NInput
                    :value="String(rule.value ?? '')"
                    size="small"
                    placeholder="value"
                    @update:value="(v) => updateFilterRule(i, { value: v })"
                  />
                  <NButton size="small" type="error" ghost @click="removeFilterRule(i)">×</NButton>
                </div>
                <NButton size="small" dashed @click="addFilterRule">+ Add rule</NButton>
              </div>
            </NFormItem>
          </template>
        </template>

        <!-- Condition / data-token -->
        <template v-if="kind === 'condition' || kind === 'data-token'">
          <NFormItem :label="kind === 'condition' ? 'Condition expression (Task 09)' : 'Data token ({{...}})'">
            <NInput
              :value="String(attrs.expression ?? '')"
              type="textarea"
              :rows="2"
              placeholder='data.total > 100 or {{data.nip}}'
              style="font-family: monospace;"
              @update:value="(v) => patch({ expression: v })"
            />
          </NFormItem>
          <NAlert
            v-if="expressionCheck && !expressionCheck.valid"
            type="error"
            title="Invalid expression — save blocked"
            :bordered="false"
            style="margin-bottom: 8px;"
          >
            {{ expressionCheck.error }}
          </NAlert>
          <NAlert
            v-else-if="kind === 'condition' && expressionCheck && !expressionCheck.booleanShaped"
            type="warning"
            title="Not comparison-shaped"
            :bordered="false"
            style="margin-bottom: 8px;"
          >
            Valid syntax, but it will be truthiness-coerced at render time.
          </NAlert>
        </template>

        <!-- Image -->
        <template v-if="kind === 'image'">
          <NFormItem label="Source URL">
            <NInput
              :value="String(attrs.src ?? '')"
              placeholder="https://… or /api/storage/…"
              @update:value="(v) => patch({ src: v })"
            />
          </NFormItem>
          <NFormItem label="Alt text">
            <NInput :value="String(attrs.alt ?? '')" @update:value="(v) => patch({ alt: v })" />
          </NFormItem>
        </template>

        <!-- Text raw fallback -->
        <template v-if="kind === 'text'">
          <NFormItem label="Raw HTML (fallback — normally edited inline)">
            <NInput
              :value="String(attrs.html ?? '')"
              type="textarea"
              :rows="4"
              style="font-family: monospace;"
              @update:value="(v) => patch({ html: v })"
            />
          </NFormItem>
        </template>

        <!-- Table structure -->
        <template v-if="kind === 'table'">
          <NFormItem label="Caption">
            <NInput :value="String(attrs.caption ?? '')" @update:value="(v) => patch({ caption: v })" />
          </NFormItem>
          <NFormItem label="Structure">
            <NSpace :size="6">
              <NButton size="small" @click="addTableRow">+ Row</NButton>
              <NButton size="small" @click="addTableColumn">+ Column</NButton>
              <NText depth="3" style="font-size: 12px;">Cells are edited inline on the canvas.</NText>
            </NSpace>
          </NFormItem>
        </template>
      </NForm>
    </NSpin>
  </NCard>
</template>
