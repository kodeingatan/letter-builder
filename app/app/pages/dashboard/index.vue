<script setup lang="ts">
import {
  NSpin,
  NCard,
  NButton,
  NGrid,
  NGi,
  NSpace,
  NIcon,
} from 'naive-ui'
import { UserMultiple, UserRole, Document, Security } from '@vicons/carbon'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const authStore = useAuthStore()

</script>

<template>
  <NSpin :show="authStore.loading" class="w-full">
    <template #description>Loading...</template>

    <div v-if="!authStore.loading && authStore.user">
      <NCard title="Dashboard" class="mb-4">
        <template #header-extra>
          Welcome back!
        </template>
        <h2 class="text-xl font-semibold mb-2">
          Hello, {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}!
        </h2>
        <p class="text-gray-500">Here's your account overview.</p>
      </NCard>

      <NGrid :cols="2" :x-gap="16" :y-gap="16">
        <NGi>
          <NCard title="Profile Information">
            <div class="detail-view">
              <div class="detail-field">
                <span class="detail-label">Username</span>
                <span class="detail-value detail-value--mono">{{ authStore.user?.username }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ authStore.user?.email }}</span>
              </div>
            </div>
          </NCard>
        </NGi>
        <NGi>
          <NCard title="Quick Actions">
            <NSpace vertical>
              <NButton
                type="primary"
                block
                @click="navigateTo('/dashboard/users')"
              >
                <template #icon>
                  <NIcon><UserMultiple /></NIcon>
                </template>
                Manage Users
              </NButton>
              <NButton
                type="info"
                block
                @click="navigateTo('/dashboard/roles')"
              >
                <template #icon>
                  <NIcon><UserRole /></NIcon>
                </template>
                Manage Roles
              </NButton>
              <NButton
                type="warning"
                block
                @click="navigateTo('/dashboard/permissions')"
              >
                <template #icon>
                  <NIcon><Document /></NIcon>
                </template>
                Manage Permissions
              </NButton>
              <NButton
                type="success"
                block
                @click="navigateTo('/dashboard/guards')"
              >
                <template #icon>
                  <NIcon><Security /></NIcon>
                </template>
                Manage Guards
              </NButton>
            </NSpace>
          </NCard>
        </NGi>
      </NGrid>
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
