<template>
  <div>
    <n-alert type="info" style="margin-bottom: 12px">
      Nilai PII (email, telepon, alamat, NIK, dsb.) disensor pada metadata audit — hanya nama kolom + ID yang tersimpan.
    </n-alert>
    <n-card title="Activity Logs">
      <template #header-extra>
        <n-space>
          <n-select
            v-model:value="filterAction"
            placeholder="Action"
            clearable
            :options="actionOptions"
            style="width: 150px"
            @update:value="handleFilter"
          />
          <n-select
            v-model:value="filterEntity"
            placeholder="Entity"
            clearable
            :options="entityOptions"
            style="width: 150px"
            @update:value="handleFilter"
          />
          <n-select
            v-model:value="filterLevel"
            placeholder="Level"
            clearable
            :options="levelOptions"
            style="width: 120px"
            @update:value="handleFilter"
          />
        </n-space>
      </template>

      <DataTable
        :columns="columns"
        :data="logs"
        :loading="loading"
        :page="page"
        :limit="limit"
        :total="total"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        search-placeholder="Cari log aktivitas..."
        :searchable-fields="searchableFields"
        @update:page="handlePageChange"
        @update:limit="handleLimitChange"
        @search="handleSearch"
        @search-field-change="handleSearchField"
        @sort-change="handleSortChange"
      />
    </n-card>

    <n-drawer v-model:show="showDetail" :width="480" placement="right">
      <n-drawer-content title="Activity Log Detail">
        <template v-if="selectedLog">
          <div class="detail-view">
            <div class="detail-field">
              <span class="detail-label">ID</span>
              <span class="detail-value">{{ selectedLog.id }}</span>
            </div>

            <div class="detail-field">
              <span class="detail-label">User</span>
              <span class="detail-value">
                {{ selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'System' }}
              </span>
            </div>

            <div class="detail-field">
              <span class="detail-label">Action</span>
              <span class="detail-value">
                <n-tag :type="getActionType(selectedLog.action)" size="small" round>{{ selectedLog.action }}</n-tag>
              </span>
            </div>

            <div class="detail-field">
              <span class="detail-label">Entity</span>
              <span class="detail-value">
                <n-tag size="small" round>{{ selectedLog.entity }}</n-tag>
              </span>
            </div>

            <div class="detail-field">
              <span class="detail-label">Entity ID</span>
              <span class="detail-value">{{ selectedLog.entityId ?? '-' }}</span>
            </div>

            <div class="detail-field">
              <span class="detail-label">Level</span>
              <span class="detail-value">
                <n-tag :type="getLevelType(selectedLog.level)" size="small" round>{{ selectedLog.level }}</n-tag>
              </span>
            </div>

            <div class="detail-field">
              <span class="detail-label">Description</span>
              <span class="detail-value detail-value--text">{{ selectedLog.description ?? '-' }}</span>
            </div>

            <div class="detail-field">
              <span class="detail-label">IP Address</span>
              <span class="detail-value detail-value--mono">{{ selectedLog.ipAddress ?? '-' }}</span>
            </div>

            <div class="detail-field">
              <span class="detail-label">User Agent</span>
              <span class="detail-value detail-value--text detail-value--mono">{{ selectedLog.userAgent ?? '-' }}</span>
            </div>

            <div class="detail-field" v-if="selectedLog.metadata">
              <span class="detail-label">Metadata</span>
              <div class="detail-value detail-value--code">
                <pre>{{ formatMetadata(selectedLog.metadata) }}</pre>
              </div>
            </div>

            <div class="detail-field">
              <span class="detail-label">Created At</span>
              <span class="detail-value detail-value--mono">{{ selectedLog.createdAt }}</span>
            </div>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NTag, NSpace, NSelect, NCard, NDrawer, NDrawerContent, NAlert } from 'naive-ui';
import type { ActivityLog } from '~/shared/types/activity-log';

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

useAuthStore()

const logs = ref<ActivityLog[]>([]);
const loading = ref(false);
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const search = ref('');
const searchField = ref('');
const sortBy = ref('id');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');
const filterAction = ref<string | null>(null);
const filterEntity = ref<string | null>(null);
const filterLevel = ref<string | null>(null);
const showDetail = ref(false);
const selectedLog = ref<ActivityLog | null>(null);

const searchableFields = [
  { label: 'Semua Kolom', value: '' },
  { label: 'Description', value: 'description' },
  { label: 'Username', value: 'user.username' },
  { label: 'First Name', value: 'user.firstName' },
  { label: 'Last Name', value: 'user.lastName' },
];

const actionOptions = [
  { label: 'CREATE', value: 'CREATE' },
  { label: 'UPDATE', value: 'UPDATE' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'LOGIN', value: 'LOGIN' },
  { label: 'LOGOUT', value: 'LOGOUT' },
];

const entityOptions = [
  { label: 'User', value: 'User' },
  { label: 'Role', value: 'Role' },
  { label: 'Permission', value: 'Permission' },
  { label: 'Guard', value: 'Guard' },
  { label: 'Auth', value: 'Auth' },
  { label: 'Settings', value: 'Settings' },
];

const levelOptions = [
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' },
];

const getActionType = (action: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'error',
    LOGIN: 'info',
    LOGOUT: 'default',
  };
  return map[action] || 'default';
};

const getLevelType = (level: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
  };
  return map[level] || 'default';
};

const formatMetadata = (metadata: string) => {
  try {
    return JSON.stringify(JSON.parse(metadata), null, 2);
  } catch {
    return metadata;
  }
};

const columns = [
  { title: 'ID', key: 'id', width: 60, sortable: true },
  {
    title: 'User',
    key: 'user',
    render(row: ActivityLog) {
      if (row.user) {
        return h('span', `${row.user.firstName} ${row.user.lastName}`);
      }
      return h('span', { style: { color: '#999' } }, 'System');
    },
  },
  {
    title: 'Action',
    key: 'action',
    width: 100,
    render(row: ActivityLog) {
      return h(NTag, { type: getActionType(row.action), size: 'small' }, { default: () => row.action });
    },
  },
  {
    title: 'Entity',
    key: 'entity',
    width: 100,
    render(row: ActivityLog) {
      return h(NTag, { size: 'small' }, { default: () => row.entity });
    },
  },
  { title: 'Description', key: 'description', ellipsis: { tooltip: true } },
  {
    title: 'Level',
    key: 'level',
    width: 80,
    render(row: ActivityLog) {
      return h(NTag, { type: getLevelType(row.level), size: 'small' }, { default: () => row.level });
    },
  },
  { title: 'Created At', key: 'createdAt', width: 180, sortable: true },
  {
    title: 'Actions',
    key: 'actions',
    width: 80,
    render(row: ActivityLog) {
      return h(
        NTag,
        {
          size: 'small',
          style: 'cursor: pointer',
          onClick: () => {
            selectedLog.value = row;
            showDetail.value = true;
          },
        },
        { default: () => 'View' },
      );
    },
  },
];

const fetchLogs = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      limit: limit.value,
    };
    if (search.value) params.search = search.value;
    if (searchField.value) params.searchField = searchField.value;
    if (sortBy.value) params.sortBy = sortBy.value;
    if (sortOrder.value) params.sortOrder = sortOrder.value;
    if (filterAction.value) params.action = filterAction.value;
    if (filterEntity.value) params.entity = filterEntity.value;
    if (filterLevel.value) params.level = filterLevel.value;

    const response = await $fetch<any>('/api/activity-logs', { params });
    logs.value = response.data.data;
    total.value = response.data.total;
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (p: number) => {
  page.value = p;
  fetchLogs();
};

const handleLimitChange = (l: number) => {
  limit.value = l;
  page.value = 1;
  fetchLogs();
};

const handleSearch = (value: string) => {
  search.value = value;
  page.value = 1;
  fetchLogs();
};

const handleSearchField = (field: string) => {
  searchField.value = field;
  page.value = 1;
  fetchLogs();
};

const handleSortChange = (sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) => {
  if (!sorter.order) {
    sortBy.value = 'id';
    sortOrder.value = 'DESC';
  } else {
    sortBy.value = sorter.columnKey;
    sortOrder.value = sorter.order === 'ascend' ? 'ASC' : 'DESC';
  }
  page.value = 1;
  fetchLogs();
};

const handleFilter = () => {
  page.value = 1;
  fetchLogs();
};

onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.detail-value--code {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-top: 2px;
}

.detail-value--code pre {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
