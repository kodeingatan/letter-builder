import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { NButton, NAlert, NDataTable } from 'naive-ui'

const meta: Meta = {
  title: 'GlobalTable/ImportModal',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Import Modal — quoted-CSV preview (quote-aware parser) + width min(640px,90vw) preset card + partial per baris NDataTable max-height 240. Fix naive split(,) dan 640px fix.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof meta>

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  for (const line of lines) {
    const cols: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (c === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else cur += c
    }
    cols.push(cur.trim())
    rows.push(cols)
  }
  return rows
}

const sampleQuoted = 'nip,nama,alamat\n19801201,"Budi, S.T.","Jl. Merdeka No. 10, Jakarta"\n19801202,"Siti ""Aminah""",Jl. Sudirman'

export const PreviewQuoted: Story = {
  render: () => ({
    components: { NAlert },
    setup() {
      const rows = parseCsv(sampleQuoted)
      const head = rows[0]
      const body = rows.slice(1)
      return { head, body }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:400px">
        <div style="max-width:720px; margin:0 auto; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
          <div style="font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#6B7280">Preview — quote-aware (5 rows max)</div>
          <div style="border:1px solid #E5E7EB; border-radius:8px; overflow:hidden; margin-top:8px">
            <div style="display:flex; background:#F9FAFB; border-bottom:1px solid #E5E7EB; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#6B7280">
              <div v-for="h in head" :key="h" style="flex:1; padding:8px 10px">{{ h }}</div>
            </div>
            <div v-for="(r,i) in body" :key="i" style="display:flex; border-bottom:1px solid #F3F4F6; font-size:13px">
              <div v-for="(c,j) in r" :key="j" style="flex:1; padding:8px 10px">{{ c }}</div>
            </div>
          </div>
          <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">Parser quote-aware: <code>"Budi, S.T."</code> tetap 1 kolom, <code>""</code> → <code>"</code>, <code>,</code> dalam quote tidak split — fix naive <code>split(',')</code> {{ '<33>' }}</div>
          <div style="margin-top:12px; font-family:monospace; font-size:11px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:6px; padding:8px; line-height:1.6">{{ sampleQuoted }}</div>
        </div>
      </div>
    `,
  }),
}

export const PartialResult: Story = {
  render: () => ({
    components: { NAlert, NDataTable },
    setup() {
      const columns = [
        { title: 'CSV Row', key: 'row', width: 90 },
        { title: 'Reason', key: 'reason', ellipsis: { tooltip: true } },
      ]
      const data = [
        { row: 3, reason: 'NIP duplikat — 19801201' },
        { row: 7, reason: 'Header tak dikenal `unknown_col` — 422' },
      ]
      return { columns, data }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:720px; margin:0 auto">
          <NAlert type="warning" title="Partial success: 8 imported, 2 failed" style="margin-bottom:12px">
            See error table below for row numbers and reasons.
          </NAlert>
          <div style="background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:12px">
            <NDataTable :columns="columns" :data="data" size="small" :max-height="240" />
          </div>
          <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">ERR-03 — hasil partial per baris `row/reason` — `NDataTable max-height 240` — width `min(640px,90vw)` preset card — fix 640px fix + custom-request no-op</div>
        </div>
      </div>
    `,
  }),
}

export const FullFlow: Story = {
  render: () => ({
    components: { NButton, NAlert, NDataTable },
    setup() {
      const step = ref<'pick'|'preview'|'partial'>('pick')
      const rows = parseCsv(sampleQuoted)
      const head = rows[0]
      const body = rows.slice(1)
      const columns = [{ title: 'CSV Row', key: 'row', width: 90 }, { title: 'Reason', key: 'reason' }]
      const data = [{ row: 3, reason: 'NIP duplikat' }, { row: 7, reason: 'Header tak dikenal' }]
      const pick = () => step.value='preview'
      const doImport = () => step.value='partial'
      return { step, head, body, columns, data, pick, doImport }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:480px">
        <div style="max-width:720px; margin:0 auto; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
          <div style="font-weight:700">Import CSV — Pegawai</div>
          <div v-if="step==='pick'" style="margin-top:12px; text-align:center; padding:16px; border:1px dashed #E5E7EB; border-radius:8px">
            <NButton type="primary" @click="pick">Select CSV file (max 5MB)</NButton>
            <div style="font-size:11px; color:#6B7280; margin-top:8px">.csv only · ≤5MB · ≤5000 baris → 422</div>
          </div>
          <div v-else-if="step==='preview'" style="margin-top:12px">
            <div style="font-size:12px; color:#6B7280">pegawai.csv — 5 rows preview (quote-aware):</div>
            <div style="border:1px solid #E5E7EB; border-radius:8px; overflow:hidden; margin-top:6px">
              <div style="display:flex; background:#F9FAFB; font-size:11px; font-weight:700; color:#6B7280"><div v-for="h in head" :key="h" style="flex:1; padding:8px 10px">{{ h }}</div></div>
              <div v-for="(r,i) in body" :key="i" style="display:flex; font-size:13px; border-top:1px solid #F3F4F6"><div v-for="(c,j) in r" :key="j" style="flex:1; padding:8px 10px">{{ c }}</div></div>
            </div>
            <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px"><NButton @click="step='pick'">Tutup</NButton><NButton type="primary" @click="doImport">Import</NButton></div>
          </div>
          <div v-else style="margin-top:12px">
            <NAlert type="warning" title="Partial: 8 imported, 2 failed" />
            <NDataTable :columns="columns" :data="data" size="small" :max-height="240" style="margin-top:12px" />
            <div style="display:flex; justify-content:flex-end; margin-top:12px"><NButton @click="step='pick'">Tutup</NButton></div>
          </div>
        </div>
      </div>
    `,
  }),
}
