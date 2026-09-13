<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { NButton, NSpace, NAlert, NSpin } from 'naive-ui'
import { usePersuratanStore } from '~/stores/persuratan'
import BindingPopup from './BindingPopup.vue'
import type { BindingView } from '~/shared/types/persuratan'

const props = defineProps<{
  modelValue: Record<string, unknown> | null
  isLooping?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void
  (e: 'preview', html: string): void
}>()

const store = usePersuratanStore()
const editorReady = ref(false)
const editorError = ref<string | null>(null)
const showBinding = ref(false)
const editorHost = ref<HTMLElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let editor: any = null

const TOOLBAR: Array<{ label: string; action: string; arg?: string }> = [
  { label: 'B', action: 'bold' },
  { label: 'I', action: 'italic' },
  { label: 'U', action: 'underline' },
  { label: 'H2', action: 'heading', arg: '2' },
  { label: '• List', action: 'bulletList' },
  { label: '1. List', action: 'orderedList' },
  { label: 'Tabel', action: 'table' },
  { label: 'Gambar', action: 'image' },
  { label: 'Tengah', action: 'align', arg: 'center' },
  { label: '↶', action: 'undo' },
  { label: '↷', action: 'redo' },
]

async function initEditor() {
  if (!import.meta.client) return
  try {
    const { Editor } = await import('@tiptap/vue-3')
    const StarterKit = (await import('@tiptap/starter-kit')).default
    const TiptapImage = (await import('@tiptap/extension-image')).default
    const TiptapLink = (await import('@tiptap/extension-link')).default
    const TextAlign = (await import('@tiptap/extension-text-align')).default
    const TiptapTable = (await import('@tiptap/extension-table')).default
    const TableRow = (await import('@tiptap/extension-table-row')).default
    const TableHeader = (await import('@tiptap/extension-table-header')).default
    const TableCell = (await import('@tiptap/extension-table-cell')).default
    const Underline = (await import('@tiptap/extension-underline')).default
    const { DocBinding, DocRepeater, DocCondition } = await import('~/utils/tiptap-nodes')
    editor = new Editor({
      element: editorHost.value,
      content: props.modelValue ?? { type: 'doc', content: [{ type: 'paragraph' }] },
      extensions: [
        StarterKit,
        TiptapImage,
        TiptapLink.configure({ openOnClick: false }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TiptapTable.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Underline,
        DocBinding,
        DocRepeater,
        DocCondition,
      ],
      editorProps: {
        attributes: { class: 'tiptap-editor' },
        handleDOMEvents: {
          contextmenu: (_view, event) => {
            event.preventDefault()
            showBinding.value = true
            return true
          },
        },
      },
      onUpdate: ({ editor: ed }) => {
        emit('update:modelValue', ed.getJSON() as Record<string, unknown>)
      },
    })
    editorReady.value = true
  } catch (e) {
    editorError.value = (e as Error).message
  }
}

function runAction(action: string, arg?: string) {
  if (!editor) return
  const chain = editor.chain().focus()
  switch (action) {
    case 'bold': chain.toggleBold().run(); break
    case 'italic': chain.toggleItalic().run(); break
    case 'underline': chain.toggleUnderline().run(); break
    case 'heading': chain.toggleHeading({ level: Number(arg ?? 2) }).run(); break
    case 'bulletList': chain.toggleBulletList().run(); break
    case 'orderedList': chain.toggleOrderedList().run(); break
    case 'table': chain.insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(); break
    case 'image': {
      const src = window.prompt('URL gambar (https://, /api/storage/, data:image/)')
      if (src) chain.setImage({ src }).run()
      break
    }
    case 'align': chain.setTextAlign(arg ?? 'left').run(); break
    case 'undo': chain.undo().run(); break
    case 'redo': chain.redo().run(); break
  }
}

function insertBinding(binding: { name: string; target: string; view: BindingView; component?: string }) {
  if (!editor) return
  if (binding.view === 'component') {
    editor.chain().focus().insertContent({
      type: 'docBinding',
      attrs: { name: binding.name, target: '', view: 'component', component: binding.component ?? '' },
    }).run()
  } else {
    editor.chain().focus().insertContent({
      type: 'docBinding',
      attrs: { name: binding.name, target: binding.target, view: binding.view },
    }).run()
  }
}

watch(() => props.modelValue, (next) => {
  if (editor && next && JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) {
    editor.commands.setContent(next, false)
  }
})

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  editor?.destroy()
  editor = null
})

defineExpose({ getJSON: () => editor?.getJSON() ?? props.modelValue })
</script>

<template>
  <div class="component-editor">
    <NAlert v-if="editorError" type="error" class="mb-2">{{ editorError }}</NAlert>
    <div class="flex flex-wrap gap-1 mb-2" role="toolbar" aria-label="Toolbar editor">
      <NButton v-for="btn in TOOLBAR" :key="btn.label" size="small" :disabled="!editorReady" @click="runAction(btn.action, btn.arg)">
        {{ btn.label }}
      </NButton>
      <NButton size="small" type="info" :disabled="!editorReady" @click="showBinding = true">
        + Binding (klik kanan)
      </NButton>
    </div>
    <NSpin v-if="!editorReady && !editorError" description="Memuat editor..." />
    <ClientOnly>
      <div ref="editorHost" class="tiptap-host border rounded p-3 min-h-[200px]" />
      <template #fallback>
        <div class="border rounded p-3 min-h-[200px] opacity-60">Editor dimuat di sisi klien...</div>
      </template>
    </ClientOnly>
    <p v-if="isLooping" class="mt-1 text-xs opacity-70">Component looping — wajib mengandung binding <code>item.*</code> (BR-003).</p>
    <BindingPopup v-model:visible="showBinding" @confirm="insertBinding" />
  </div>
</template>
