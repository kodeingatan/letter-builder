<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NButton, NSpace, NSpin, NAlert, NInput, NSelect, useMessage } from 'naive-ui'
import { TemplateCanvas, PropertyPanel, DocumentPreviewDrawer } from '~/components/features/persuratan'
import { usePersuratanStore } from '~/stores/persuratan'
import { useAuthStore } from '~/stores/auth'
import { useBuilderStore } from '~/stores/builder'
import { getErrorMessage } from '~/utils/error'
import type { DocNode } from '~/shared/types/document'
import type { DocTemplate } from '~/shared/types/persuratan'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const id = computed(() => Number(route.params.id))
const store = usePersuratanStore()
const builder = useBuilderStore()
const message = import.meta.client ? useMessage() : null
const template = ref<DocTemplate | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const saving = ref(false)
const previewHtml = ref('')
const showPreview = ref(false)
const previewDataText = ref('{}')

const BLOCK_PALETTE: Array<{ label: string; node: () => DocNode }> = [
  { label: '+ Teks', node: () => ({ type: 'text', props: { content: 'Teks baru {{field}}' } }) },
  { label: '+ Heading', node: () => ({ type: 'heading', props: { content: 'Judul', level: 2 } }) },
  { label: '+ Gambar', node: () => ({ type: 'image', props: { src: '', alt: '' } }) },
  { label: '+ Loop', node: () => ({ type: 'repeater', props: { source: '', item: 'item' }, children: [{ type: 'text', props: { content: '{{item.field}}' } }] }) },
  { label: '+ Kondisi', node: () => ({ type: 'condition', props: { field: '', operator: 'eq', value: '' }, children: [{ type: 'text', props: { content: 'Jika benar' } }], elseChildren: [] }) },
  { label: '+ Component', node: () => ({ type: 'component-ref', props: { componentId: '', propsOverride: {} } }) },
  { label: '+ TTD', node: () => ({ type: 'signature', props: { name: '{{signer.name}}', title: '', city: '' } }) },
  { label: '+ Pembatas', node: () => ({ type: 'divider' }) },
  { label: '+ Halaman', node: () => ({ type: 'pagebreak' }) },
]

onMounted(async () => {
  try {
    const loaded = await store.fetchTemplate(id.value)
    template.value = loaded
    const schema = (loaded.schema_json ?? { type: 'document', children: [] }) as unknown as DocNode
    builder.load(schema.children ?? [])
  } catch (e) {
    loadError.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
})

async function handleSave(publish: boolean) {
  saving.value = true
  try {
    const schema = { type: 'document', children: builder.toNodes() }
    const updated = await store.updateTemplate(id.value, {
      schema_json: schema,
      ...(publish ? { status: 'PUBLISHED' } : {}),
    })
    template.value = updated
    message?.success(publish ? 'Template published (versi naik)' : 'Draft tersimpan')
  } catch (e) {
    message?.error(getErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function handlePreview() {
  try {
    const data = JSON.parse(previewDataText.value || '{}') as Record<string, unknown>
    const res = await $fetch<{ html: string; warnings: string[] }>(`/api/doc-templates/${id.value}/preview`, {
      method: 'POST',
      body: { data },
      headers: { Authorization: `Bearer ${useAuthStore().token}` },
    })
    previewHtml.value = res.html
    if (res.warnings.length > 0) message?.warning(res.warnings.join('; '))
    showPreview.value = true
  } catch (e) {
    message?.error(getErrorMessage(e))
  }
}
</script>

<template>
  <PageShell
    :title="`Builder: ${template?.name ?? '...'}`"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Template', href: '/dashboard/templates' }, { label: template?.name ?? '...' }]"
    :description="`v${template?.version ?? 1} — ${template?.status ?? ''} — kiri library, tengah kanvas, kanan properti.`"
  >
    <NSpin v-if="loading" />
    <NAlert v-else-if="loadError" type="error">{{ loadError }}</NAlert>
    <div v-else class="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
      <aside class="border rounded p-3 bg-[#f6f5f4]">
        <h4 class="font-semibold mb-2">Library Blok</h4>
        <NSpace vertical>
          <NButton v-for="item in BLOCK_PALETTE" :key="item.label" size="small" class="w-full" @click="builder.add(item.node())">
            {{ item.label }}
          </NButton>
        </NSpace>
        <h4 class="font-semibold mt-4 mb-2">Data Preview (JSON)</h4>
        <NInput v-model:value="previewDataText" type="textarea" :autosize="{ minRows: 4 }" placeholder='{"letter":{"number":"800/1"}}' />
      </aside>
      <section class="border rounded p-3 min-h-[400px]">
        <h4 class="font-semibold mb-2">Kanvas Dokumen</h4>
        <TemplateCanvas />
      </section>
      <aside class="border rounded p-3">
        <h4 class="font-semibold mb-2">Properti</h4>
        <PropertyPanel />
        <NSpace vertical class="mt-4">
          <NButton type="primary" class="w-full" :loading="saving" @click="handleSave(false)">Simpan Draft</NButton>
          <NButton type="success" class="w-full" :loading="saving" @click="handleSave(true)">Publish (v+1)</NButton>
          <NButton class="w-full" @click="handlePreview">Preview HTML</NButton>
        </NSpace>
      </aside>
    </div>
    <DocumentPreviewDrawer v-model:visible="showPreview" :html="previewHtml" :document-id="null" />
  </PageShell>
</template>
