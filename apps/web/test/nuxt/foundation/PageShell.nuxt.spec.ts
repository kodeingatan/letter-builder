import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PageShell from '~/components/layout/PageShell.vue'

describe('PageShell — AC-001 shell konsisten', () => {
  it('renders title and description', async () => {
    const wrapper = await mountSuspended(PageShell, {
      props: {
        title: 'Tabel Global',
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Data' },
          { label: 'Tabel Global' },
        ],
        description: 'Kelola struktur data',
      },
      slots: { default: '<div>content</div>' },
    })
    expect(wrapper.text()).toContain('Tabel Global')
    expect(wrapper.text()).toContain('Kelola struktur data')
  }, 30000)

  it('breadcrumb leaf is span with aria-current, others are links', async () => {
    const wrapper = await mountSuspended(PageShell, {
      props: {
        title: 'Test',
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leaf' },
        ],
      },
    })
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].attributes('href')).toBe('/dashboard')
    const spans = wrapper.findAll('span[aria-current="page"]')
    expect(spans.length).toBeGreaterThanOrEqual(1)
    expect(spans[0].text()).toContain('Leaf')
  }, 30000)

  it('renders actions slot', async () => {
    const wrapper = await mountSuspended(PageShell, {
      props: { title: 'Test', breadcrumbs: [] },
      slots: { actions: '<button>Buat</button>', default: 'body' },
    })
    expect(wrapper.text()).toContain('Buat')
    expect(wrapper.text()).toContain('body')
  }, 30000)

  it('has page-shell border and padding structure', async () => {
    const wrapper = await mountSuspended(PageShell, {
      props: { title: 'Test', breadcrumbs: [] },
    })
    expect(wrapper.find('.page-shell').exists()).toBe(true)
    expect(wrapper.find('.page-shell-head').exists()).toBe(true)
    expect(wrapper.find('.page-body').exists()).toBe(true)
  }, 30000)
})
