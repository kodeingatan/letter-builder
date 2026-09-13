import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoginPage from '~/pages/login.vue'
import RegisterPage from '~/pages/register.vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Auth locale + a11y — FR-006 / AC-006', () => {
  it('login page has ID autocomplete email/current-password via file check', async () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/login.vue'), 'utf8')
    expect(content).toContain('autocomplete="email"')
    expect(content).toContain('autocomplete="current-password"')
    expect(content).toContain('text-[#0075de]')
    expect(content).not.toContain('text-indigo-600')
    expect(content).toContain('aria-hidden="true"')
    const wrapper = await mountSuspended(LoginPage as any, {})
    expect(wrapper.html()).toContain('autocomplete="email"')
  })

  it('register page has ID autocomplete given-name/family-name/username/new-password', async () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/register.vue'), 'utf8')
    expect(content).toContain('autocomplete="given-name"')
    expect(content).toContain('autocomplete="family-name"')
    expect(content).toContain('autocomplete="username"')
    expect(content).toContain('autocomplete="new-password"')
    expect(content).toContain('text-[#0075de]')
    expect(content).not.toContain('text-indigo-600')

    const wrapper = await mountSuspended(RegisterPage as any, {})
    expect(wrapper.html()).toContain('autocomplete="given-name"')
  })

  it('auth keyframes tokenized 250ms not 0.4s', async () => {
    const appDir = join(process.cwd(), 'app')
    const loginContent = readFileSync(join(appDir, 'pages/login.vue'), 'utf8')
    expect(loginContent).toContain('250ms')
    expect(loginContent).not.toContain('0.4s ease-out')
    const authLayout = readFileSync(join(appDir, 'layouts/auth.vue'), 'utf8')
    expect(authLayout).toContain('350ms')
    expect(authLayout).toContain('prefers-reduced-motion')
  })
})
