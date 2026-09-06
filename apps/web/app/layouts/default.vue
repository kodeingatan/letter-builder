<script setup lang="ts">
import { h, ref, computed, watch, onMounted } from 'vue'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NLayoutFooter,
  NMenu,
  NAvatar,
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
  DataTable as DataTableIcon,
} from '@vicons/carbon'

const route = useRoute()
const authStore = useAuthStore()
const { hasAnyRole } = useAuthorization()
const settingsStore = useSettingsStore()
const collapsed = ref(false)

const user = computed(() => authStore.user)

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile()
  }
})

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

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [
    {
      label: renderMenuLabel('Dashboard', '/dashboard'),
      key: 'dashboard',
      icon: renderIcon(Grid),
    },
  ]

  if (hasAnyRole(['Admin', 'Super Admin'])) {
    options.push({
      label: 'Data',
      key: 'data',
      icon: renderIcon(DataTableIcon),
      children: [
        {
          label: renderMenuLabel('Global Tables', '/dashboard/data/global-tables'),
          key: 'global-tables',
          icon: renderIcon(DataTableIcon),
        },
      ],
    })

    options.push({
      label: 'Dokumen',
      key: 'dokumen',
      icon: renderIcon(Document),
      children: [
        {
          label: renderMenuLabel('Components', '/dashboard/docs/components'),
          key: 'components',
          icon: renderIcon(Document),
        },
        {
          label: renderMenuLabel('Templates', '/dashboard/docs/templates'),
          key: 'templates',
          icon: renderIcon(Document),
        },
        {
          label: renderMenuLabel('Administrations', '/dashboard/docs/administrations'),
          key: 'administrations',
          icon: renderIcon(Document),
        },
        {
          label: renderMenuLabel('My Runs', '/dashboard/docs/runs'),
          key: 'runs',
          icon: renderIcon(Document),
        },
        {
          label: renderMenuLabel('Documents', '/dashboard/docs/documents'),
          key: 'documents',
          icon: renderIcon(Document),
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

watch(
  () => route.path,
  (path) => {
    activeKey.value = routeKeyMap[path] || 'dashboard'
  },
  { immediate: true },
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
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="flex items-center justify-center h-14 font-bold text-lg text-indigo-500">
        <span v-if="!collapsed">{{ settingsStore.appName }}</span>
        <span v-else>{{ settingsStore.appName?.charAt(0) }}</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
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
            <n-avatar round :size="36" class="bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold text-sm shrink-0">
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
        <slot />
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
