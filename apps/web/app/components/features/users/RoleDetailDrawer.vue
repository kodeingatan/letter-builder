<script setup lang="ts">
import { watch, ref } from 'vue'
import {
  NDrawer, NDrawerContent,
  NTag, NButton, NSpace, NSpin,
} from 'naive-ui'
import { Edit } from '@vicons/carbon'
import type { Role } from '~/shared/types/role'

const props = defineProps<{
  visible: boolean
  roleId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', role: Role): void
}>()

const role = ref<Role | null>(null)
const loading = ref(false)

watch(() => props.visible, async (val) => {
  if (val && props.roleId) {
    loading.value = true
    try {
      const data = await $fetch<Role>(`/api/roles/${props.roleId}`, {
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      role.value = data
    } catch {
      role.value = null
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
    <NDrawerContent title="Role Detail">
      <NSpin :show="loading">
        <div v-if="role" class="detail-view">
          <div class="detail-field">
            <span class="detail-label">ID</span>
            <span class="detail-value">{{ role.id }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Role Name</span>
            <span class="detail-value">{{ role.roleName }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Description</span>
            <span class="detail-value detail-value--text">{{ role.description || '-' }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Guards</span>
            <div class="detail-value">
              <NSpace :size="4">
                <NTag v-for="g in role.guards" :key="g.id" size="small" type="warning" round>
                  {{ g.guardName }}
                </NTag>
              </NSpace>
            </div>
          </div>
          <div class="detail-field">
            <span class="detail-label">Permissions</span>
            <div class="detail-value">
              <NSpace :size="4">
                <NTag v-for="p in role.permissions" :key="p.id" size="small" type="info" round>
                  {{ p.permissionName }}
                </NTag>
              </NSpace>
            </div>
          </div>
          <div class="detail-field">
            <span class="detail-label">Created At</span>
            <span class="detail-value detail-value--mono">{{ new Date(role.createdAt).toLocaleString() }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Updated At</span>
            <span class="detail-value detail-value--mono">{{ new Date(role.updatedAt).toLocaleString() }}</span>
          </div>
        </div>
      </NSpin>
      <template #footer>
        <NSpace>
          <NButton type="primary" @click="role && emit('edit', role)">
            <template #icon><Edit /></template>
            Edit
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
