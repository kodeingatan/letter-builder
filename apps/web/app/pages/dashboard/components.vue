<script setup lang="ts">
import { h, onMounted, computed, ref } from 'vue'
import { NSpace, NButton, NPopconfirm, NIcon, NModal, NAlert, NTag, NForm, NFormItem, NInput, NCheckbox, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'
import { ComponentEditor } from '~/components/features/persuratan'
import { usePersuratanStore } from '~/stores/persuratan'
import { getErrorMessage, isConflictError, getConflictReferences, getConflictData } from '~/utils/error'
import type { DocComponent } from '~/shared/types/persuratan'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const store = usePersuratanStore()
const message = import.meta.client ? useMessage() : null
const search = ref('')
const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editing = ref<DocComponent | null>(null)
const form = ref({ name: '', is_looping: false })
const tiptapJson = ref<Record<string, unknown> | null>(null)
const saving = ref(false)
const conflictRefs = ref<string[] | null>(null)
const conflictDetail = ref<{ steps?: number; administrations?: number[] } | null>(null)
const showConflict = ref(false)

function parseRefsToDisplay(refs: string[]): Array<{ label: string; href: string }> {
  return refs.map((r) => {
    const [type, ...rest] = r.split(':')
    const name = rest.join(':') || r
    const href = type === 'template' ? `/dashboard/templates?search=${encodeURIComponent(name)}` : type === 'component' ? `/dashboard/components?search=${encodeURIComponent(name)}` : `/dashboard/master-data/${encodeURIComponent(name)}`
    return { label: `${type}:${name}`, href }
  })
}

const columns = computed(() => [
  { key: 'name', title: 'Nama', sortable: true },
  {
    key: 'is_looping', title: 'Loop', sortable: true,
    render: (row: DocComponent) => h(BadgePill, { label: row.is_looping ? 'LOOP' : 'STATIS', type: row.is_looping ? 'warning' : 'default' }),
  },
  { key: 'version', title: 'Versi', sortable: true, width: 80 },
  {
    key: 'actions', title: 'Aksi', width: 120,
    render(row: DocComponent) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, { size: 'small', quaternary: true, type: 'warning', onClick: () => openEdit(row) },
          { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row) }, {
          trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' },
            { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
          default: () => `Hapus component "${row.name}"?`,
        }),
      ])
    },
  },
])

function openCreate() {
  formMode.value = 'create'
  editing.value = null
  form.value = { name: '', is_looping: false }
  tiptapJson.value = { type: 'doc', content: [{ type: 'paragraph' }] }
  showForm.value = true
}

function openEdit(row: DocComponent) {
  formMode.value = 'edit'
  editing.value = row
  form.value = { name: row.name, is_looping: row.is_looping }
  try {
    tiptapJson.value = JSON.parse(row.tiptap_json) as Record<string, unknown>
  } catch {
    tiptapJson.value = { type: 'doc', content: [{ type: 'paragraph' }] }
  }
  showForm.value = true
}

async function handleDelete(row: DocComponent) {
  try {
    await store.removeComponent(row.id)
    message?.success(`Component "${row.name}" dihapus`)
  } catch (e) {
    const refs = getConflictReferences(e)
    if (isConflictError(e) && refs) {
      conflictRefs.value = refs
      conflictDetail.value = getConflictData(e) as { steps?: number; administrations?: number[] } | null
      showConflict.value = true
      return
    }
    // doc-templates style 409 with steps/administrations
    if (isConflictError(e)) {
      const data = getConflictData(e)
      if (data?.steps !== undefined) {
        conflictRefs.value = [`${data.steps} step(s) in ${data.administrations?.length ?? 0} administration(s)`]
        conflictDetail.value = data
        showConflict.value = true
        return
      }
    }
    message?.error(getErrorMessage(e, 'Gagal menghapus (mungkin masih dipakai)'))
  }
}

async function handleSave() {
  saving.value = true
  try {
    if (formMode.value === 'create') {
      await store.createComponent({ name: form.value.name.trim(), is_looping: form.value.is_looping, tiptap_json: tiptapJson.value ?? {} })
      message?.success('Component tersimpan (v1)')
    } else if (editing.value) {
      await store.updateComponent(editing.value.id, { name: form.value.name.trim(), is_looping: form.value.is_looping, tiptap_json: tiptapJson.value ?? {} })
      message?.success('Component diperbarui (versi naik)')
    }
    showForm.value = false
    await store.fetchComponents()
  } catch (e) {
    message?.error(getErrorMessage(e))
  } finally {
    saving.value = false
  }
}

function reload() {
  store.fetchComponents(search.value || undefined).catch(() => {})
}

onMounted(reload)
</script>

<template>
  <PageShell
    title="Component"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Persuratan' }, { label: 'Component' }]"
    description="Blok reusable Tiptap — klik kanan di editor untuk sisipkan binding."
  >
    <DataTable
      :columns="columns"
      :data="store.components"
      :loading="store.loading"
      :total="store.components.length"
      storage-key="datatable-doc-components"
      search-placeholder="Cari component..."
      empty-description="Belum ada component"
      empty-cta-label="+ Buat Component"
      :error="store.error"
      @search="(v: string) => { search = v; reload() }"
      @empty-cta="openCreate"
      @retry="reload"
    >
      <template #toolbar>
        <NButton type="primary" @click="openCreate">
          <template #icon><NIcon><Add /></NIcon></template>
          Buat Component
        </NButton>
      </template>
    </DataTable>

    <NModal :show="showForm" preset="card" title="Editor Component (Tiptap)" class="max-w-3xl modal-card" :bordered="false" @update:show="(v: boolean) => showForm = v">
      <NForm @submit.prevent="handleSave">
        <div class="grid gap-4 md:grid-cols-2 mb-3">
          <NFormItem label="Nama" :show-require-mark="true">
            <NInput v-model:value="form.name" placeholder="Kop Surat" />
          </NFormItem>
          <NFormItem label="Looping">
            <NCheckbox v-model:checked="form.is_looping">is_looping (wajib binding item.*)</NCheckbox>
          </NFormItem>
        </div>
        <ComponentEditor v-model:model-value="tiptapJson" :is-looping="form.is_looping" />
        <NSpace justify="end" class="mt-3">
          <NButton @click="showForm = false">Batal</NButton>
          <NButton type="primary" attr-type="submit" :loading="saving">Simpan</NButton>
        </NSpace>
      </NForm>
    </NModal>

    <NModal v-model:show="showConflict" preset="card" title="Tidak dapat menghapus — masih dipakai" class="max-w-xl modal-card" :bordered="false" aria-modal="true">
      <NAlert type="warning" class="mb-3" :show-icon="false">
        Hapus diblokir 409 — berikut daftar pemakai. Lepaskan dependensi dahulu.
      </NAlert>
      <div data-testid="conflict-references" role="list">
        <div v-for="ref in parseRefsToDisplay(conflictRefs ?? [])" :key="ref.label" role="listitem" class="flex items-center justify-between py-2 border-b border-[#e6e6e6] last:border-0">
          <div class="flex items-center gap-2">
            <span class="text-sm">{{ ref.label }}</span>
            <NTag size="small" :bordered="false" class="rounded-full" style="background:#FFFBEB;color:#D97706;border:1px solid #FDE68A">409</NTag>
          </div>
          <NButton size="small" secondary @click="navigateTo(ref.href)">Lihat</NButton>
        </div>
        <div v-if="(conflictRefs ?? []).length === 0" class="text-sm text-[#615d59]">Tidak ada detail referensi — periksa template/administrasi terkait.</div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <NButton type="primary" @click="showConflict = false">Tutup</NButton>
        </div>
      </template>
    </NModal>
  </PageShell>
</template>
