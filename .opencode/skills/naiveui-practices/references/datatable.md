# Naive UI DataTable

## Basic Usage

```vue
<script setup lang="ts">
import { h, ref } from 'vue'
import { NButton, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const data = ref([
  { id: 1, name: 'John', age: 28, email: 'john@example.com' },
  { id: 2, name: 'Jane', age: 32, email: 'jane@example.com' },
  { id: 3, name: 'Bob', age: 45, email: 'bob@example.com' },
])

const columns: DataTableColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Name', key: 'name', width: 150 },
  { title: 'Age', key: 'age', width: 100 },
  { title: 'Email', key: 'email' },
  {
    title: 'Actions',
    key: 'actions',
    width: 150,
    render(row) {
      return h(NSpace, null, () => [
        h(NButton, { size: 'small', onClick: () => handleEdit(row) }, () => 'Edit'),
        h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, () => 'Delete'),
      ])
    }
  }
]

function handleEdit(row: any) {
  console.log('Edit:', row)
}

function handleDelete(row: any) {
  console.log('Delete:', row)
}
</script>

<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :bordered="true"
    :single-line="false"
  />
</template>
```

## Column Configuration

### Basic Columns

```ts
const columns: DataTableColumns = [
  // Simple text column
  { title: 'Name', key: 'name' },
  
  // Fixed width
  { title: 'ID', key: 'id', width: 100 },
  
  // Align
  { title: 'Age', key: 'age', align: 'right' },
  
  // Sortable
  { title: 'Name', key: 'name', sorter: true },
  
  // Filterable
  { title: 'Status', key: 'status', filters: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]},
]
```

### Custom Render

```ts
const columns: DataTableColumns = [
  {
    title: 'Status',
    key: 'status',
    render(row) {
      return h(NTag, {
        type: row.status === 'active' ? 'success' : 'error',
      }, () => row.status)
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    render(row) {
      return h(NSpace, null, () => [
        h(NButton, {
          size: 'small',
          onClick: () => edit(row),
        }, () => 'Edit'),
      ])
    }
  }
]
```

## Pagination

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :pagination="pagination"
    :page-slot="7"
  />
</template>

<script setup lang="ts">
const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 100,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  prefix: ({ itemCount }: { itemCount: number }) => `Total ${itemCount} items`,
})
</script>
```

## Sorting

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :sorter="defaultSorter"
    @update:sorter="handleSorterChange"
  />
</template>

<script setup lang="ts">
const defaultSorter = ref({
  key: 'name',
  order: 'ascend',
})

function handleSorterChange(sorter: any) {
  console.log('Sorter:', sorter)
  // Apply sorting to data
}
</script>
```

## Filtering

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :filters="filters"
    @update:filters="handleFiltersChange"
  />
</template>

<script setup lang="ts">
const filters = ref({
  status: ['active'],
})

function handleFiltersChange(filters: any) {
  console.log('Filters:', filters)
  // Apply filters to data
}
</script>
```

## Selection

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :row-key="(row: any) => row.id"
    :checked-row-keys="checkedRowKeys"
    @update:checked-row-keys="handleCheck"
  />
</template>

<script setup lang="ts">
const checkedRowKeys = ref<number[]>([])

function handleCheck(keys: number[]) {
  checkedRowKeys.value = keys
}
</script>
```

## Virtual Scroll

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="largeData"
    :virtual-scroll="true"
    :max-height="400"
    :pagination="{ pageSize: 100 }"
  />
</template>
```

## Remote Data

```vue
<script setup lang="ts">
const data = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
})

async function fetchData() {
  loading.value = true
  try {
    const response = await $fetch('/api/users', {
      query: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
      }
    })
    data.value = response.data
    pagination.value.itemCount = response.total
  } finally {
    loading.value = false
  }
}

watch(() => pagination.value.page, fetchData)
watch(() => pagination.value.pageSize, fetchData)
</script>

<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :loading="loading"
    :pagination="pagination"
  />
</template>
```

## Best Practices

- Gunakan `row-key` untuk selection dan Identifikasi
- Gunakan `render` function untuk custom cell rendering
- Gunakan virtual scroll untuk large datasets (1000+ rows)
- Gunakan remote data untuk server-side pagination/sorting/filtering
- Definisikan columns di `<script setup>` untuk type safety
- Gunakan `NSpace` untuk action buttons di cells
