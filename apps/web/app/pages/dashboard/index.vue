<script setup lang="ts">
import {
  NSpin,
  NCard,
  NGrid,
  NGi,
  NButton,
  NIcon,
} from 'naive-ui'
import { Grid, UserMultiple, Security, Rule, Document, Activity, Report, Settings } from '@vicons/carbon'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const authStore = useAuthStore()
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
        <!-- Greeting card -->
        <NCard class="mb-4">
          <template #header>
            <span class="text-sm font-semibold" style="color: #1F2937">Selamat Datang Kembali</span>
          </template>
          <template #header-extra>
            <span class="text-xs" style="color: #6B7280">{{ new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }) }}</span>
          </template>
          <h2 class="text-xl font-semibold mb-2" style="color: #1F2937">
            Halo, {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}!
          </h2>
          <p class="text-sm" style="color: #6B7280">Berikut ringkasan akun Anda.</p>
        </NCard>

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
