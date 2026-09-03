<script setup lang="ts">
import { watch, ref } from 'vue'
import {
  NDrawer, NDrawerContent,
  NTag, NButton, NSpace, NSpin,
} from 'naive-ui'
import { Edit } from '@vicons/carbon'
import type { User } from '~/shared/types/user'

const props = defineProps<{
  visible: boolean
  userId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', user: User): void
}>()

const user = ref<User | null>(null)
const loading = ref(false)

watch(() => props.visible, async (val) => {
  if (val && props.userId) {
    loading.value = true
    try {
      const data = await $fetch<User>(`/api/users/${props.userId}`)
      user.value = data
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }
})
</script>

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

.detail-value--text {
  font-weight: 400;
  color: #334155;
}

.detail-value--mono {
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}
</style>

<template>
  <NDrawer :show="visible" @update:show="(v) => emit('update:visible', v)" :width="400">
    <NDrawerContent title="User Detail">
      <NSpin :show="loading">
        <div v-if="user" class="detail-view">
          <div class="detail-field">
            <span class="detail-label">ID</span>
            <span class="detail-value">{{ user.id }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">First Name</span>
            <span class="detail-value">{{ user.firstName }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Last Name</span>
            <span class="detail-value">{{ user.lastName }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Username</span>
            <span class="detail-value detail-value--mono">{{ user.username }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ user.email }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Roles</span>
            <div class="detail-value">
              <NSpace :size="4">
                <NTag v-for="role in user.roles" :key="role.id" size="small" type="info" round>
                  {{ role.roleName }}
                </NTag>
              </NSpace>
            </div>
          </div>
          <div class="detail-field">
            <span class="detail-label">Created At</span>
            <span class="detail-value detail-value--mono">{{ new Date(user.createdAt).toLocaleString() }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Updated At</span>
            <span class="detail-value detail-value--mono">{{ new Date(user.updatedAt).toLocaleString() }}</span>
          </div>
        </div>
      </NSpin>
      <template #footer>
        <NSpace>
          <NButton type="primary" @click="user && emit('edit', user)">
            <template #icon><Edit /></template>
            Edit
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
