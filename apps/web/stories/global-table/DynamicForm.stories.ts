import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, h, computed } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NDatePicker, NUpload, NImage, NSpin, NButton, NIcon, NTag, NAlert } from 'naive-ui'
import { Upload, Add } from '@vicons/carbon'

const meta: Meta = {
  title: 'GlobalTable/DynamicForm',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'DynamicForm — per-type inputs (text/richtext/date/select/number/currency/relation/image/computed) + computed live `readonly` + upload NButton (fix span text-blue-500) + hidden filtered. Token #3B82F6.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof meta>

function bv(icon: any) { return () => h(NIcon, null, { default: () => h(icon) }) }

export const AllTypes: Story = {
  render: () => ({
    components: { NForm, NFormItem, NInput, NInputNumber, NSelect, NDatePicker, NUpload, NImage, NButton, NIcon, NTag },
    setup() {
      const harga = ref(5000000)
      const jumlah = ref(2)
      const live = computed(() => 'Rp ' + (harga.value * jumlah.value).toLocaleString('id-ID'))
      const uploading = ref(false)
      const foto = ref('')
      const onUpload = () => { uploading.value = true; setTimeout(()=> { uploading.value=false; foto.value='https://picsum.photos/200'; }, 800) }
      return { harga, jumlah, live, uploading, foto, onUpload, Upload }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:640px">
        <div style="max-width:900px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:16px">
          <div style="background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
            <div style="font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#94a3b8">Text / Richtext / Date / Select</div>
            <NForm label-placement="top" style="margin-top:12px">
              <NFormItem label="Nama Lengkap — NInput"><NInput placeholder="Nama lengkap" /></NFormItem>
              <NFormItem label="Deskripsi — NInput textarea 4 rows"><NInput type="textarea" :rows="4" placeholder="Deskripsi..." /></NFormItem>
              <div style="font-size:10px; color:#94a3b8; margin-top:-8px">↳ Editor penuh Task 35 — placeholder konsisten</div>
              <NFormItem label="Tanggal Lahir — NDatePicker"><NDatePicker type="datetime" placeholder="Pilih tanggal" style="width:100%" /></NFormItem>
              <NFormItem label="Jabatan — NSelect"><NSelect placeholder="Pilih Jabatan" :options="[{label:'Staf Ahli', value:1},{label:'Kabag', value:2}]" style="width:100%" /></NFormItem>
            </NForm>
          </div>
          <div style="background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
            <div style="font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#94a3b8">Number / Currency / Relation</div>
            <NForm label-placement="top" style="margin-top:12px">
              <NFormItem label="Harga — NInputNumber"><NInputNumber v-model:value="harga" style="width:100%" /></NFormItem>
              <NFormItem label="Total — NInputNumber prefix Rp"><NInputNumber v-model:value="harga" style="width:100%"><template #prefix>Rp</template></NInputNumber></NFormItem>
              <NFormItem label="Jabatan (relation) — RelationSelector"><NSelect placeholder="Cari jabatan..." :options="[{label:'Staf Ahli — 001', value:1}]" style="width:100%" /></NFormItem>
            </NForm>
          </div>
          <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:16px">
            <div style="font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#92400E">Image — NButton Upload (fix span text-blue-500)</div>
            <NForm label-placement="top" style="margin-top:12px">
              <NFormItem label="Foto — NInput URL + Upload"><NInput placeholder="https://…/foto.jpg" :value="foto" /></NFormItem>
            </NForm>
            <div style="display:flex; gap:8px; align-items:center; margin-top:8px">
              <NButton type="primary" ghost @click="onUpload"><template #icon><NIcon><Upload /></NIcon></template>Upload image</NButton>
              <NSpin :show="uploading" size="small" style="width:64px; height:64px; border:1px solid #E5E7EB; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#fff">
                <NImage v-if="foto && !uploading" :src="foto" width="64" style="border-radius:6px" />
                <span v-else-if="!uploading" style="font-size:11px; color:#9CA3AF">🖼 64</span>
              </NSpin>
            </div>
            <div style="font-size:10px; color:#6B7280; margin-top:6px">Fix DynamicForm.vue:163 span `text-blue-500 cursor-pointer` → `NButton primary ghost` + h(NIcon) + NImage preview — token #3B82F6, focusable</div>
          </div>
          <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:16px">
            <div style="font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#92400E">Computed readonly — LIVE (fix placeholder kosong)</div>
            <NForm label-placement="top" style="margin-top:12px">
              <NFormItem label="Gaji Total (computed) — live preview">
                <NInput :value="live" disabled style="background:#F9FAFB" />
                <template #feedback>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px"><NTag type="info" size="small">harga ✕</NTag><NTag type="info" size="small">jumlah ✕</NTag><NButton size="small" style="margin-left:auto">▶ Uji ekspresi</NButton></div>
                  <div style="font-size:10px; color:#6B7280; margin-top:4px">Watch harga/jumlah → 200ms debounce → POST /api/expressions/evaluate — server authoritative</div>
                </template>
              </NFormItem>
            </NForm>
            <NAlert type="info" style="margin-top:8px"><template #header>Hidden computed tetap hidden</template>Tidak ada input — `editableColumns` filter `type !== hidden-computed`.</NAlert>
          </div>
        </div>
        <div style="font-size:11px; color:#6B7280; margin-top:12px; border-left:2px solid #3B82F6; padding-left:8px; max-width:900px; margin-left:auto; margin-right:auto">AC-D03: upload button focusable + live computed ● live + hidden filtered + richtext placeholder Task35 konsisten.</div>
      </div>
    `,
  }),
}

export const ComputedLive: Story = {
  render: () => ({
    components: { NInput, NInputNumber, NTag, NButton, NAlert },
    setup() {
      const harga = ref(5000000)
      const jumlah = ref(2)
      const live = computed(() => harga.value * jumlah.value)
      return { harga, jumlah, live }
    },
    template: `
      <div style="padding:24px; max-width:520px; margin:0 auto; background:#fff; border:1px solid #E5E7EB; border-radius:8px">
        <div style="font-size:11px; font-weight:700; color:#92400E">COMPUTED LIVE — readonly-computed</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px">
          <div> <div style="font-size:12px; font-weight:600">Harga</div><NInputNumber v-model:value="harga" style="width:100%; margin-top:4px" /></div>
          <div> <div style="font-size:12px; font-weight:600">Jumlah</div><NInputNumber v-model:value="jumlah" style="width:100%; margin-top:4px" /></div>
        </div>
        <div style="margin-top:12px"><div style="font-size:12px; font-weight:600">Gaji Total — NInput disabled live</div><NInput :value="'Rp ' + live.toLocaleString('id-ID')" disabled style="margin-top:4px; background:#F9FAFB" /><div style="display:flex; gap:6px; margin-top:6px"><NTag size="small" type="info">harga</NTag><NTag size="small" type="info">jumlah</NTag><NButton size="small" style="margin-left:auto">▶ Uji ekspresi</NButton></div></div>
        <NAlert type="success" style="margin-top:12px"><template #header>Hasil live: {{ live.toLocaleString('id-ID') }}</template>Client recompute — server authoritative.</NAlert>
      </div>
    `,
  }),
}

export const UploadButton: Story = {
  render: () => ({
    components: { NButton, NIcon, NUpload, NImage, NSpin },
    setup() {
      const uploading = ref(false)
      const url = ref('')
      const upload = () => { uploading.value=true; setTimeout(()=> { uploading.value=false; url.value='https://picsum.photos/200'; }, 700) }
      return { uploading, url, upload, Upload }
    },
    template: `
      <div style="padding:24px; max-width:420px; margin:0 auto; background:#fff; border:1px solid #E5E7EB; border-radius:8px">
        <div style="font-size:12px; font-weight:600">Foto — Image Column</div>
        <div style="display:flex; gap:12px; align-items:center; margin-top:12px">
          <NButton type="primary" ghost @click="upload"><template #icon><NIcon><Upload /></NIcon></template>Upload image</NButton>
          <div style="width:80px; height:80px; border:1px solid #E5E7EB; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#F9FAFB">
            <NSpin v-if="uploading" size="small" />
            <NImage v-else-if="url" :src="url" width="80" />
            <span v-else style="font-size:11px; color:#9CA3AF">🖼 64</span>
          </div>
        </div>
        <div style="font-size:11px; color:#6B7280; margin-top:8px">Focus Tab → Space/Enter → upload + preview NImage — no span cursor-pointer.</div>
      </div>
    `,
  }),
}
