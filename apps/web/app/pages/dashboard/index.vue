<script setup lang="ts">
import {
  NSpin,
  NCard,
  NGrid,
  NGi,
  NButton,
  NEmpty,
  NIcon,
  NSpace,
} from 'naive-ui'
import { Grid, DataTable as DataTableIcon, Document, Task, Activity, Report, UserMultiple, UserRole, Security } from '@vicons/carbon'
import { useNavigationStore } from '~/stores/navigation'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const authStore = useAuthStore()
const navigationStore = useNavigationStore()
const { hasAnyRole } = useAuthorization()

const isAdmin = computed(() => hasAnyRole(['Admin', 'Super Admin']))

onMounted(() => {
  if (authStore.isAuthenticated) navigationStore.fetch().catch(() => {})
})

const hasAnyShortcut = computed(() =>
  navigationStore.dataEntries.length > 0 || navigationStore.persuratanEntries.length > 0 || isAdmin.value,
)

const dataShortcuts = computed(() => navigationStore.dataEntries.slice(0, 6))
const persuratanShortcuts = computed(() => navigationStore.persuratanEntries.slice(0, 6))
</script>

<template>
  <NSpin :show="authStore.loading" class="w-full">
    <template #description>Memuat...</template>

    <div v-if="!authStore.loading && authStore.user">
      <PageShell
        title="Dashboard"
        :breadcrumbs="[{ label: 'Dashboard' }]"
        description="Ringkasan akses modul Anda"
      >
        <template #actions>
          <NButton size="small" @click="navigationStore.refresh()" :loading="navigationStore.loading" aria-label="Segarkan menu">
            <template #icon><NIcon><DataTableIcon /></NIcon></template>
            Segarkan
          </NButton>
        </template>

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

        <!-- Profile quick -->
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
            <NCard title="Akses Cepat" size="small">
              <NSpin :show="navigationStore.loading && !navigationStore.projection">
              <!-- Data shortcuts -->
              <div v-if="dataShortcuts.length" class="mb-4">
                <p class="text-xs font-semibold mb-2" style="color: #374151; letter-spacing: .05em; text-transform: uppercase">Data</p>
                <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
                  <NGi v-for="entry in dataShortcuts" :key="entry.tableName">
                    <NButton block size="small" @click="navigateTo(`/dashboard/data/${entry.tableName}`)">
                      <template #icon><NIcon><DataTableIcon /></NIcon></template>
                      {{ entry.label }}
                    </NButton>
                  </NGi>
                  <NGi v-if="isAdmin">
                    <NButton block size="small" dashed @click="navigateTo('/dashboard/data/global-tables')">
                      <template #icon><NIcon><Grid /></NIcon></template>
                      Kelola Tabel
                    </NButton>
                  </NGi>
                </NGrid>
              </div>
              <!-- Persuratan -->
              <div v-if="persuratanShortcuts.length" class="mb-4">
                <p class="text-xs font-semibold mb-2" style="color: #374151; letter-spacing: .05em; text-transform: uppercase">Persuratan</p>
                <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
                  <NGi v-for="entry in persuratanShortcuts" :key="entry.administrationId">
                    <NButton block size="small" @click="navigateTo(`/dashboard/docs/run/${entry.administrationId}`)">
                      <template #icon><NIcon><Document /></NIcon></template>
                      {{ entry.label }}
                    </NButton>
                  </NGi>
                </NGrid>
              </div>
              <!-- Dokumen statis (admin) -->
              <div v-if="isAdmin">
                <p class="text-xs font-semibold mb-2" style="color: #374151; letter-spacing: .05em; text-transform: uppercase">Dokumen</p>
                <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
                  <NGi>
                    <NButton block size="small" @click="navigateTo('/dashboard/docs/components')">
                      <template #icon><NIcon><Grid /></NIcon></template>
                      Komponen
                    </NButton>
                  </NGi>
                  <NGi>
                    <NButton block size="small" @click="navigateTo('/dashboard/docs/templates')">
                      <template #icon><NIcon><Document /></NIcon></template>
                      Templat
                    </NButton>
                  </NGi>
                  <NGi>
                    <NButton block size="small" @click="navigateTo('/dashboard/docs/administrations')">
                      <template #icon><NIcon><Task /></NIcon></template>
                      Administrasi
                    </NButton>
                  </NGi>
                  <NGi>
                    <NButton block size="small" @click="navigateTo('/dashboard/docs/runs')">
                      <template #icon><NIcon><Activity /></NIcon></template>
                      Proses Saya
                    </NButton>
                  </NGi>
                  <NGi>
                    <NButton block size="small" @click="navigateTo('/dashboard/docs/documents')">
                      <template #icon><NIcon><Report /></NIcon></template>
                      Dokumen
                    </NButton>
                  </NGi>
                  <NGi>
                    <NButton block size="small" @click="navigateTo('/dashboard/users')">
                      <template #icon><NIcon><UserMultiple /></NIcon></template>
                      Pengguna
                    </NButton>
                  </NGi>
                </NGrid>
              </div>

              <!-- Empty state EC-01 -->
              <NEmpty
                v-if="!hasAnyShortcut"
                description="Belum ada akses — hubungi admin untuk meminta akses"
                style="padding: 24px 0"
              >
                <template #extra>
                  <NButton size="small" type="primary" @click="navigateTo('/dashboard/profile')">Buka Profil</NButton>
                </template>
              </NEmpty>
              <NEmpty
                v-else-if="dataShortcuts.length === 0 && persuratanShortcuts.length === 0 && !isAdmin"
                description="Belum ada modul yang tersedia untuk peran Anda"
                style="padding: 16px 0"
              />
              </NSpin>
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
