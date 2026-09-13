<script setup lang="ts">
import { h, onMounted, computed, ref } from 'vue'
import { NSpace, NButton, NPopconfirm, NIcon, NModal, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'
import { usePersuratanStore } from '~/stores/persuratan'
import { getErrorMessage } from '~/utils/error'
import type { DocTemplate } from '~/shared/types/persuratan'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const store = usePersuratanStore()
const message = import.meta.client ? useMessage() : null
const search = ref('')
const showCreate = ref(false)
const createForm = ref({ name: '', code: '', description: '' })
const creating = ref(false)

const columns = computed(() => [
  { key: 'name', title: 'Nama', sortable: true },
  { key: 'code', title: 'Kode', sortable: true },
  {
    key: 'status', title: 'Status', sortable: true,
    render: (row: DocTemplate) => h(BadgePill, {
      label: row.status,
      type: row.status === 'PUBLISHED' ? 'success' : row.status === 'ARCHIVED' ? 'default' : 'warning',
    }),
  },
  { key: 'version', title: 'Versi', sortable: true, width: 80 },
  {
    key: 'actions', title: 'Aksi', width: 160,
    render(row: DocTemplate) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, { size: 'small', quaternary: true, type: 'info', onClick: () => navigateTo(`/dashboard/templates/${row.id}`) },
          { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
        h(NButton, { size: 'small', quaternary: true, type: 'success', onClick: () => handlePublish(row) }, { default: () => 'Publish' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row) }, {
          trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' },
            { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
          default: () => `Hapus template "${row.name}"?`,
        }),
      ])
    },
  },
])

async function handlePublish(row: DocTemplate) {
  try {
    await store.updateTemplate(row.id, { status: 'PUBLISHED' })
    message?.success(`Template "${row.name}" published`)
    await store.fetchTemplates()
  } catch (e) {
    message?.error(getErrorMessage(e))
  }
}

async function handleDelete(row: DocTemplate) {
  try {
    await store.removeTemplate(row.id)
    message?.success(`Template "${row.name}" dihapus`)
  } catch (e) {
    message?.error(getErrorMessage(e, 'Gagal menghapus (mungkin dipakai step)'))
  }
}

async function handleCreate() {
  creating.value = true
  try {
    const created = await store.createTemplate({
      name: createForm.value.name.trim(),
      code: createForm.value.code.trim().toLowerCase(),
      description: createForm.value.description.trim() || undefined,
      schema_json: { type: 'document', children: [{ type: 'heading', props: { content: createForm.value.name.trim(), level: 1 } }] },
    })
    showCreate.value = false
    createForm.value = { name: '', code: '', description: '' }
    await navigateTo(`/dashboard/templates/${created.id}`)
  } catch (e) {
    message?.error(getErrorMessage(e))
  } finally {
    creating.value = false
  }
}

function reload() {
  store.fetchTemplates(search.value || undefined).catch(() => {})
}

onMounted(reload)
</script>

<template>
  <PageShell
    title="Template"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Persuratan' }, { label: 'Template' }]"
    description="Surat sebagai JSON Tree — builder 3-pane, auto-form, preview PDF."
  >
    <DataTable
      :columns="columns"
      :data="store.templates"
      :loading="store.loading"
      :total="store.templates.length"
      storage-key="datatable-doc-templates"
      search-placeholder="Cari template..."
      empty-description="Belum ada template"
      empty-cta-label="+ Buat Template"
      :error="store.error"
      @search="(v: string) => { search = v; reload() }"
      @empty-cta="showCreate = true"
      @retry="reload"
    >
      <template #toolbar>
        <NButton type="primary" @click="showCreate = true">
          <template #icon><NIcon><Add /></NIcon></template>
          Buat Template
        </NButton>
      </template>
    </DataTable>

    <NModal :show="showCreate" preset="card" title="Template Baru" class="max-w-md modal-card" :bordered="false" @update:show="(v: boolean) => showCreate = v">
      <NForm @submit.prevent="handleCreate">
        <NFormItem label="Nama" :show-require-mark="true">
          <NInput v-model:value="createForm.name" placeholder="SK Pengangkatan" />
        </NFormItem>
        <NFormItem label="Kode [a-z0-9-_]" :show-require-mark="true">
          <NInput v-model:value="createForm.code" placeholder="sk-pengangkatan" />
        </NFormItem>
        <NFormItem label="Deskripsi">
          <NInput v-model:value="createForm.description" type="textarea" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showCreate = false">Batal</NButton>
          <NButton type="primary" attr-type="submit" :loading="creating">Buat & Buka Builder</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </PageShell>
</template>
