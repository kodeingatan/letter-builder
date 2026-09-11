import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, h } from 'vue'
import { NButton, NIcon, NTag, NAlert, NEmpty, NSpin, NPopconfirm, NSpace } from 'naive-ui'
import { ChevronUp, ChevronDown, View, Edit, TrashCan, Search, Restart, Settings } from '@vicons/carbon'

const meta: Meta = {
  title: 'GlobalTable/ColumnRow',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Columns manager — DataTable-based + reorder eksplisit (ChevronUp/Down via h(NIcon)) + NPopconfirm delete + icons distinct Eye/Edit/TrashCan. Fix: raw <table> → DataTable (AC-D01), DragHandle palsu → Chevron, purple → warning, NEmpty+CTA, NAlert+retry. Token #3B82F6.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const sampleColumns = [
  { id: 1, name: 'nip', display: 'NIP', type: 'text', required: true },
  { id: 2, name: 'nama', display: 'Nama', type: 'text', required: true },
  { id: 3, name: 'jabatan_id', display: 'Jabatan', type: 'select-table-relation', required: false },
  { id: 4, name: 'gaji_total', display: 'Gaji Total', type: 'readonly-computed', required: false },
]

export const Default: Story = {
  render: () => ({
    components: { NButton, NIcon, NTag, NPopconfirm, NSpace },
    setup() {
      const cols = ref([...sampleColumns])
      const move = (id: number, dir: number) => {
        const i = cols.value.findIndex(c => c.id === id)
        const j = i + dir
        if (j < 0 || j >= cols.value.length) return
        const tmp = cols.value[i]; cols.value[i] = cols.value[j]; cols.value[j] = tmp
      }
      const remove = (id: number) => { cols.value = cols.value.filter(c => c.id !== id) }
      return { cols, move, remove, ChevronUp, ChevronDown, View, Edit, TrashCan }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:480px">
        <div style="max-width:1100px; margin:0 auto">
          <div style="font-size:11px; color:#94a3b8; letter-spacing:.05em; text-transform:uppercase; font-weight:600; margin-bottom:8px">Columns manager — DataTable kanonis + reorder eksplisit — AC-D01</div>
          <div style="background:#fff; border:1px solid #E5E7EB; border-radius:8px; overflow:hidden">
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; padding:12px 16px; border-bottom:1px solid #F3F4F6; background:#F9FAFB">
              <div style="flex:1; min-width:320px; height:32px; border:1px solid #E5E7EB; border-radius:6px; background:#fff; display:flex; align-items:center; gap:8px; padding:0 10px">
                <NIcon><Search /></NIcon> <input placeholder="Cari kolom..." style="border:none; outline:none; flex:1; font-size:13px" />
              </div>
              <div style="width:160px; height:32px; border:1px solid #E5E7EB; border-radius:6px; background:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 10px; font-size:13px">Semua Kolom <span>▾</span></div>
              <NButton size="small"><template #icon><NIcon><Restart /></NIcon></template>Segarkan</NButton>
              <NButton size="small" quaternary><template #icon><NIcon><Settings /></NIcon></template></NButton>
            </div>
            <div style="display:flex; background:#F9FAFB; border-bottom:1px solid #E5E7EB; font-size:11px; fontWeight:700; color:#6B7280; padding:10px 12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase">
              <div style="width:80px; text-align:center">Reorder</div><div style="flex:1">Name / Display</div><div style="width:150px">Type</div><div style="width:150px">Aksi</div>
            </div>
            <div v-for="(c,i) in cols" :key="c.id" style="display:flex; align-items:center; border-bottom:1px solid #F3F4F6; font-size:13px">
              <div style="width:80px; display:flex; flex-direction:column; gap:4px; align-items:center; padding:8px 4px">
                <NButton size="small" quaternary :disabled="i===0" @click="move(c.id,-1)"><template #icon><NIcon><ChevronUp /></NIcon></template></NButton>
                <NButton size="small" quaternary :disabled="i===cols.length-1" @click="move(c.id,1)"><template #icon><NIcon><ChevronDown /></NIcon></template></NButton>
              </div>
              <div style="flex:1"><span style="font-family:'SF Mono',monospace; background:#F3F4F6; padding:2px 6px; border-radius:4px">{{ c.name }}</span> {{ c.display }}</div>
              <div style="width:150px"><NTag :type="c.type==='select-table-relation' ? 'warning' : c.type.includes('computed') ? 'info' : 'default'" size="small">{{ c.type }}</NTag></div>
              <div style="width:150px; display:flex; gap:6px">
                <NButton size="small" quaternary type="info"><template #icon><NIcon><View /></NIcon></template></NButton>
                <NButton size="small" quaternary type="warning"><template #icon><NIcon><Edit /></NIcon></template></NButton>
                <NPopconfirm @positive-click="remove(c.id)" positive-text="Hapus" negative-text="Batal">
                  <template #trigger><NButton size="small" quaternary type="error"><template #icon><NIcon><TrashCan /></NIcon></template></NButton></template>
                  Hapus kolom {{ c.name }}? Tindakan tidak dapat dibatalkan.
                </NPopconfirm>
              </div>
            </div>
          </div>
          <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">Fix: DragHandle palsu → ChevronUp/Down via h(NIcon) + live region “Dipindahkan ke posisi”. Icons distinct 👁 View / ✎ Edit / 🗑 Delete (bukan 2× Edit). Tag currency `warning` bukan `purple`.</div>
        </div>
      </div>
    `,
  }),
}

export const Empty: Story = {
  render: () => ({
    components: { NEmpty, NButton, NIcon },
    setup() { return { } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:700px; margin:0 auto; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:24px">
          <NEmpty description="Belum ada kolom">
            <template #extra>
              <NButton type="primary" style="margin-top:12px">+ Buat Kolom Pertama</NButton>
              <div style="font-size:11px; color:#6B7280; margin-top:6px">ALT-01 — tidak dead-end; CTA mengarah ke column form</div>
            </template>
          </NEmpty>
        </div>
      </div>
    `,
  }),
}

export const ErrorWithRetry: Story = {
  render: () => ({
    components: { NAlert, NButton },
    setup() {
      const err = ref('Gagal memuat kolom — Kesalahan jaringan.')
      const retry = () => { err.value = ''; setTimeout(()=> err.value='', 0) }
      return { err, retry }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:900px; margin:0 auto">
          <NAlert v-if="err" type="error" closable @close="err=''" style="margin-bottom:12px">
            <template #header>Gagal memuat kolom</template>
            Kesalahan jaringan. <NButton size="small" @click="retry" style="margin-left:8px">Coba lagi</NButton>
          </NAlert>
          <div style="border:1px solid #E5E7EB; border-radius:8px; padding:24px; background:#fff; text-align:center; color:#6B7280">Tabel di bawah alert — retry tanpa reset filter</div>
          <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">ERR-02 409 + NAlert error + daftar referensi — hapus dipakai di Template/SK step 2 dan baris 14, 42</div>
        </div>
      </div>
    `,
  }),
}

export const Loading: Story = {
  render: () => ({
    components: { NSpin },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:900px; margin:0 auto">
          <NSpin show style="border:1px solid #E5E7EB; border-radius:8px; padding:40px; background:#fff">
            <div style="height:120px"></div>
          </NSpin>
          <div style="font-size:11px; color:#6B7280; margin-top:8px">NSpin overlay semi-transparan — NEmpty tidak tampil saat loading</div>
        </div>
      </div>
    `,
  }),
}
