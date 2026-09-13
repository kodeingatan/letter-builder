<script setup lang="ts">
import { h } from 'vue'
import { NEmpty, NButton, NSpace, NIcon } from 'naive-ui'
import { ArrowUp, ArrowDown, TrashCan } from '@vicons/carbon'
import { useBuilderStore } from '~/stores/builder'
import type { DocNode } from '~/shared/types/document'

const store = useBuilderStore()

function blockLabel(node: DocNode): string {
  const props = node.props ?? {}
  switch (node.type) {
    case 'text':
    case 'paragraph':
    case 'heading':
      return String(props.content ?? '(kosong)').slice(0, 60)
    case 'image':
      return `Gambar: ${String(props.src ?? '').slice(0, 40)}`
    case 'repeater':
      return `Loop: ${String(props.source ?? '?')} → ${String(props.item ?? 'item')}`
    case 'condition':
      return `Kondisi: ${String(props.field ?? '?')} ${String(props.operator ?? 'eq')}`
    case 'component-ref':
      return `Component: ${String(props.componentId ?? '?')}`
    case 'signature':
      return `Tanda tangan: ${String(props.name ?? '')}`
    case 'table':
      return 'Tabel'
    case 'divider':
      return '— Pembatas —'
    case 'pagebreak':
      return '⟶ Ganti halaman'
    default:
      return node.type
  }
}

function onDragStart(event: DragEvent, id: string) {
  event.dataTransfer?.setData('text/builder-block', id)
}

function onDrop(event: DragEvent, targetId: string) {
  event.preventDefault()
  const draggedId = event.dataTransfer?.getData('text/builder-block')
  if (!draggedId || draggedId === targetId) return
  const targetIndex = store.blocks.findIndex((b) => b.id === targetId)
  store.moveTo(draggedId, targetIndex)
}
</script>

<template>
  <div class="template-canvas">
    <NEmpty
      v-if="store.blocks.length === 0"
      description="Kanvas kosong — tambah blok dari panel kiri"
    />
    <div
      v-for="block in store.blocks"
      :key="block.id"
      draggable="true"
      class="canvas-block border rounded p-2 mb-2 cursor-pointer"
      :class="block.id === store.selectedId ? 'border-blue-500 bg-blue-50' : ''"
      tabindex="0"
      :aria-label="`Blok ${block.node.type}`"
      @click="store.select(block.id)"
      @keydown.enter="store.select(block.id)"
      @dragstart="(e: DragEvent) => onDragStart(e, block.id)"
      @dragover.prevent
      @drop="(e: DragEvent) => onDrop(e, block.id)"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-mono opacity-60">{{ block.node.type }}</span>
        <NSpace :size="2">
          <NButton size="tiny" quaternary aria-label="Pindah ke atas" @click.stop="store.move(block.id, -1)">
            <template #icon><NIcon><ArrowUp /></NIcon></template>
          </NButton>
          <NButton size="tiny" quaternary aria-label="Pindah ke bawah" @click.stop="store.move(block.id, 1)">
            <template #icon><NIcon><ArrowDown /></NIcon></template>
          </NButton>
          <NButton size="tiny" quaternary type="error" aria-label="Hapus blok" @click.stop="store.remove(block.id)">
            <template #icon><NIcon><TrashCan /></NIcon></template>
          </NButton>
        </NSpace>
      </div>
      <p class="text-sm mt-1">{{ blockLabel(block.node) }}</p>
    </div>
  </div>
</template>
