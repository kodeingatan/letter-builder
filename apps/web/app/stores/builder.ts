import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DocNode } from '~/shared/types/document'

/**
 * Template builder store (Task 07): block list + selection + mutations.
 * Blocks are top-level DocNode children of the template `document` node.
 */

let blockSeq = 1

function nextBlockId(): string {
  blockSeq += 1
  return `block-${Date.now()}-${blockSeq}`
}

export interface BuilderBlock {
  id: string
  node: DocNode
}

export const useBuilderStore = defineStore('builder', () => {
  const blocks = ref<BuilderBlock[]>([])
  const selectedId = ref<string | null>(null)

  const selected = computed(() => blocks.value.find((b) => b.id === selectedId.value) ?? null)

  function load(nodes: DocNode[]) {
    blocks.value = nodes.map((node) => ({ id: nextBlockId(), node: JSON.parse(JSON.stringify(node)) as DocNode }))
    selectedId.value = null
  }

  function toNodes(): DocNode[] {
    return blocks.value.map((b) => JSON.parse(JSON.stringify(b.node)) as DocNode)
  }

  function add(node: DocNode, index?: number) {
    const block = { id: nextBlockId(), node }
    if (index === undefined || index < 0 || index > blocks.value.length) blocks.value.push(block)
    else blocks.value.splice(index, 0, block)
    selectedId.value = block.id
    return block.id
  }

  function remove(id: string) {
    blocks.value = blocks.value.filter((b) => b.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }

  function move(id: string, direction: -1 | 1) {
    const index = blocks.value.findIndex((b) => b.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= blocks.value.length) return
    const [block] = blocks.value.splice(index, 1)
    blocks.value.splice(target, 0, block)
  }

  function moveTo(id: string, targetIndex: number) {
    const index = blocks.value.findIndex((b) => b.id === id)
    if (index < 0) return
    const clamped = Math.max(0, Math.min(targetIndex, blocks.value.length - 1))
    const [block] = blocks.value.splice(index, 1)
    blocks.value.splice(clamped, 0, block)
  }

  function update(id: string, node: DocNode) {
    const block = blocks.value.find((b) => b.id === id)
    if (block) block.node = node
  }

  function select(id: string | null) {
    selectedId.value = id
  }

  function reset() {
    blocks.value = []
    selectedId.value = null
  }

  return { blocks, selectedId, selected, load, toNodes, add, remove, move, moveTo, update, select, reset }
})
