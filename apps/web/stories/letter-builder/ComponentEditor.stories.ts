import { h, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert, NTag } from 'naive-ui'
import ComponentEditor from '../../app/components/features/persuratan/ComponentEditor.vue'
import { withProviders } from './withProviders'

const meta: Meta = {
  title: 'LetterBuilder/ComponentEditor',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Component Tiptap Editor — ClientOnly + toolbar bold/italic/underline/align/list/table/link/image/undo/redo + right-click BindingPalette (nama+view text/image/component) + fallback + Binding 44px (mobile) + is_looping validation BR-003. Library relevan: @tiptap/vue-3 ^3.31.3. Covers Step 8-9, AC-D04, FR-007.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleDoc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Kop Surat — Dinas Example' }] }] } as unknown as Record<string, unknown>

export const Default: Story = {
  render: () => withProviders(h(ComponentEditor, { modelValue: sampleDoc, isLooping: false } as never)),
}

export const Looping: Story = {
  parameters: { docs: { description: { story: 'is_looping=true — wajib mengandung binding item.* (BR-003). Invalid badge merah bila tanpa item.*' } } },
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3' }, [
        h(ComponentEditor, { modelValue: sampleDoc, isLooping: true } as never),
        h('div', { class: 'flex gap-2' }, [
          h(NTag, { type: 'info', size: 'small' }, { default: () => 'Looping: wajib item.*' }),
          h(NTag, { type: 'error', size: 'small' }, { default: () => 'Invalid bila tanpa item.*' }),
        ]),
      ]),
    ),
}

export const BindingInline: Story = {
  parameters: { docs: { description: { story: 'Binding pill inline non-editable bg-[#e8f2fd] text-[#0075de] rounded-full — right-click palette + toolbar + Binding fixed bottom 44px hit (EC-05 mobile).' } } },
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3' }, [
        h(ComponentEditor, { modelValue: sampleDoc } as never),
        h('div', { class: 'flex gap-2 flex-wrap' }, [
          h('span', { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs', style: 'background:#e8f2fd;color:#0075de' }, 'kop.nama'),
          h('span', { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs', style: 'background:#e8f2fd;color:#0075de' }, 'item.nama (loop)'),
          h(NTag, { size: 'small' }, { default: () => 'view: text / image / component' }),
        ]),
      ]),
    ),
}

export const Validation: Story = {
  parameters: { docs: { description: { story: 'Validation: komponen looping tanpa item.* → NAlert + inline badge Invalid + Publish blocked (ERR-02).' } } },
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3' }, [
        h(NAlert, { type: 'error', title: 'Binding invalid' }, { default: () => 'Component looping wajib mengandung ≥1 binding item.* — Publish ditolak (BR-003).' }),
        h(ComponentEditor, { modelValue: sampleDoc, isLooping: true } as never),
      ]),
    ),
}

export const MobileFallback: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' }, docs: { description: { story: 'Mobile: toolbar scroll-x + + Binding button fixed bottom 44px hit (EC-05 fallback right-click).' } } },
  render: () => {
    const doc = ref(sampleDoc)
    return withProviders(h(ComponentEditor, { modelValue: doc.value, 'onUpdate:modelValue': (v: Record<string, unknown>) => (doc.value = v) } as never))
  },
}
