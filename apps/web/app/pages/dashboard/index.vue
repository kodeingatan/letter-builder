<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NSpin,
  NCard,
  NGrid,
  NGi,
  NButton,
  NIcon,
  NList,
  NListItem,
  NThing,
  NAvatar,
} from 'naive-ui'
import { Grid, UserMultiple, Security, Rule, Document, Activity, Report, Settings } from '@vicons/carbon'
import DashboardHero from '~/components/features/dashboard/DashboardHero.vue'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'
import type { User } from '~/shared/types/user'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const authStore = useAuthStore()

const statsLoading = ref(true)
const totals = ref({ users: 0, roles: 0, permissions: 0, guards: 0 })
const recentUsers = ref<User[]>([])

const heroStats = computed(() => [
  { label: 'Users', value: statsLoading.value ? '…' : totals.value.users },
  { label: 'Roles', value: statsLoading.value ? '…' : totals.value.roles },
  { label: 'Permissions', value: statsLoading.value ? '…' : totals.value.permissions },
  { label: 'Guards', value: statsLoading.value ? '…' : totals.value.guards },
])

const todayLabel = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })
const heroTitle = computed(() =>
  authStore.user ? `Halo, ${authStore.user.firstName}!` : 'Dashboard'
)

function authHeaders() {
  return { Authorization: `Bearer ${authStore.token}` }
}

async function fetchSummary() {
  statsLoading.value = true
  try {
    const [usersRes, rolesRes, permsRes, guardsRes, recentRes] = await Promise.all([
      $fetch<any>('/api/users', { params: { page: 1, limit: 1 }, headers: authHeaders() }),
      $fetch<any>('/api/roles', { params: { page: 1, limit: 1 }, headers: authHeaders() }),
      $fetch<any>('/api/permissions', { params: { page: 1, limit: 1 }, headers: authHeaders() }),
      $fetch<any>('/api/guards', { params: { page: 1, limit: 1 }, headers: authHeaders() }),
      $fetch<any>('/api/users', { params: { page: 1, limit: 5, sortBy: 'id', sortOrder: 'DESC' }, headers: authHeaders() }),
    ])
    totals.value = {
      users: usersRes.total ?? 0,
      roles: rolesRes.total ?? 0,
      permissions: permsRes.total ?? 0,
      guards: guardsRes.total ?? 0,
    }
    recentUsers.value = recentRes.data ?? []
  } catch {
    // Hero tetap render (EC-01); stat fallback '…' → 0
    totals.value = { users: 0, roles: 0, permissions: 0, guards: 0 }
    recentUsers.value = []
  } finally {
    statsLoading.value = false
  }
}

function initials(u: User) {
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
}

onMounted(() => {
  fetchSummary()
})
</script>

<template>
  <NSpin :show="authStore.loading" class="w-full">
    <template #description>Memuat...</template>

    <div v-if="!authStore.loading && authStore.user">
      <PageShell
        title="Dashboard"
        :breadcrumbs="[{ label: 'Dashboard' }]"
        description="Ringkasan akses modul RBAC Anda"
      >
        <DashboardHero
          eyebrow="Ringkasan RBAC"
          :title="heroTitle"
          :subtitle="`Berikut ringkasan akun Anda — ${todayLabel}.`"
          :stats="heroStats"
          primary-label="Kelola User"
          secondary-label="Lihat Log"
          @primary="navigateTo('/dashboard/users')"
          @secondary="navigateTo('/dashboard/activity-logs')"
        />

        <!-- Profile + RBAC shortcuts -->
        <NGrid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" :collapsed-rows="2" class="mb-4">
          <NGi :span="1">
            <NCard title="Informasi Profil" size="small">
              <div class="detail-view">
                <div class="detail-field">
                  <span class="detail-label">Username</span>
                  <span class="detail-value detail-value--mono">{{ authStore.user?.username }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ authStore.user?.email }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Peran</span>
                  <span class="detail-value">{{ (authStore.user?.roles ?? []).map((r: any) => r.roleName).join(', ') || '—' }}</span>
                </div>
              </div>
            </NCard>
          </NGi>
          <NGi :span="2">
            <NCard title="Akses Cepat — RBAC" size="small">
              <p class="text-xs font-semibold mb-2" style="color: #374151; letter-spacing: .05em; text-transform: uppercase">User Management</p>
              <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" class="mb-4">
                <NGi>
                  <NButton block size="small" @click="navigateTo('/dashboard/users')">
                    <template #icon><NIcon><UserMultiple /></NIcon></template>
                    User
                  </NButton>
                </NGi>
                <NGi>
                  <NButton block size="small" @click="navigateTo('/dashboard/roles')">
                    <template #icon><NIcon><Rule /></NIcon></template>
                    Role
                  </NButton>
                </NGi>
                <NGi>
                  <NButton block size="small" @click="navigateTo('/dashboard/permissions')">
                    <template #icon><NIcon><Document /></NIcon></template>
                    Permission
                  </NButton>
                </NGi>
                <NGi>
                  <NButton block size="small" @click="navigateTo('/dashboard/guards')">
                    <template #icon><NIcon><Security /></NIcon></template>
                    Guard
                  </NButton>
                </NGi>
              </NGrid>
              <p class="text-xs font-semibold mb-2" style="color: #374151; letter-spacing: .05em; text-transform: uppercase">Sistem</p>
              <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
                <NGi>
                  <NButton block size="small" @click="navigateTo('/dashboard/activity-logs')">
                    <template #icon><NIcon><Activity /></NIcon></template>
                    Activity Logs
                  </NButton>
                </NGi>
                <NGi>
                  <NButton block size="small" @click="navigateTo('/dashboard/system-logs')">
                    <template #icon><NIcon><Report /></NIcon></template>
                    System Logs
                  </NButton>
                </NGi>
                <NGi>
                  <NButton block size="small" @click="navigateTo('/dashboard/settings')">
                    <template #icon><NIcon><Settings /></NIcon></template>
                    Settings
                  </NButton>
                </NGi>
              </NGrid>
            </NCard>
          </NGi>
        </NGrid>

        <!-- Recent users -->
        <NCard title="Pengguna Terbaru" size="small">
          <NSpin :show="statsLoading" description="Memuat...">
            <NList v-if="recentUsers.length" hoverable clickable>
              <NListItem
                v-for="u in recentUsers"
                :key="u.id"
                @click="navigateTo('/dashboard/users')"
              >
                <template #prefix>
                  <NAvatar round>{{ initials(u) }}</NAvatar>
                </template>
                <NThing :title="`${u.firstName} ${u.lastName}`" :description="u.email" />
                <template #suffix>
                  <BadgePill
                    v-if="u.roles?.length"
                    :label="u.roles[0].roleName ?? '—'"
                    type="primary"
                  />
                  <span v-else class="text-xs" style="color: #9aa0a6">—</span>
                </template>
              </NListItem>
            </NList>
            <p v-else-if="!statsLoading" class="text-sm" style="color: #6B7280">Belum ada user.</p>
            <div v-else style="min-height: 72px" />
          </NSpin>
        </NCard>
      </PageShell>
    </div>
  </NSpin>
</template>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
}
.detail-field {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.detail-field:last-child {
  border-bottom: none;
}
.detail-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 4px;
}
.detail-value {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.5;
  word-break: break-word;
}
.detail-value--mono {
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}
</style>
