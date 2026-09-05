<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  NAlert, NButton, NCard, NForm, NFormItem, NInput, NSpin, NSpace,
  NTag, NText, NPopconfirm, NDrawer, NDrawerContent, NTabs, NTabPane,
  useMessage,
} from 'naive-ui'
import {
  TemplateVersionTimeline, TemplateSnapshotViewer, CompositionCanvas,
  NodeInspector, ComponentPickerModal, BindingTab,
} from '~/components/features/templates'
import { useAuthorization } from '~/composables/useAuthorization'
import { useAuthStore } from '~/stores/auth'
import { useTemplatesStore } from '~/stores/templates'
import { useComponentsStore } from '~/stores/components'
import { useGlobalTablesStore } from '~/stores/globalTables'
import { getErrorMessage } from '~/utils/error'
import {
  createNode,
  defaultAttrsFor,
  parseTree,
  serializeTree,
  isCompositionTreeContent,
  legacyToComposition,
  insertNodeAt,
  appendChildNode,
  updateNodeAttrs,
  findNode,
  structuralPreviewLines,
} from '~/composables/useCompositionTree'
import type {
  TemplateDetail, TemplateVersion, CompositionNode,
  SlotChip, TreeValidationResult,
} from '~/shared/types/template'
import type { ComponentDetail } from '~/shared/types/component'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const store = useTemplatesStore()
const componentsStore = useComponentsStore()
const tablesStore = useGlobalTablesStore()
const { hasAnyRole, hasPermission } = useAuthorization()

const canManage = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Template Management'),
)

function authHeaders() {
  return { Authorization: `Bearer ${authStore.token}` }
}

const id = computed(() => Number(route.params.id))
const detail = ref<TemplateDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const rollingBack = ref(false)

const metaForm = ref({ name: '', description: '' })
const nodes = ref<CompositionNode[]>([])
const selectedId = ref<string | null>(null)
const snapshot = ref<TemplateVersion | null>(null)
const loadingSnapshot = ref(false)

// --- Component picker ---
const showPicker = ref(false)
const pickerTarget = ref<{ containerId: string | null; index: number }>({ containerId: null, index: 0 })

// --- Active tab (Canvas / Bindings) ---
const activeTab = ref('canvas')
const bindingUnboundCount = ref(0)

// --- Placement metadata (names + slot chips) ---
const componentDetails = ref<Record<number, ComponentDetail>>({})
const componentNames = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {}
  for (const c of componentsStore.components as Array<{ id: number; name: string }>) map[c.id] = c.name
  for (const [cid, d] of Object.entries(componentDetails.value)) map[Number(cid)] = d.name
  return map
})

function collectComponentNodes(list: CompositionNode[], out: CompositionNode[] = []): CompositionNode[] {
  for (const node of list) {
    if (node.kind === 'component') out.push(node)
    if (Array.isArray(node.children)) collectComponentNodes(node.children, out)
  }
  return out
}

function isBoundValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.value === 'string') return record.value.trim().length > 0
    return record.value !== null && record.value !== undefined
  }
  return true
}

const slotsByNode = computed<Record<string, SlotChip[]>>(() => {
  const map: Record<string, SlotChip[]> = {}
  for (const placement of collectComponentNodes(nodes.value)) {
    const cid = placement.attrs?.componentId
    const detail = typeof cid === 'number' ? componentDetails.value[cid] : undefined
    const bindings = (placement.attrs?.bindings ?? {}) as Record<string, unknown>
    map[placement.id] = (detail?.requirements ?? []).map((r) => ({
      name: r.name,
      type: r.type,
      bound: isBoundValue(bindings[r.name]),
    }))
  }
  return map
})

async function refreshPlacementMeta() {
  const ids = new Set<number>()
  for (const placement of collectComponentNodes(nodes.value)) {
    if (typeof placement.attrs?.componentId === 'number') ids.add(placement.attrs.componentId)
  }
  for (const cid of ids) {
    if (componentDetails.value[cid]) continue
    try {
      componentDetails.value[cid] = await componentsStore.fetchOne(cid)
    } catch { /* unknown components surface via validate-tree */ }
  }
}

// --- Loop row options for the inspector ---
const rowOptions = ref<Array<{ label: string; value: number }>>([])
const loadingRows = ref(false)

const selectedNode = computed(() => {
  if (!selectedId.value) return null
  return findNode(nodes.value, selectedId.value)?.node ?? null
})

const selectedLoopTable = computed(() => {
  if (selectedNode.value?.kind !== 'loop') return ''
  const name = selectedNode.value.attrs?.source?.tableName
  return typeof name === 'string' ? name : ''
})

async function loadRowOptions(tableName: string) {
  rowOptions.value = []
  if (!tableName) return
  const table = (tablesStore.tables as Array<{ id: number; name: string }>).find(
    (t) => t.name.toLowerCase() === tableName.toLowerCase(),
  )
  if (!table) return
  loadingRows.value = true
  try {
    const res = await $fetch<{ data: Array<{ id: number; label: string }>; total: number }>(
      `/api/global-tables/${table.id}/rows/lookup`,
      { params: { limit: 100 }, headers: authHeaders() },
    )
    rowOptions.value = res.data.map((r) => ({ label: r.label || `#${r.id}`, value: r.id }))
  } catch { /* lookup failures surface via validate-tree */ } finally {
    loadingRows.value = false
  }
}

watch(selectedLoopTable, (name) => { loadRowOptions(name) })

// --- Live tree validation (debounced validate-tree) ---
const treeCheck = ref<TreeValidationResult | null>(null)
const validating = ref(false)
let validateTimer: ReturnType<typeof setTimeout> | null = null

async function runValidation() {
  if (!detail.value) return
  validating.value = true
  try {
    treeCheck.value = await store.validateTree(detail.value.id, { nodes: nodes.value })
  } catch {
    treeCheck.value = null
  } finally {
    validating.value = false
  }
}

watch(nodes, () => {
  refreshPlacementMeta()
  if (validateTimer) clearTimeout(validateTimer)
  validateTimer = setTimeout(runValidation, 600)
}, { deep: true })

onUnmounted(() => {
  if (validateTimer) clearTimeout(validateTimer)
})

const nonEmpty = computed(() => nodes.value.length > 0)
const hasErrors = computed(() => !!treeCheck.value && !treeCheck.value.valid)
const unboundSlots = computed(() => treeCheck.value?.unbound ?? [])
const publishBlocked = computed(() => hasErrors.value || unboundSlots.value.length > 0)

const previewLines = computed(() => structuralPreviewLines(nodes.value, componentNames.value))

// --- Responsive: inspector is a side card on desktop, bottom drawer on mobile ---
const isWide = ref(true)
function updateViewport() {
  if (import.meta.client) isWide.value = window.matchMedia('(min-width: 1024px)').matches
}
onMounted(() => {
  updateViewport()
  if (import.meta.client) window.addEventListener('resize', updateViewport)
})
onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('resize', updateViewport)
})
const showInspectorDrawer = ref(false)
watch(selectedId, (val) => {
  if (val && !isWide.value) showInspectorDrawer.value = true
  if (!val) showInspectorDrawer.value = false
})

// --- Draft lifecycle ---
async function load() {
  if (!id.value || isNaN(id.value)) return
  loading.value = true
  try {
    detail.value = await $fetch<TemplateDetail>(`/api/templates/${id.value}`, { headers: authHeaders() })
    metaForm.value = { name: detail.value.name, description: detail.value.description ?? '' }
    const parsed = parseTree(detail.value.content)
    if (parsed && isCompositionTreeContent(parsed)) {
      nodes.value = parsed
    } else if (parsed) {
      // One-way upgrade of Task 14 legacy skeletons (REQ-005).
      nodes.value = legacyToComposition(parsed)
    } else {
      nodes.value = []
    }
    selectedId.value = null
    snapshot.value = null
    treeCheck.value = null
    await Promise.all([
      componentsStore.fetchAll({ page: 1, limit: 100 }).catch(() => null),
      tablesStore.fetchAll({ page: 1, limit: 100 }).catch(() => null),
    ])
    await refreshPlacementMeta()
    await loadRowOptions(selectedLoopTable.value)
    await runValidation()
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load template'))
    detail.value = null
  } finally {
    loading.value = false
  }
}

async function handleSaveDraft() {
  if (!detail.value) return
  if (metaForm.value.name.length < 1 || metaForm.value.name.length > 100) {
    message.error('Name must be 1–100 characters')
    return
  }
  // Authoritative pre-save check so invalid conditions/tokens block the save (AC-003).
  saving.value = true
  try {
    const check = await store.validateTree(detail.value.id, { nodes: nodes.value })
    treeCheck.value = check
    if (!check.valid) {
      message.error(check.errors[0]?.message ?? 'Invalid composition tree')
      return
    }
    detail.value = await store.update(detail.value.id, {
      name: metaForm.value.name,
      description: metaForm.value.description || null,
      content: nodes.value.length ? serializeTree(nodes.value) : null,
    })
    message.success('Draft saved (publish to bump version)')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to save draft'))
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  if (!detail.value) return
  publishing.value = true
  try {
    // Persist latest canvas state first so Publish reflects what the
    // Designer sees (still a single frozen snapshot).
    if (nodes.value.length) {
      try {
        await store.update(detail.value.id, { content: serializeTree(nodes.value) })
      } catch (e: any) {
        message.error(getErrorMessage(e, 'Failed to save draft before publish'))
        return
      }
    }
    detail.value = await store.publish(detail.value.id)
    const parsed = parseTree(detail.value.content)
    nodes.value = parsed ?? []
    message.success(`Published as v${detail.value.version}`)
    await runValidation()
  } catch (e: any) {
    // AC-004: surface every unbound slot named by the server.
    const slots = (e.data?.slots ?? e.response?.data?.slots) as Array<{ componentName?: string; componentId: number; requirement: string }> | undefined
    if (Array.isArray(slots) && slots.length) {
      message.error(`Publish blocked: ${slots.length} unbound slot(s) — ${slots.map((s) => `${s.componentName ?? `#${s.componentId}`} · ${s.requirement}`).join(', ')}`)
    } else {
      message.error(getErrorMessage(e, 'Failed to publish template'))
    }
    await runValidation()
  } finally {
    publishing.value = false
  }
}

async function handleView(version: number) {
  if (!detail.value) return
  loadingSnapshot.value = true
  try {
    snapshot.value = await store.fetchVersion(detail.value.id, version)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load snapshot'))
  } finally {
    loadingSnapshot.value = false
  }
}

async function handleRollback(version: number) {
  if (!detail.value) return
  rollingBack.value = true
  try {
    detail.value = await store.rollback(detail.value.id, version)
    const parsed = parseTree(detail.value.content)
    nodes.value = parsed && isCompositionTreeContent(parsed) ? parsed : legacyToComposition(parsed ?? [])
    snapshot.value = null
    message.success(`Draft restored from v${version} — publish to create v${detail.value.version + 1}`)
    await runValidation()
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to roll back template'))
  } finally {
    rollingBack.value = false
  }
}

function handlePickComponent(target: { containerId: string | null; index: number }) {
  pickerTarget.value = target
  showPicker.value = true
}

async function handlePickerConfirm(payload: { componentId: number; componentVersion: number }) {
  try {
    const compDetail = await componentsStore.fetchOne(payload.componentId)
    componentDetails.value[payload.componentId] = compDetail
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load component'))
    return
  }
  // Placement pins id + version with requirements as unbound slots (REQ-002).
  const placement = createNode('component', {
    componentId: payload.componentId,
    componentVersion: payload.componentVersion,
    bindings: {},
  })
  if (pickerTarget.value.containerId) {
    nodes.value = appendChildNode(nodes.value, pickerTarget.value.containerId, placement)
  } else {
    nodes.value = insertNodeAt(nodes.value, pickerTarget.value.index, placement)
  }
  selectedId.value = placement.id
  message.success('Component placement inserted — bind its slots in Task 16')
}

function insertSampleComposition() {
  const heading = createNode('text', { html: '<h2>Surat Keputusan</h2>' })
  const token = createNode('data-token', { expression: '{{data.nomor_surat}}' })
  const loop = createNode('loop', defaultAttrsFor('loop'), [createNode('text', { html: '<p>{{data.nama}}</p>' })])
  nodes.value = [...nodes.value, heading, token, loop]
}

function patchSelected(patch: Record<string, any>) {
  if (!selectedId.value) return
  nodes.value = updateNodeAttrs(nodes.value, selectedId.value, patch)
}

const inspectedComponent = computed<ComponentDetail | null>(() => {
  const cid = selectedNode.value?.attrs?.componentId
  return typeof cid === 'number' ? (componentDetails.value[cid] ?? null) : null
})

const inspectedSlots = computed<SlotChip[]>(() => {
  if (!selectedId.value) return []
  return slotsByNode.value[selectedId.value] ?? []
})

onMounted(() => {
  load()
})
</script>

<template>
  <div>
    <NAlert
      v-if="!canManage"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to manage Templates.
    </NAlert>
    <NSpin v-else :show="loading">
      <div v-if="detail">
        <NSpace align="center" justify="space-between" style="margin-bottom: 12px;">
          <NSpace align="center" :size="8">
            <NButton text @click="navigateTo('/dashboard/docs/templates')">← Templates</NButton>
            <NText strong style="font-size: 16px;">{{ detail.name }}</NText>
            <NTag size="small" :bordered="false">v{{ detail.version }}</NTag>
            <NTag :type="detail.status === 'published' ? 'success' : 'default'" size="small" :bordered="false">
              {{ detail.status }}
            </NTag>
          </NSpace>
          <NSpace :size="8">
            <NButton :loading="saving" @click="handleSaveDraft">Save Draft</NButton>
            <NPopconfirm @positive-click="handlePublish">
              <template #trigger>
                <NButton type="success" :loading="publishing" :disabled="!nonEmpty || publishBlocked">
                  Publish
                </NButton>
              </template>
              Publish "{{ detail.name }}"? Freezes an immutable version snapshot.
            </NPopconfirm>
          </NSpace>
        </NSpace>

        <NAlert
          v-if="!nonEmpty"
          type="warning"
          title="Empty draft — publish blocked"
          style="margin-bottom: 12px;"
        >
          Right-click the canvas or use the toolbar to compose text, components, loops, and conditions.
        </NAlert>

        <NAlert
          v-if="hasErrors"
          type="error"
          title="Invalid composition — save blocked"
          style="margin-bottom: 12px;"
        >
          <ul style="margin: 0; padding-left: 18px;">
            <li v-for="(issue, i) in treeCheck?.errors ?? []" :key="i">
              <NText code style="font-size: 12px;">{{ issue.path }}</NText> — {{ issue.message }}
            </li>
          </ul>
        </NAlert>

        <NAlert
          v-if="unboundSlots.length"
          type="warning"
          title="Unbound requirement slots — publish blocked (REQ-006)"
          style="margin-bottom: 12px;"
        >
          <ul style="margin: 0; padding-left: 18px;">
            <li v-for="(slot, i) in unboundSlots" :key="i">
              {{ slot.componentName ?? `#${slot.componentId}` }} · <NText code>{{ slot.requirement }}</NText> ({{ slot.type }})
            </li>
          </ul>
        </NAlert>

        <NAlert
          v-if="(treeCheck?.warnings ?? []).length"
          type="info"
          title="Warnings"
          :bordered="false"
          style="margin-bottom: 12px;"
        >
          <ul style="margin: 0; padding-left: 18px;">
            <li v-for="(issue, i) in treeCheck?.warnings ?? []" :key="i">
              <NText code style="font-size: 12px;">{{ issue.path }}</NText> — {{ issue.message }}
            </li>
          </ul>
        </NAlert>

        <div class="editor-grid">
          <!-- Canvas column -->
          <div class="flex flex-col gap-4">
            <NTabs v-model:value="activeTab" type="line" animated>
              <NTabPane name="canvas" tab="Canvas">
                <NCard size="small" title="Composition canvas (mutable draft)">
                  <template #header-extra>
                    <NText depth="3" style="font-size: 12px;">
                      {{ nodes.length }} block(s){{ validating ? ' · validating…' : '' }}
                    </NText>
                  </template>
                  <CompositionCanvas
                    v-model:nodes="nodes"
                    v-model:selected-id="selectedId"
                    :slots-by-node="slotsByNode"
                    :component-names="componentNames"
                    @pick-component="handlePickComponent"
                  />
                  <NSpace :size="8" style="margin-top: 8px;">
                    <NButton size="small" @click="insertSampleComposition">Insert sample blocks</NButton>
                  </NSpace>
                </NCard>
              </NTabPane>

              <NTabPane name="bindings" tab="Bindings">
                <NCard size="small">
                  <template #header>
                    <NSpace align="center" :size="8">
                      <NText>Bindings</NText>
                      <NTag
                        v-if="bindingUnboundCount > 0"
                        size="small"
                        type="warning"
                        :bordered="false"
                      >
                        {{ bindingUnboundCount }} unbound
                      </NTag>
                    </NSpace>
                  </template>
                  <BindingTab
                    :template-id="id"
                    @update:unbound-count="(c) => { bindingUnboundCount = c }"
                  />
                </NCard>
              </NTabPane>
            </NTabs>

            <NCard size="small" title="Metadata">
              <NForm label-placement="top">
                <NFormItem label="Name">
                  <NInput v-model:value="metaForm.name" maxlength="100" show-count placeholder="e.g. Surat Keputusan" />
                </NFormItem>
                <NFormItem label="Description">
                  <NInput
                    v-model:value="metaForm.description"
                    type="textarea"
                    :rows="2"
                    placeholder="Purpose notes for this document blueprint"
                  />
                </NFormItem>
              </NForm>
            </NCard>

            <NCard size="small" title="Structural preview">
              <ol v-if="previewLines.length" style="margin: 0; padding-left: 18px;">
                <li v-for="(line, i) in previewLines" :key="i" style="font-size: 13px; margin-bottom: 4px;">
                  <NText code>{{ line }}</NText>
                </li>
              </ol>
              <NText v-else depth="3" style="font-size: 12px;">No blocks yet.</NText>
            </NCard>
          </div>

          <!-- Side column -->
          <div class="flex flex-col gap-4">
            <NodeInspector
              v-if="isWide"
              :node="selectedNode"
              :slots="inspectedSlots"
              :component-detail="inspectedComponent"
              :loading-component="false"
              :components="componentsStore.components"
              :tables="tablesStore.tables"
              :row-options="rowOptions"
              :loading-rows="loadingRows"
              @patch="patchSelected"
            />
            <NCard v-else size="small" title="Inspector">
              <NButton size="small" :disabled="!selectedNode" @click="showInspectorDrawer = true">
                {{ selectedNode ? `Configure selected ${selectedNode.kind} node` : 'Select a node first' }}
              </NButton>
            </NCard>
            <NCard size="small" title="Version timeline">
              <TemplateVersionTimeline
                :versions="detail.versions ?? []"
                :active-version="snapshot?.version ?? null"
                @view="handleView"
                @rollback="handleRollback"
              />
              <NSpin :show="rollingBack" />
            </NCard>
            <TemplateSnapshotViewer :snapshot="snapshot" :loading="loadingSnapshot" />
          </div>
        </div>
      </div>
    </NSpin>

    <ComponentPickerModal v-model:visible="showPicker" @confirm="handlePickerConfirm" />

    <NDrawer v-model:show="showInspectorDrawer" placement="bottom" height="70%">
      <NDrawerContent title="Node inspector">
        <NodeInspector
          :node="selectedNode"
          :slots="inspectedSlots"
          :component-detail="inspectedComponent"
          :loading-component="false"
          :components="componentsStore.components"
          :tables="tablesStore.tables"
          :row-options="rowOptions"
          :loading-rows="loadingRows"
          @patch="patchSelected"
        />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.editor-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 360px;
}
@media (max-width: 1023px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
