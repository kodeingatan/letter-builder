<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NEmpty, NDropdown, NDivider } from 'naive-ui'
import CompositionNodeView from './CompositionNodeView.vue'
import type { CompositionKind, CompositionNode, SlotChip } from '~/shared/types/template'
import {
  createNode,
  defaultAttrsFor,
  insertNodeAt,
  moveNode,
  removeNodeAt,
  wrapIn,
  unwrapAt,
  updateNodeAttrs,
  removeNodeById,
  appendChildNode,
  findNode,
} from '~/composables/useCompositionTree'

const props = defineProps<{
  nodes: CompositionNode[]
  selectedId: string | null
  slotsByNode: Record<string, SlotChip[]>
  componentNames: Record<number, string>
}>()

const emit = defineEmits<{
  (e: 'update:nodes', nodes: CompositionNode[]): void
  (e: 'update:selectedId', id: string | null): void
  (e: 'pick-component', target: { containerId: string | null; index: number }): void
}>()

function setNodes(nodes: CompositionNode[]) {
  emit('update:nodes', nodes)
}

function select(id: string) {
  emit('update:selectedId', id)
}

/** Insert target: selected container (append) or after the selected top-level node. */
function resolveTarget(): { containerId: string | null; index: number } {
  if (!props.selectedId) return { containerId: null, index: props.nodes.length }
  const found = findNode(props.nodes, props.selectedId)
  if (!found) return { containerId: null, index: props.nodes.length }
  if (found.node.kind === 'loop' || found.node.kind === 'condition') {
    return { containerId: found.node.id, index: (found.node.children ?? []).length }
  }
  const top = found.ancestors.length ? found.ancestors[0] : found.node
  const idx = props.nodes.findIndex((n) => n.id === top.id)
  return { containerId: null, index: idx === -1 ? props.nodes.length : idx + 1 }
}

function insertKind(kind: CompositionKind) {
  const target = resolveTarget()
  if (kind === 'component') {
    emit('pick-component', target)
    return
  }
  const node = createNode(kind, defaultAttrsFor(kind))
  if (target.containerId) {
    setNodes(appendChildNode(props.nodes, target.containerId, node))
  } else {
    setNodes(insertNodeAt(props.nodes, target.index, node))
  }
  emit('update:selectedId', node.id)
}

function formatText(command: 'bold' | 'italic') {
  document.execCommand(command, false)
}

// --- Right-click context menu (NDropdown, manual position) ---
const menuShow = ref(false)
const menuX = ref(0)
const menuY = ref(0)

const menuOptions = [
  { label: 'Insert Text', key: 'text' },
  { label: 'Insert Component…', key: 'component' },
  { label: 'Insert Dynamic Text (token)', key: 'data-token' },
  { label: 'Insert Dynamic Image', key: 'image' },
  { label: 'Insert Table', key: 'table' },
  { label: 'Insert Loop', key: 'loop' },
  { label: 'Insert Condition', key: 'condition' },
  { label: 'Insert Page Break', key: 'page-break' },
]

function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  menuShow.value = false
  menuX.value = e.clientX
  menuY.value = e.clientY
  requestAnimationFrame(() => { menuShow.value = true })
}

function handleMenuSelect(key: string) {
  menuShow.value = false
  insertKind(key as CompositionKind)
}

const insertButtons: Array<{ kind: CompositionKind; label: string }> = [
  { kind: 'text', label: 'Text' },
  { kind: 'component', label: 'Component…' },
  { kind: 'data-token', label: 'Token' },
  { kind: 'image', label: 'Image' },
  { kind: 'table', label: 'Table' },
  { kind: 'loop', label: 'Loop' },
  { kind: 'condition', label: 'Condition' },
  { kind: 'page-break', label: 'Page break' },
]

const selectedIsContainer = computed(() => {
  if (!props.selectedId) return false
  const found = findNode(props.nodes, props.selectedId)
  return !!found && (found.node.kind === 'loop' || found.node.kind === 'condition')
})
</script>

<template>
  <div>
    <!-- Toolbar: keyboard-accessible equivalents of every context-menu action -->
    <div class="canvas-toolbar">
      <NSpace :size="4">
        <NButton
          v-for="btn in insertButtons"
          :key="btn.kind"
          size="small"
          :type="btn.kind === 'component' ? 'primary' : 'default'"
          @click="insertKind(btn.kind)"
        >
          + {{ btn.label }}
        </NButton>
        <NButton size="small" strong @click="formatText('bold')">B</NButton>
        <NButton size="small" italic @click="formatText('italic')">I</NButton>
      </NSpace>
    </div>
    <NDivider style="margin: 8px 0;" />

    <div class="canvas-body" @contextmenu="handleContextMenu" @click="emit('update:selectedId', null)">
      <NEmpty
        v-if="!nodes.length"
        size="small"
        description="Empty canvas — right-click or use the toolbar to insert"
      />
      <CompositionNodeView
        v-for="(node, i) in nodes"
        :key="node.id"
        :node="node"
        :depth="0"
        :index="i"
        :is-first="i === 0"
        :is-last="i === nodes.length - 1"
        :top-level="true"
        :selected-id="selectedId"
        :slots-by-node="slotsByNode"
        :component-names="componentNames"
        @select="select"
        @patch="(id, patch) => setNodes(updateNodeAttrs(nodes, id, patch))"
        @remove="(id) => setNodes(removeNodeById(nodes, id))"
        @move="(idx, dir) => setNodes(moveNode(nodes, idx, dir))"
        @wrap="(idx, kind) => setNodes(wrapIn(nodes, idx, kind))"
        @unwrap="(idx) => setNodes(unwrapAt(nodes, idx))"
      />
      <NEmpty v-if="selectedIsContainer" size="small" description="Container selected — toolbar inserts append inside it" />
    </div>

    <NDropdown
      trigger="manual"
      :show="menuShow"
      :x="menuX"
      :y="menuY"
      :options="menuOptions"
      placement="bottom-start"
      @select="handleMenuSelect"
      @clickoutside="menuShow = false"
    />
  </div>
</template>

<style scoped>
.canvas-toolbar {
  overflow-x: auto;
  padding-bottom: 4px;
}
.canvas-body {
  min-height: 200px;
  border-radius: 8px;
}
</style>
