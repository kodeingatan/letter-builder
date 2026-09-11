<script setup lang="ts">
import { h, ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NLayoutFooter,
  NMenu,
  NAvatar,
  NButton,
  NIcon,
  NDropdown,
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  Grid,
  UserMultiple,
  User,
  Security,
  Rule,
  Document,
  ChevronDown,
  UserAvatar,
  Logout,
  Activity,
  Report,
  Settings,
  Restart,
  Task,
  DataTable as DataTableIcon,
} from '@vicons/carbon'
import { useNavigationStore } from '~/stores/navigation'
import { resolveMenuIcon } from '~/utils/navigation-icons'

const route = useRoute()
const authStore = useAuthStore()
const { hasAnyRole, hasPermission } = useAuthorization()
const settingsStore = useSettingsStore()
const navigationStore = useNavigationStore()
const collapsed = ref(false)

const user = computed(() => authStore.user)
const pageRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile()
  }
  if (authStore.isAuthenticated) {
    navigationStore.fetch().catch(() => {})
  }
  // Task 27 — activate usePageTransition (fadeInUp) on initial mount, tokenized 250ms
  if (import.meta.client) {
    try {
      const { usePageTransition } = await import('~/composables/usePageTransition')
      const { fadeInUp } = usePageTransition()
      // @ts-expect-error pageRef is HTMLElement
      if (pageRef.value) fadeInUp(pageRef.value)
    } catch {}
  }
})

watch(
  () => route.path,
  async () => {
    if (import.meta.client && pageRef.value) {
      try {
        const { usePageTransition } = await import('~/composables/usePageTransition')
        const { fadeInUp } = usePageTransition()
        // nextTick to ensure DOM updated
        await nextTick()
        fadeInUp(pageRef.value)
      } catch {}
    }
  },
)

async function refreshNavigation() {
  try {
    await navigationStore.refresh()
  } catch {}
}

function logout() {
  authStore.logout()
  navigateTo('/login')
}

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function renderMenuLabel(label: string, routePath: string) {
  return () =>
    h(
      'a',
      {
        href: routePath,
        onClick: (e: MouseEvent) => {
          e.preventDefault()
          navigateTo(routePath)
        },
        style: 'text-decoration: none; color: inherit;',
      },
      label,
    )
}

const isAdmin = computed(() => hasAnyRole(['Admin', 'Super Admin']))
const canManageTables = computed(
  () => isAdmin.value || hasPermission('Global Table Management'),
)
const canManageAdministrations = computed(
  () => isAdmin.value || hasPermission('Administration Management'),
)

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [
    {
      label: renderMenuLabel('Dashboard', '/dashboard'),
      key: 'dashboard',
      icon: renderIcon(Grid),
    },
  ]

  // Task 21 — Generated Data group: one entry per readable table.
  // Designers see the management link first; operators see entries only.
  // Hidden when empty, except a first-run hint for Designers.
  const dataChildren: MenuOption[] = []
  if (isAdmin.value) {
    dataChildren.push({
      label: renderMenuLabel('Global Tables', '/dashboard/data/global-tables'),
      key: 'global-tables',
      icon: renderIcon(DataTableIcon),
    })
  }
  for (const entry of navigationStore.dataEntries) {
    const path = `/dashboard/data/${entry.tableName}`
    dataChildren.push({
      label: renderMenuLabel(entry.label, path),
      key: `data-table-${entry.tableName}`,
      icon: renderIcon(resolveMenuIcon(entry.icon, DataTableIcon)),
    })
  }
  if (dataChildren.length === 0 && canManageTables.value) {
    dataChildren.push({
      label: 'No data tables yet — create one',
      key: 'data-empty-hint',
      disabled: true,
    })
  } else if (navigationStore.loading && !navigationStore.projection) {
    dataChildren.push({ label: 'Loading…', key: 'data-loading', disabled: true })
  }
  if (dataChildren.length > 0) {
    options.push({
      label: 'Data',
      key: 'data',
      icon: renderIcon(DataTableIcon),
      children: dataChildren,
    })
  }

  // Task 21 — Generated Persuratan group: one entry per runnable administration.
  const persuratanChildren: MenuOption[] = navigationStore.persuratanEntries.map((entry) => {
    const path = `/dashboard/docs/run/${entry.administrationId}`
    return {
      label: renderMenuLabel(entry.label, path),
      key: `persuratan-${entry.administrationId}`,
      icon: renderIcon(resolveMenuIcon(entry.icon, Document)),
    }
  })
  if (persuratanChildren.length === 0 && canManageAdministrations.value) {
    persuratanChildren.push({
      label: 'No published administrations yet',
      key: 'persuratan-empty-hint',
      disabled: true,
    })
  } else if (navigationStore.loading && !navigationStore.projection) {
    persuratanChildren.push({ label: 'Loading…', key: 'persuratan-loading', disabled: true })
  }
  if (persuratanChildren.length > 0) {
    options.push({
      label: 'Persuratan',
      key: 'persuratan',
      icon: renderIcon(Document),
      children: persuratanChildren,
    })
  }

  if (isAdmin.value) {
    options.push({
      label: 'Dokumen',
      key: 'dokumen',
      icon: renderIcon(Document),
      children: [
        {
          label: renderMenuLabel('Components', '/dashboard/docs/components'),
          key: 'components',
          icon: renderIcon(Grid),
        },
        {
          label: renderMenuLabel('Templates', '/dashboard/docs/templates'),
          key: 'templates',
          icon: renderIcon(Document),
        },
        {
          label: renderMenuLabel('Administrations', '/dashboard/docs/administrations'),
          key: 'administrations',
          icon: renderIcon(Task),
        },
        {
          label: renderMenuLabel('My Runs', '/dashboard/docs/runs'),
          key: 'runs',
          icon: renderIcon(Activity),
        },
        {
          label: renderMenuLabel('Documents', '/dashboard/docs/documents'),
          key: 'documents',
          icon: renderIcon(Report),
        },
      ],
    })

    options.push({
      label: 'User Management',
      key: 'user-management',
      icon: renderIcon(UserMultiple),
      children: [
        {
          label: renderMenuLabel('User', '/dashboard/users'),
          key: 'users',
          icon: renderIcon(User),
        },
        {
          label: renderMenuLabel('Guard', '/dashboard/guards'),
          key: 'guards',
          icon: renderIcon(Security),
        },
        {
          label: renderMenuLabel('Role', '/dashboard/roles'),
          key: 'roles',
          icon: renderIcon(Rule),
        },
        {
          label: renderMenuLabel('Permissions', '/dashboard/permissions'),
          key: 'permissions',
          icon: renderIcon(Document),
        },
      ],
    })

    options.push({
      label: 'Sistem',
      key: 'sistem',
      icon: renderIcon(Settings),
      children: [
        {
          label: renderMenuLabel('Activity Logs', '/dashboard/activity-logs'),
          key: 'activity-logs',
          icon: renderIcon(Activity),
        },
        {
          label: renderMenuLabel('System Logs', '/dashboard/system-logs'),
          key: 'system-logs',
          icon: renderIcon(Report),
        },
        {
          label: renderMenuLabel('Settings', '/dashboard/settings'),
          key: 'settings',
          icon: renderIcon(Settings),
        },
      ],
    })
  }

  return options
})

const routeKeyMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/data/global-tables': 'global-tables',
  '/dashboard/docs/components': 'components',
  '/dashboard/docs/templates': 'templates',
  '/dashboard/docs/administrations': 'administrations',
  '/dashboard/docs/runs': 'runs',
  '/dashboard/docs/documents': 'documents',
  '/dashboard/users': 'users',
  '/dashboard/guards': 'guards',
  '/dashboard/roles': 'roles',
  '/dashboard/permissions': 'permissions',
  '/dashboard/activity-logs': 'activity-logs',
  '/dashboard/system-logs': 'system-logs',
  '/dashboard/settings': 'settings',
}

const activeKey = ref('dashboard')

function resolveActiveKey(path: string): string {
  if (routeKeyMap[path]) return routeKeyMap[path]
  // Task 21 + Task 27 — generated entries + detail/dynamic routes highlight
  const dataMatch = path.match(/^\/dashboard\/data\/([^/]+)$/)
  if (dataMatch) return `data-table-${dataMatch[1]}`
  const runMatch = path.match(/^\/dashboard\/docs\/run\/(\d+)$/)
  if (runMatch) return `persuratan-${runMatch[1]}`
  if (path.startsWith('/dashboard/docs/runs/')) return 'runs'
  if (path.match(/^\/dashboard\/docs\/templates\/\d+$/)) return 'templates'
  if (path.match(/^\/dashboard\/docs\/administrations\/\d+$/)) return 'administrations'
  if (path.match(/^\/dashboard\/docs\/documents\/\d+$/)) return 'documents'
  if (path.startsWith('/dashboard/data/')) {
    const seg = path.split('/')[3]
    if (seg) return `data-table-${seg}`
  }
  return 'dashboard'
}

// Expose for unit testing
if (import.meta.vitest) {
  // @ts-expect-error expose for tests
  globalThis.__resolveActiveKey = resolveActiveKey
}

watch(
  () => route.path,
  (path) => {
    activeKey.value = resolveActiveKey(path)
    // Task 21 — poll-on-route-change freshness (server caches 30s).
    if (authStore.isAuthenticated) {
      navigationStore.fetch().catch(() => {})
    }
  },
  { immediate: true },
)

watch(
  () => route.path,
  async () => {
    if (import.meta.client && pageRef.value) {
      try {
        const { usePageTransition } = await import('~/composables/usePageTransition')
        const { fadeInUp } = usePageTransition()
        await nextTick()
        // @ts-expect-error pageRef is HTMLElement
        fadeInUp(pageRef.value)
      } catch {}
    }
  },
)

function handleMenuUpdate(key: string) {
  activeKey.value = key
}

const avatarLabel = computed(() => `${user.value?.firstName?.charAt(0) ?? ''}${user.value?.lastName?.charAt(0) ?? ''}`)

const dropdownOptions = [
  {
    key: 'profile',
    label: 'Profile',
    icon: renderIcon(UserAvatar),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    key: 'logout',
    label: 'Logout',
    icon: renderIcon(Logout),
  },
]

function handleDropdownSelect(key: string) {
  if (key === 'profile') {
    navigateTo('/dashboard/profile')
  } else if (key === 'logout') {
    logout()
  }
}
</script>

<template>
  <ClientOnly>
  <n-layout has-sider class="h-screen">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="72"
      :width="220"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="flex items-center justify-center h-14 font-bold text-lg" style="color: #3B82F6">
        <span v-if="!collapsed">{{ settingsStore.appName }}</span>
        <span v-else>{{ settingsStore.appName?.charAt(0) }}</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="72"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
      <div class="flex items-center justify-center py-3">
        <NButton
          quaternary
          size="small"
          :loading="navigationStore.loading"
          aria-label="Segarkan menu"
          :title="navigationStore.error ?? 'Segarkan menu'"
          @click="refreshNavigation"
        >
          <template #icon><NIcon><Restart /></NIcon></template>
          <span v-if="!collapsed">Segarkan menu</span>
        </NButton>
      </div>
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="h-14 flex items-center justify-end px-6">
        <n-dropdown
          :options="dropdownOptions"
          @select="handleDropdownSelect"
          trigger="click"
          placement="bottom-end"
        >
          <div class="user-menu">
            <n-avatar round :size="36" class="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] font-semibold text-sm shrink-0">
              {{ avatarLabel }}
            </n-avatar>
            <div class="flex flex-col text-left leading-tight">
              <span class="text-sm font-medium text-gray-800">{{ user?.firstName }}</span>
              <span class="text-xs text-gray-400">{{ user?.email }}</span>
            </div>
            <n-icon :size="16" class="text-gray-400 shrink-0">
              <ChevronDown />
            </n-icon>
          </div>
        </n-dropdown>
      </n-layout-header>
      <n-layout-content content-style="padding: 24px;" :native-scrollbar="false">
        <div ref="pageRef">
          <slot />
        </div>
      </n-layout-content>
      <n-layout-footer bordered class="h-12 flex items-center justify-center text-xs text-gray-400">
        &copy; 2026 {{ settingsStore.appName }}. All rights reserved.
      </n-layout-footer>
    </n-layout>
  </n-layout>
  </ClientOnly>
</template>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-menu:hover {
  background-color: #f3f4f6;
}
</style>
