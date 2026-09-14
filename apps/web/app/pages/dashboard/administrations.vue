<script setup lang="ts">
import { h, onMounted, computed, ref } from 'vue'
import { NSpace, NButton, NPopconfirm, NIcon, NModal, NAlert, NForm, NFormItem, NInput, NSelect, NDynamicInput, NCard, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { usePersuratanStore } from '~/stores/persuratan'
import { getErrorMessage, isConflictError } from '~/utils/error'
import type { Administration, MappingEntry } from '~/shared/types/persuratan'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const store = usePersuratanStore()
const message = import.meta.client ? useMessage() : null
const search = ref('')
const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', slug: '', description: '' })
const steps = ref<Array<{ template_id: number | null; step_order: number; mappingText: string }>>([])
const saving = ref(false)
const formError = ref<string | null>(null)
const formErrorType = ref<'error' | 'warning'>('error')

const columns = computed(() => [
  { key: 'name', title: 'Nama Surat', sortable: true },
  { key: 'slug', title: 'Slug', sortable: true },
  {
    key: 'actions', title: 'Aksi', width: 200,
    render(row: Administration) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, { size: 'small', quaternary: true, type: 'info', onClick: () => navigateTo(`/dashboard/documents/${row.slug}`) },
          { default: () => 'Wizard' }),
        h(NButton, { size: 'small', quaternary: true, type: 'warning', onClick: () => openEdit(row) },
          { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row) }, {
          trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' },
            { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
          default: () => `Hapus administrasi "${row.name}"? (runs tersimpan tetap ada)`,
        }),
      ])
    },
  },
])

const templateOptions = computed(() =>
  store.templates.map((t) => ({ label: `${t.name} (v${t.version})`, value: t.id })),
)

function openCreate() {
  editingId.value = null
  form.value = { name: '', slug: '', description: '' }
  steps.value = []
  formError.value = null
  showForm.value = true
  store.fetchTemplates().catch(() => {})
}

async function openEdit(row: Administration) {
  editingId.value = row.id
  formError.value = null
  form.value = { name: row.name, slug: row.slug, description: row.description ?? '' }
  try {
    const detail = await store.fetchAdministration(row.id) as unknown as {
      steps?: Array<{ template_id: number; step_order: number; mapping: Record<string, MappingEntry> }>
    }
    steps.value = (detail.steps ?? []).map((s) => ({
      template_id: s.template_id, step_order: s.step_order, mappingText: JSON.stringify(s.mapping ?? {}),
    }))
  } catch (e) {
    message?.error(getErrorMessage(e))
    steps.value = []
  }
  showForm.value = true
  store.fetchTemplates().catch(() => {})
}

async function handleDelete(row: Administration) {
  try {
    await store.removeAdministration(row.id)
    message?.success(`Administrasi "${row.name}" dihapus`)
  } catch (e) {
    message?.error(getErrorMessage(e))
  }
}

async function handleSave() {
  saving.value = true
  formError.value = null
  try {
    const payloadSteps = steps.value
      .filter((s) => s.template_id !== null)
      .map((s, i) => ({
        template_id: s.template_id as number,
        step_order: i,
        mapping: JSON.parse(s.mappingText || '{}') as Record<string, MappingEntry>,
      }))
    if (editingId.value === null) {
      await store.createAdministration({
        name: form.value.name.trim(),
        ...(form.value.slug.trim() ? { slug: form.value.slug.trim() } : {}),
        ...(form.value.description.trim() ? { description: form.value.description.trim() } : {}),
        steps: payloadSteps,
      })
      message?.success('Administrasi tersimpan')
    } else {
      await store.updateAdministration(editingId.value, {
        name: form.value.name.trim(),
        ...(form.value.description.trim() ? { description: form.value.description.trim() } : {}),
        steps: payloadSteps,
      })
      message?.success('Administrasi diperbarui')
    }
    showForm.value = false
    await store.fetchAdministrations()
  } catch (e) {
    if (isConflictError(e)) {
      formErrorType.value = 'warning'
      formError.value = getErrorMessage(e, 'Slug/nama sudah ada (409) — coba nama lain.')
    } else {
      formErrorType.value = 'error'
      formError.value = getErrorMessage(e)
      message?.error(getErrorMessage(e))
    }
  } finally {
    saving.value = false
  }
}

function reload() {
  store.fetchAdministrations(search.value || undefined).catch(() => {})
}

onMounted(reload)
</script>

<template>
  <PageShell
    title="Administrasi"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Persuratan' }, { label: 'Administrasi' }]"
    description="Definisi persuratan multi-step — data step.field + mapping template."
  >
    <DataTable
      :columns="columns"
      :data="store.administrations"
      :loading="store.loading"
      :total="store.administrations.length"
      storage-key="datatable-administrations"
      search-placeholder="Cari administrasi..."
      empty-description="Belum ada administrasi"
      empty-cta-label="+ Buat Administrasi"
      :error="store.error"
      @search="(v: string) => { search = v; reload() }"
      @empty-cta="openCreate"
      @retry="reload"
    >
      <template #toolbar>
        <NButton type="primary" @click="openCreate">
          <template #icon><NIcon><Add /></NIcon></template>
          Buat Administrasi
        </NButton>
      </template>
    </DataTable>

    <NModal :show="showForm" preset="card" title="Form Administrasi" class="max-w-2xl modal-card" :bordered="false" @update:show="(v: boolean) => showForm = v">
      <NAlert v-if="formError" :type="formErrorType" class="mb-3" closable @close="formError = null">{{ formError }}</NAlert>
      <NForm @submit.prevent="handleSave">
        <div class="grid gap-4 md:grid-cols-2">
          <NFormItem label="Nama surat" :show-require-mark="true">
            <NInput v-model:value="form.name" placeholder="SK Pengangkatan" />
          </NFormItem>
          <NFormItem label="Slug (auto bila kosong)">
            <NInput v-model:value="form.slug" placeholder="sk-pengangkatan" :disabled="editingId !== null" />
          </NFormItem>
        </div>
        <NFormItem label="Deskripsi">
          <NInput v-model:value="form.description" type="textarea" />
        </NFormItem>
        <h4 class="font-semibold mb-2">Steps (template + mapping)</h4>
        <NDynamicInput v-model:value="steps" :on-create="() => ({ template_id: null, step_order: steps.length, mappingText: '{}' })" #="{ value }">
          <NCard size="small" class="w-full">
            <NFormItem label="Template">
              <NSelect v-model:value="value.template_id" :options="templateOptions" placeholder="Pilih template" />
            </NFormItem>
            <NFormItem label="Mapping JSON">
              <NInput v-model:value="value.mappingText" type="textarea" placeholder='{"letter.number":{"kind":"value","ref":"800/1"}}' />
            </NFormItem>
          </NCard>
        </NDynamicInput>
        <NSpace justify="end" class="mt-3">
          <NButton @click="showForm = false">Batal</NButton>
          <NButton type="primary" attr-type="submit" :loading="saving">Simpan</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </PageShell>
</template>
