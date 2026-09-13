<script setup lang="ts">
import { computed } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NInputNumber, NEmpty } from 'naive-ui'
import { useBuilderStore } from '~/stores/builder'
import RepeaterEditor from './RepeaterEditor.vue'
import ConditionEditor from './ConditionEditor.vue'
import type { DocNode } from '~/shared/types/document'

const store = useBuilderStore()

const node = computed(() => store.selected?.node ?? null)

const typeOptions = [
  'text', 'heading', 'paragraph', 'image', 'table', 'signature',
  'date', 'qrcode', 'divider', 'pagebreak', 'repeater', 'condition', 'component-ref',
].map((t) => ({ label: t, value: t }))

function patch(props: Record<string, unknown>) {
  if (!store.selected) return
  const next: DocNode = { ...store.selected.node, props: { ...(store.selected.node.props ?? {}), ...props } }
  store.update(store.selected.id, next)
}

function setType(type: string) {
  if (!store.selected) return
  const keep = store.selected.node
  store.update(store.selected.id, { type: type as DocNode['type'], props: keep.props ?? {}, children: keep.children, elseChildren: keep.elseChildren })
}

function prop(key: string): string {
  return String(node.value?.props?.[key] ?? '')
}
</script>

<template>
  <div class="property-panel">
    <NEmpty v-if="!node" description="Pilih blok di kanvas untuk mengedit properti" />
    <NForm v-else :model="node.props ?? {}" label-placement="top">
      <NFormItem label="Tipe blok">
        <NSelect :value="node.type" :options="typeOptions" @update:value="setType" />
      </NFormItem>
      <template v-if="['text', 'paragraph', 'heading'].includes(node.type)">
        <NFormItem label="Konten (mendukung {{binding}})">
          <NInput :value="prop('content')" type="textarea" @update:value="(v: string) => patch({ content: v })" />
        </NFormItem>
        <NFormItem v-if="node.type === 'heading'" label="Level">
          <NInputNumber :value="Number(node.props?.level ?? 2)" :min="1" :max="4" @update:value="(v: number | null) => patch({ level: v ?? 2 })" />
        </NFormItem>
      </template>
      <template v-else-if="node.type === 'image'">
        <NFormItem label="Src (https://, /api/storage/, data:image/)">
          <NInput :value="prop('src')" @update:value="(v: string) => patch({ src: v })" />
        </NFormItem>
        <NFormItem label="Alt">
          <NInput :value="prop('alt')" @update:value="(v: string) => patch({ alt: v })" />
        </NFormItem>
      </template>
      <template v-else-if="node.type === 'signature'">
        <NFormItem label="Nama ({{signer.name}})">
          <NInput :value="prop('name')" @update:value="(v: string) => patch({ name: v })" />
        </NFormItem>
        <NFormItem label="Jabatan">
          <NInput :value="prop('title')" @update:value="(v: string) => patch({ title: v })" />
        </NFormItem>
        <NFormItem label="Kota">
          <NInput :value="prop('city')" @update:value="(v: string) => patch({ city: v })" />
        </NFormItem>
      </template>
      <template v-else-if="node.type === 'component-ref'">
        <NFormItem label="ComponentId (nama component)">
          <NInput :value="prop('componentId')" @update:value="(v: string) => patch({ componentId: v })" />
        </NFormItem>
      </template>
      <template v-else-if="node.type === 'repeater'">
        <RepeaterEditor :node="node" @patch="patch" />
      </template>
      <template v-else-if="node.type === 'condition'">
        <ConditionEditor :node="node" @patch="patch" />
      </template>
      <template v-else-if="node.type === 'date'">
        <NFormItem label="Nilai ({{current_date}} default)">
          <NInput :value="prop('value')" @update:value="(v: string) => patch({ value: v })" />
        </NFormItem>
      </template>
      <template v-else-if="node.type === 'qrcode'">
        <NFormItem label="Payload">
          <NInput :value="prop('payload')" @update:value="(v: string) => patch({ payload: v })" />
        </NFormItem>
      </template>
      <NFormItem v-else label="Info">
        <span class="text-sm opacity-70">Blok {{ node.type }} tanpa properti visual (children: {{ (node.children ?? []).length }}).</span>
      </NFormItem>
    </NForm>
  </div>
</template>
