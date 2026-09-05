<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NCard, NTag, NSpace, NButton, NText, NInput, NPopconfirm } from 'naive-ui'
import type { CompositionNode, SlotChip } from '~/shared/types/template'
import { sanitizePastedHtml } from '~/composables/useCompositionTree'

defineOptions({ name: 'CompositionNodeView' })

const props = defineProps<{
  node: CompositionNode
  depth: number
  index: number
  isFirst: boolean
  isLast: boolean
  topLevel: boolean
  selectedId: string | null
  slotsByNode: Record<string, SlotChip[]>
  componentNames: Record<number, string>
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'patch', id: string, patch: Record<string, any>): void
  (e: 'remove', id: string): void
  (e: 'move', index: number, dir: -1 | 1): void
  (e: 'wrap', index: number, kind: 'loop' | 'condition'): void
  (e: 'unwrap', index: number): void
}>()

const isSelected = computed(() => props.selectedId === props.node.id)
const attrs = computed(() => props.node.attrs ?? {})
const slots = computed<SlotChip[]>(() => props.slotsByNode[props.node.id] ?? [])
const componentName = computed(() => {
  const id = attrs.value.componentId
  return typeof id === 'number' ? (props.componentNames[id] ?? `Component #${id}`) : 'Component'
})

// Text editing uses a local draft committed on blur so caret never jumps.
const textRef = ref<HTMLElement | null>(null)
const draftHtml = ref(typeof attrs.value.html === 'string' ? attrs.value.html : '')
watch(() => attrs.value.html, (val) => {
  if (typeof val === 'string' && val !== draftHtml.value && document.activeElement !== textRef.value) {
    draftHtml.value = val
  }
})

function commitText() {
  const clean = sanitizePastedHtml(draftHtml.value)
  draftHtml.value = clean
  if (clean !== attrs.value.html) emit('patch', props.node.id, { html: clean })
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, sanitizePastedHtml(text))
}

function commitCell(rowIdx: number, colIdx: number, e: Event) {
  const el = e.target as HTMLElement
  const clean = sanitizePastedHtml(el.innerText)
  const rows = Array.isArray(attrs.value.rows) ? attrs.value.rows.map((r: unknown[]) => [...r]) : []
  if (rows[rowIdx]) {
    rows[rowIdx][colIdx] = clean
    emit('patch', props.node.id, { rows })
  }
}

const loopSummary = computed(() => {
  const s = attrs.value.source ?? {}
  const base = `${s.tableName || '(no table)'} · ${s.mode || 'all'}`
  return s.mode === 'selected' && Array.isArray(s.rowIds) ? `${base} · ${s.rowIds.length} row(s)` : base
})
</script>

<template>
  <div
    class="canvas-node"
    :class="{ 'canvas-node--selected': isSelected, [`canvas-node--${node.kind}`]: true }"
    @click.stop="emit('select', node.id)"
  >
    <div class="canvas-node__header">
      <NTag size="small" :bordered="false" :type="node.kind === 'component' ? 'info' : 'default'">
        {{ node.kind }}
      </NTag>
      <NSpace v-if="topLevel" :size="2" class="canvas-node__actions">
        <NButton text size="small" :disabled="isFirst" @click.stop="emit('move', index, -1)">↑</NButton>
        <NButton text size="small" :disabled="isLast" @click.stop="emit('move', index, 1)">↓</NButton>
        <NButton text size="small" type="info" @click.stop="emit('wrap', index, 'loop')">Wrap loop</NButton>
        <NButton text size="small" type="info" @click.stop="emit('wrap', index, 'condition')">Wrap condition</NButton>
        <NPopconfirm
          v-if="node.kind === 'loop' || node.kind === 'condition'"
          @positive-click="emit('unwrap', index)"
        >
          <template #trigger>
            <NButton text size="small" type="warning" @click.stop>Unwrap</NButton>
          </template>
          Unwrap this {{ node.kind }}? Its children move up one level.
        </NPopconfirm>
        <NButton text size="small" type="error" @click.stop="emit('remove', node.id)">Delete</NButton>
      </NSpace>
      <NButton v-else text size="small" type="error" @click.stop="emit('remove', node.id)">Delete</NButton>
    </div>

    <!-- Text -->
    <div
      v-if="node.kind === 'text'"
      ref="textRef"
      class="canvas-text"
      contenteditable="true"
      @blur="draftHtml = (textRef?.innerHTML ?? ''); commitText()"
      @paste="handlePaste"
      v-html="draftHtml"
    />

    <!-- Image -->
    <div v-else-if="node.kind === 'image'" class="canvas-image">
      <img v-if="attrs.src" :src="attrs.src" :alt="attrs.alt || ''" style="max-width: 100%; border-radius: 6px;" />
      <NText v-else depth="3" style="font-size: 12px;">No image source — select the node and set src in the inspector.</NText>
    </div>

    <!-- Table -->
    <div v-else-if="node.kind === 'table'" class="canvas-table">
      <NText v-if="attrs.caption" strong style="display: block; margin-bottom: 4px;">{{ attrs.caption }}</NText>
      <table>
        <thead v-if="(attrs.headers ?? []).length">
          <tr>
            <th v-for="(h, i) in attrs.headers" :key="i">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in (attrs.rows ?? [])" :key="ri">
            <td
              v-for="(cell, ci) in row"
              :key="ci"
              contenteditable="true"
              @blur="commitCell(ri, ci, $event)"
              @paste="handlePaste"
              v-html="cell"
            />
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Component placement -->
    <NCard v-else-if="node.kind === 'component'" size="small" :bordered="true">
      <NSpace align="center" :size="6">
        <NText strong>{{ componentName }}</NText>
        <NTag v-if="attrs.componentVersion" size="small" :bordered="false">v{{ attrs.componentVersion }}</NTag>
      </NSpace>
      <NSpace :size="4" style="margin-top: 6px;">
        <NTag
          v-for="slot in slots"
          :key="slot.name"
          size="small"
          :bordered="false"
          :type="slot.bound ? 'success' : 'warning'"
        >
          {{ slot.name }} · {{ slot.type }}{{ slot.bound ? '' : ' · unbound' }}
        </NTag>
        <NText v-if="!slots.length" depth="3" style="font-size: 12px;">No requirement slots.</NText>
      </NSpace>
    </NCard>

    <!-- Data token -->
    <div v-else-if="node.kind === 'data-token'">
      <NTag type="info" size="small" :bordered="false" style="font-family: monospace;">{{ attrs.expression || '(empty)' }}</NTag>
      <NText depth="3" style="font-size: 12px; margin-left: 8px;">edit below or in inspector →</NText>
    </div>

    <!-- Loop / Condition containers -->
    <div v-else-if="node.kind === 'loop' || node.kind === 'condition'" class="canvas-container">
      <div class="canvas-container__label">
        <NTag size="small" :bordered="false" :type="node.kind === 'loop' ? 'warning' : 'success'">
          {{ node.kind === 'loop' ? `Loop — ${loopSummary}` : `If — ${attrs.expression || '(empty)'}` }}
        </NTag>
      </div>
      <div class="canvas-container__children">
        <CompositionNodeView
          v-for="(child, ci) in (node.children ?? [])"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :index="ci"
          :is-first="ci === 0"
          :is-last="ci === (node.children ?? []).length - 1"
          :top-level="false"
          :selected-id="selectedId"
          :slots-by-node="slotsByNode"
          :component-names="componentNames"
          @select="(id) => emit('select', id)"
          @patch="(id, patch) => emit('patch', id, patch)"
          @remove="(id) => emit('remove', id)"
          @move="(i, dir) => emit('move', i, dir)"
          @wrap="(i, kind) => emit('wrap', i, kind)"
          @unwrap="(i) => emit('unwrap', i)"
        />
        <NText v-if="!(node.children ?? []).length" depth="3" style="font-size: 12px;">
          Empty {{ node.kind }} — select it and use the toolbar to append children.
        </NText>
      </div>
    </div>

    <!-- Page break -->
    <div v-else-if="node.kind === 'page-break'" class="canvas-pagebreak">
      <span>Page break</span>
    </div>

    <!-- Token/condition expression quick edit -->
    <div v-if="node.kind === 'data-token' || node.kind === 'condition'" style="margin-top: 6px;">
      <NInput
        size="small"
        :value="String(attrs.expression ?? '')"
        placeholder="{{data.field}} or data.total > 100"
        style="font-family: monospace;"
        @update:value="(v) => emit('patch', node.id, { expression: v })"
      />
    </div>
  </div>
</template>

<style scoped>
.canvas-node {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background: #fff;
  cursor: pointer;
}
.canvas-node--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}
.canvas-node__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.canvas-node__actions { flex-wrap: wrap; }
.canvas-text {
  min-height: 40px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}
.canvas-text:empty::before {
  content: 'Click to type…';
  color: #9ca3af;
}
.canvas-text:focus { background: #f8fafc; }
.canvas-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.canvas-table th, .canvas-table td {
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  min-width: 60px;
}
.canvas-table th { background: #f8fafc; }
.canvas-table td { outline: none; }
.canvas-container {
  border: 1px dashed #f59e0b;
  border-radius: 8px;
  padding: 8px;
}
.canvas-container__label { margin-bottom: 6px; }
.canvas-container__children { display: flex; flex-direction: column; }
.canvas-pagebreak {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.canvas-pagebreak::before, .canvas-pagebreak::after {
  content: '';
  flex: 1;
  border-top: 2px dashed #cbd5e1;
}
</style>
