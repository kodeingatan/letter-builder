import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, h } from 'vue'
import { NSelect, NSpin, NEmpty, NAlert, NButton, NIcon, NTag } from 'naive-ui'
import { Search } from '@vicons/carbon'

const meta: Meta = {
  title: 'GlobalTable/RelationSelector',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'RelationSelector — NSelect remote + search 300ms + pagination benar `options.length < total` (fix offset+length bug) + states NEmpty/NAlert+retry + multiple NTag. Token #3B82F6.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof meta>

const allOptions = Array.from({ length: 42 }, (_, i) => ({
  label: `Jabatan ${String(i + 1).padStart(3, '0')} — ${['Staf Ahli', 'Kabag', 'Sekretaris', 'Kepala'][i % 4]}`,
  value: i + 1,
}))

export const Default: Story = {
  render: () => ({
    components: { NSelect, NIcon },
    setup() {
      const value = ref<number | null>(2)
      const options = ref(allOptions.slice(0, 20))
      const search = ref('')
      const onSearch = (q: string) => {
        search.value = q
        if (!q) options.value = allOptions.slice(0, 20)
        else options.value = allOptions.filter(o => o.label.toLowerCase().includes(q.toLowerCase())).slice(0, 20)
      }
      const hasMore = () => options.value.length < 42
      return { value, options, onSearch, hasMore, Search }
    },
    template: `
      <div style="width:360px; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
        <div style="font-size:11px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:#94a3b8; margin-bottom:6px">RelationSelector — default 20/42</div>
        <NSelect v-model:value="value" :options="options" filterable remote clearable placeholder="Cari jabatan..." @search="onSearch" style="width:100%" />
        <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">hasMore = {{ options.length }} < 42 = {{ hasMore() }} — scroll near bottom 5 → fetch(floor(length/20)+1) — fix offset+length bug {{ '<40>' }}</div>
      </div>
    `,
  }),
}

export const Loading: Story = {
  render: () => ({
    components: { NSelect, NSpin, NIcon },
    setup() { return { Search } },
    template: `
      <div style="width:360px; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
        <NSelect placeholder="Cari jabatan..." :options="[]" :loading="true" filterable remote style="width:100%" />
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:12px; border:1px solid #E5E7EB; border-radius:6px; padding:16px">
          <NSpin size="small" /> <span style="font-size:13px; color:#6B7280">Memuat opsi…</span>
        </div>
      </div>
    `,
  }),
}

export const Empty: Story = {
  render: () => ({
    components: { NSelect, NEmpty, NButton },
    template: `
      <div style="width:360px; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
        <NSelect placeholder="Cari jabatan..." :options="[]" filterable remote style="width:100%" />
        <div style="margin-top:12px">
          <NEmpty description="Tidak ada data. Buat dulu di tabel target.">
            <template #extra>
              <NButton size="small" type="primary" style="margin-top:8px">+ Buat Data Jabatan</NButton>
              <div style="font-size:11px; color:#6B7280; margin-top:6px">ALT-02 — panduan link, tidak dead-end</div>
            </template>
          </NEmpty>
        </div>
      </div>
    `,
  }),
}

export const ErrorWithRetry: Story = {
  render: () => ({
    components: { NSelect, NAlert, NButton },
    setup() {
      const err = ref('Gagal memuat opsi — Kesalahan jaringan.')
      return { err }
    },
    template: `
      <div style="width:360px; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
        <NSelect placeholder="Cari jabatan..." :options="[]" filterable remote style="width:100%" />
        <NAlert v-if="err" type="error" style="margin-top:12px">
          <template #header>Gagal memuat opsi</template>
          Periksa koneksi atau tabel target.
          <NButton size="small" @click="err=''" style="margin-top:8px">↻ Coba lagi</NButton>
          <div style="font-size:11px; color:#6B7280; margin-top:6px">Pilihan lama dipertahankan — keep selectedValue on error</div>
        </NAlert>
      </div>
    `,
  }),
}

export const Multiple: Story = {
  render: () => ({
    components: { NSelect, NTag },
    setup() {
      const value = ref<number[]>([1, 3])
      const options = ref(allOptions.slice(0, 20))
      return { value, options }
    },
    template: `
      <div style="width:400px; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
        <div style="font-size:11px; font-weight:600; color:#94a3b8; margin-bottom:6px">Multiple — NTag per selection</div>
        <NSelect v-model:value="value" :options="options" multiple filterable remote clearable placeholder="Cari jabatan..." style="width:100%" />
        <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">renderTag `+'NTag size small type info'+` — keyboard Space per item, group `+'NCheckboxGroup'+` di form</div>
      </div>
    `,
  }),
}
