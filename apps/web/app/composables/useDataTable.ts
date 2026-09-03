import { ref, watch } from 'vue'

export interface UseDataTableOptions {
  fetchFn: () => Promise<void>
  defaultSortBy?: string
  defaultSortOrder?: 'ASC' | 'DESC'
  defaultLimit?: number
  searchDebounce?: number
}

export function useDataTable(options: UseDataTableOptions) {
  const {
    fetchFn,
    defaultSortBy = 'id',
    defaultSortOrder = 'DESC',
    searchDebounce = 300,
  } = options

  const searchText = ref('')
  const searchField = ref('')
  const sortBy = ref(defaultSortBy)
  const sortOrder = ref<'ASC' | 'DESC'>(defaultSortOrder)
  const visibleColumns = ref<string[]>([])

  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  function handleSearch(value: string) {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchText.value = value
    }, searchDebounce)
  }

  function handleSearchFieldChange(field: string) {
    searchField.value = field
  }

  function handleSorterChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
    if (!sorter.order) {
      sortBy.value = defaultSortBy
      sortOrder.value = defaultSortOrder
    } else {
      sortBy.value = sorter.columnKey
      sortOrder.value = sorter.order === 'ascend' ? 'ASC' : 'DESC'
    }
  }

  function toggleColumn(key: string) {
    const idx = visibleColumns.value.indexOf(key)
    if (idx === -1) {
      visibleColumns.value.push(key)
    } else {
      visibleColumns.value.splice(idx, 1)
    }
  }

  function resetFilters() {
    searchText.value = ''
    searchField.value = ''
    sortBy.value = defaultSortBy
    sortOrder.value = defaultSortOrder
  }

  watch(searchText, () => {
    fetchFn()
  })

  watch(searchField, () => {
    fetchFn()
  })

  return {
    searchText,
    searchField,
    sortBy,
    sortOrder,
    visibleColumns,
    handleSearch,
    handleSearchFieldChange,
    handleSorterChange,
    toggleColumn,
    resetFilters,
  }
}
