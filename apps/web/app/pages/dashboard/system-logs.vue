<template>
  <PageShell title="Log Sistem" :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Log Sistem' }]" description="Lihat dan telusuri log sistem — filter, cari, statistik.">
    <n-card title="System Logs">
      <template #header-extra>
        <n-space>
          <n-select
            v-model:value="selectedFile"
            placeholder="Select log file"
            :options="fileOptions"
            style="width: 300px"
            @update:value="handleFileChange"
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

      <!-- Statistics Bar -->
      <div v-if="statCounts" class="flex items-center gap-3 flex-wrap mb-4">
        <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
          <span class="text-sm text-gray-500">Total</span>
          <span class="text-sm font-semibold text-gray-800">{{ statCounts.total }}</span>
        </div>
        <div class="h-4 w-px bg-gray-200"></div>
        <div
          v-for="item in levelStats"
          :key="item.level"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
          :style="{ backgroundColor: item.bgColor, color: item.textColor }"
        >
          <span class="inline-block w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: item.dotColor }"></span>
          {{ item.level }}
          <span class="font-bold">{{ item.count }}</span>
        </div>
      </div>

      <!-- DataTable -->
      <DataTable
        :columns="columns"
        :data="logEntries"
        :loading="loading"
        :page="page"
        :limit="limit"
        :total="total"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        search-placeholder="Search system logs..."
        :searchable-fields="searchableFields"
        @search="handleSearch"
        @search-field-change="handleSearchField"
        @update:page="handlePageChange"
        @update:limit="handleLimitChange"
        @sort-change="handleSortChange"
      >
        <template #toolbar>
          <n-button @click="handleRefresh" :loading="loading">
            Refresh
          </n-button>
        </template>
      </DataTable>
    </n-card>

    <!-- Log Detail Drawer -->
    <LogDetailDrawer
      v-model:visible="showDetail"
      :entry="selectedEntry"
    />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import { NTag, NSpace, NSelect, NButton } from 'naive-ui';
import { LogDetailDrawer, LogLevelBadge } from '~/components/features/logging';
import type { LogEntry, SystemLogFile, SystemLogStats } from '~/shared/types/system-log';

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

useAuthStore()

const files = ref<SystemLogFile[]>([]);
const selectedFile = ref<string | null>(null);
const logEntries = ref<LogEntry[]>([]);
const stats = ref<SystemLogStats | null>(null);
const loading = ref(false);
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const search = ref('');
const searchField = ref('');
const sortBy = ref('timestamp');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');
const filterLevel = ref<string | null>(null);

// Detail drawer
const showDetail = ref(false);
const selectedEntry = ref<LogEntry | null>(null);

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Message', value: 'message' },
  { label: 'Context', value: 'context' },
  { label: 'Level', value: 'level' },
];

const levelOptions = [
  { label: 'TRACE', value: 'TRACE' },
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'NOTICE', value: 'NOTICE' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'CRITICAL', value: 'CRITICAL' },
  { label: 'FATAL', value: 'FATAL' },
  { label: 'EMERGENCY', value: 'EMERGENCY' },
];

const fileOptions = computed(() =>
  files.value.map((f) => ({
    label: `${f.filename} (${(f.size / 1024).toFixed(1)} KB)`,
    value: f.filename,
  })),
);

const columns = computed(() => [
  { title: 'Timestamp', key: 'timestamp', width: 200, sortable: true },
  {
    title: 'Level',
    key: 'level',
    width: 100,
    sortable: true,
    render(row: LogEntry) {
      return h(LogLevelBadge, { level: row.level, size: 'small' });
    },
  },
  { title: 'Context', key: 'context', width: 150, sortable: true },
  { title: 'Message', key: 'message', ellipsis: { tooltip: true } },
  {
    title: 'Actions',
    key: 'actions',
    width: 80,
    render(row: LogEntry) {
      return h(
        NTag,
        {
          size: 'small',
          style: 'cursor: pointer',
          onClick: () => {
            selectedEntry.value = row;
            showDetail.value = true;
          },
        },
        { default: () => 'View' },
      );
    },
  },
]);

const statCounts = computed(() => {
  if (!stats.value) return null;
  return {
    total: stats.value.total,
    TRACE: stats.value.byLevel['TRACE'] || 0,
    DEBUG: stats.value.byLevel['DEBUG'] || 0,
    INFO: stats.value.byLevel['INFO'] || 0,
    NOTICE: stats.value.byLevel['NOTICE'] || 0,
    WARNING: stats.value.byLevel['WARNING'] || 0,
    ERROR: stats.value.byLevel['ERROR'] || 0,
    CRITICAL: stats.value.byLevel['CRITICAL'] || 0,
    FATAL: stats.value.byLevel['FATAL'] || 0,
    EMERGENCY: stats.value.byLevel['EMERGENCY'] || 0,
  };
});

const levelStats = computed(() => {
  if (!statCounts.value) return [];
  const config: Record<string, { bgColor: string; textColor: string; dotColor: string }> = {
    TRACE: { bgColor: '#f3f4f6', textColor: '#6b7280', dotColor: '#9ca3af' },
    DEBUG: { bgColor: '#eff6ff', textColor: '#2563eb', dotColor: '#60a5fa' },
    INFO: { bgColor: '#ecfdf5', textColor: '#059669', dotColor: '#34d399' },
    NOTICE: { bgColor: '#f0f9ff', textColor: '#0284c7', dotColor: '#38bdf8' },
    WARNING: { bgColor: '#fffbeb', textColor: '#d97706', dotColor: '#fbbf24' },
    ERROR: { bgColor: '#fef2f2', textColor: '#dc2626', dotColor: '#f87171' },
    CRITICAL: { bgColor: '#fef2f2', textColor: '#b91c1c', dotColor: '#ef4444' },
    FATAL: { bgColor: '#fef2f2', textColor: '#991b1b', dotColor: '#dc2626' },
    EMERGENCY: { bgColor: '#fef2f2', textColor: '#7f1d1d', dotColor: '#b91c1c' },
  };
  const levels = ['TRACE', 'DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'FATAL', 'EMERGENCY'];
  return levels.map((level) => ({
    level,
    count: (statCounts.value as Record<string, number>)[level] || 0,
    ...config[level],
  }));
});

const fetchFiles = async () => {
  try {
    const response = await $fetch<any>('/api/system-logs/files');
    files.value = response.data;
    if (files.value.length > 0 && !selectedFile.value) {
      selectedFile.value = files.value[0].filename;
      fetchContent();
    }
  } catch (error) {
    console.error('Failed to fetch log files:', error);
  }
};

const fetchContent = async () => {
  if (!selectedFile.value) return;

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
    if (filterLevel.value) params.level = filterLevel.value;

    const [contentRes, statsRes] = await Promise.all([
      $fetch<any>(`/api/system-logs/files/${selectedFile.value}`, { params }),
      $fetch<any>(`/api/system-logs/stats/${selectedFile.value}`),
    ]);

    logEntries.value = contentRes.data.lines;
    total.value = contentRes.data.total;
    stats.value = statsRes.data;
  } catch (error) {
    console.error('Failed to fetch log content:', error);
  } finally {
    loading.value = false;
  }
};

function handleFileChange() {
  page.value = 1;
  fetchContent();
}

function handleFilter() {
  page.value = 1;
  fetchContent();
}

function handleSearch(value: string) {
  search.value = value;
  page.value = 1;
  fetchContent();
}

function handleSearchField(field: string) {
  searchField.value = field;
  page.value = 1;
  fetchContent();
}

function handlePageChange(p: number) {
  page.value = p;
  fetchContent();
}

function handleLimitChange(l: number) {
  limit.value = l;
  page.value = 1;
  fetchContent();
}

function handleSortChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  if (!sorter.order) {
    sortBy.value = 'timestamp';
    sortOrder.value = 'DESC';
  } else {
    sortBy.value = sorter.columnKey;
    sortOrder.value = sorter.order === 'ascend' ? 'ASC' : 'DESC';
  }
  page.value = 1;
  fetchContent();
}

function handleRefresh() {
  fetchContent();
}

onMounted(() => {
  fetchFiles();
});
</script>
