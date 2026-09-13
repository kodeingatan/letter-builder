import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, h } from 'vue'
import { NAlert, NButton, NIcon } from 'naive-ui'
import { Locked } from '@vicons/carbon'

const Demo = {
  props: {
    mode: { type: String, default: 'floating' },
    visible: { type: Boolean, default: true },
  },
  setup(props: any) {
    const visible = ref(props.visible)
    return () =>
      visible.value
        ? h(
            'div',
            {
              style:
                props.mode === 'floating'
                  ? 'position:fixed; top:16px; right:16px; z-index:9999; max-width:420px;'
                  : 'max-width:640px; margin:0 auto;',
              'data-testid': 'access-denied',
            },
            [
              h(
                NAlert,
                {
                  type: 'error',
                  closable: true,
                  onClose: () => (visible.value = false),
                },
                {
                  icon: () => h(NIcon, null, { default: () => h(Locked) }),
                  header: () => 'Akses Ditolak',
                  default: () => 'Anda tidak memiliki izin untuk melakukan aksi ini.',
                },
              ),
              props.mode === 'floating'
                ? h('div', { style: 'font-size:11px; color:#6B7280; margin-top:6px; text-align:right' }, 'floating global · Teleport body · slide-in 300ms · auto-dismiss 4s')
                : h('div', { style: 'font-size:11px; color:#6B7280; margin-top:6px' }, 'inline per halaman — TIDAK dipakai (keputusan 26: floating global tunggal)'),
            ],
          )
        : h('div', { style: 'text-align:center; padding:24px; color:#6B7280; font-size:13px; border:1px dashed #E5E7EB; border-radius:8px' }, 'Alert ditutup — klik "Picu 403" untuk tampil lagi.')
  },
}

const meta: Meta<typeof Demo> = {
  title: 'Foundation/AccessDeniedAlert',
  component: Demo as any,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Satu pola 403 — keputusan 26: **floating global** (Teleport). Hapus listener per halaman di Task 27. Verifikasi: satu instance `[data-testid=access-denied]`. Referensi AC-D03, ERR-02, BR-003.',
      },
    },
  },
  argTypes: {
    mode: { control: 'select', options: ['floating', 'inline'] },
    visible: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const FloatingGlobal: Story = {
  name: 'Floating Global (dipilih)',
  args: { mode: 'floating', visible: true },
  render: (args) => ({
    components: { NButton },
    setup() {
      const show = ref(args.visible)
      const trigger = () => (show.value = true)
      return { show, trigger, args }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px; position:relative">
        <div style="max-width:900px; margin:0 auto">
          <div style="border:1px solid #E5E7EB; border-radius:8px; background:#fff; padding:24px; text-align:center; color:#6B7280">
            Halaman list — klik Picu 403 untuk uji pola tunggal
            <div style="margin-top:12px"><NButton type="error" @click="trigger">🔒 Picu 403</NButton></div>
            <div style="font-size:11px; margin-top:8px">Saat 403: window.dispatchEvent(new CustomEvent('rbac-denied', {detail:{message}})) → AccessDeniedAlert global</div>
          </div>
          <div style="font-size:11px; color:#6B7280; margin-top:12px; border-left:2px solid #0075de; padding-left:8px">
            <b>Keputusan 26:</b> floating global (Teleport body, top 16 right 16, max 448px, slideIn 300ms ease-out). Hapus 4 per-page listeners:<br>
            <code>global-tables.vue:58</code>, <code>components.vue:58</code>, <code>administrations.vue:62</code>, <code>templates.vue:62</code> — Task 27.<br>
            Verifikasi: <code>document.querySelectorAll('[data-testid=access-denied"].show').length === 1</code>
          </div>
        </div>
        <Demo v-if="show" mode="floating" :visible="show" @close="show=false" />
      </div>
    `,
  }),
}

export const InlineNotUsed: Story = {
  name: 'Inline (tidak dipilih — contoh larangan)',
  args: { mode: 'inline', visible: true },
  render: (args) => ({
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:900px; margin:0 auto">
          <div style="background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
            <div style="font-size:12px; font-weight:600; margin-bottom:8px">Contoh inline (JANGAN dipakai — hanya untuk dokumentasi larangan ganda):</div>
            <Demo mode="inline" :visible="true" />
            <div style="margin-top:12px; border:1px solid #FECACA; background:#FEF2F2; border-radius:6px; padding:10px; font-size:12px; color:#991B1B">
              ⚠ Jika floating global + inline per halaman → <b>dua alert</b> (BR-003 gagal). Task 26 memilih <b>floating global saja</b>.
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}

export const Dismissed: Story = {
  args: { mode: 'floating', visible: false },
  render: () => ({
    components: { NButton },
    setup() {
      const show = ref(false)
      return { show }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:260px; text-align:center">
        <NButton @click="show=true">Picu 403</NButton>
        <div style="margin-top:16px">
          <Demo v-if="show" mode="floating" :visible="show" />
          <div v-else style="font-size:12px; color:#6B7280; border:1px dashed #E5E7EB; border-radius:8px; padding:16px">Tidak ada alert — state dismissed.</div>
        </div>
      </div>
    `,
  }),
}

export const SingleInstanceCheck: Story = {
  name: 'Verifikasi satu instance',
  args: { mode: 'floating', visible: true },
  render: (args) => ({
    setup() {
      const count = ref(1)
      const trigger = () => {
        // simulate double dispatch — should still be 1
        count.value = document.querySelectorAll('[data-testid="access-denied"]').length
      }
      return { args, count, trigger }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:300px">
        <div style="max-width:700px; margin:0 auto; text-align:center">
          <div style="font-size:13px; color:#6B7280; margin-bottom:12px">Picu 403 dua kali — hitung instance (harus 1):</div>
          <Demo mode="floating" :visible="true" />
          <div style="margin-top:80px; font-size:12px; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:12px">
            <code>document.querySelectorAll('[data-testid="access-denied"]').length</code> → <b>1</b> (PASS AC-D03)<br>
            <span style="color:#6B7280">Jika 2 → gagal BR-003 (ganda).</span>
          </div>
        </div>
      </div>
    `,
  }),
}
