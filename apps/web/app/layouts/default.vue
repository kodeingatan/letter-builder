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
  Table,
} from '@vicons/carbon'

const route = useRoute()
const authStore = useAuthStore()
const { hasAnyRole } = useAuthorization()
const settingsStore = useSettingsStore()
const collapsed = ref(false)

const user = computed(() => authStore.user)
const pageRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile()
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

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [
    {
      label: renderMenuLabel('Dashboard', '/dashboard'),
      key: 'dashboard',
      icon: renderIcon(Grid),
    },
  ]

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
    label: 'Master Data',
    key: 'master-data',
    icon: renderIcon(Table),
    children: [
      {
        label: renderMenuLabel('Definisi Tabel', '/dashboard/master-data'),
        key: 'master-data-list',
        icon: renderIcon(Table),
      },
    ],
  })

  options.push({
    label: 'Persuratan',
    key: 'persuratan',
    icon: renderIcon(Document),
    children: [
      {
        label: renderMenuLabel('Component', '/dashboard/components'),
        key: 'components',
        icon: renderIcon(Document),
      },
      {
        label: renderMenuLabel('Template', '/dashboard/templates'),
        key: 'templates',
        icon: renderIcon(Document),
      },
      {
        label: renderMenuLabel('Administrasi', '/dashboard/administrations'),
        key: 'administrations',
        icon: renderIcon(Document),
      },
      {
        label: renderMenuLabel('Dokumen', '/dashboard/documents'),
        key: 'documents',
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

  return options
})

const routeKeyMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/users': 'users',
  '/dashboard/guards': 'guards',
  '/dashboard/roles': 'roles',
  '/dashboard/permissions': 'permissions',
  '/dashboard/activity-logs': 'activity-logs',
  '/dashboard/system-logs': 'system-logs',
  '/dashboard/settings': 'settings',
  '/dashboard/master-data': 'master-data-list',
  '/dashboard/master-data/create': 'master-data-list',
  '/dashboard/components': 'components',
  '/dashboard/templates': 'templates',
  '/dashboard/administrations': 'administrations',
  '/dashboard/documents': 'documents',
}

const activeKey = ref('dashboard')

function resolveActiveKey(path: string): string {
  if (routeKeyMap[path]) return routeKeyMap[path]
  // Master Data per-table browse/edit routes highlight the parent menu.
  if (path.startsWith('/dashboard/master-data/')) return 'master-data-list'
  // Template builder + per-letter wizard highlight their parents.
  if (path.startsWith('/dashboard/templates/')) return 'templates'
  if (path.startsWith('/dashboard/documents/')) return 'documents'
  // RBAC-Only — no dynamic data/:table or docs/* routes (removed Task 01)
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
      <div class="flex items-center justify-center h-14 font-bold text-lg" style="color: #0075de">
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
            <n-avatar round :size="36" class="bg-gradient-to-r from-[#0075de] to-[#005bab] font-semibold text-sm shrink-0">
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
  background-color: #f6f5f4;
}

/* App-Shell Row pattern (Notion): active row = primary indicator bar + soft tint.
   Naive UI menandai item aktif dengan .n-menu-item-content--selected. */
:deep(.n-menu-item-content--selected) {
  background-color: #e8f2fd !important;
  border-radius: 5px;
  position: relative;
}
:deep(.n-menu-item-content--selected::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 9999px;
  background-color: #0075de;
}
:deep(.n-menu-item) {
  border-radius: 5px;
  margin: 1px 8px;
}
</style>
