# Naive UI Components

## Component Categories

### Data Components
| Component | Fungsi |
|-----------|--------|
| NDataTable | Tabel data dengan sorting, filtering, pagination |
| NTree | Tree view dengan checkboxes |
| NTreeSelect | Tree selection dropdown |
| NList | List view |
| NTag | Label/tag |
| NBadge | Badge/notifikasi |
| NAvatar | Avatar |
| NProgress | Progress bar |
| NStatistic | Statistik display |

### Form Components
| Component | Fungsi |
|-----------|--------|
| NForm | Form container dengan validation |
| NFormItem | Form field wrapper |
| NInput | Text input |
| NInputNumber | Number input |
| NSelect | Dropdown selection |
| NMultiSelect | Multiple selection |
| NCheckbox | Checkbox |
| NRadio | Radio button |
| NSwitch | Toggle switch |
| NSlider | Range slider |
| NRate | Star rating |
| NColorPicker | Color picker |
| NDatePicker | Date picker |
| NTimePicker | Time picker |
| NCascader | Cascading selection |
| NTransfer | Transfer list |
| NUpload | File upload |
| NDynamicInput | Dynamic form fields |
| NDynamicTags | Dynamic tags |

### Layout Components
| Component | Fungsi |
|-----------|--------|
| NLayout | Layout container |
| NLayoutHeader | Header layout |
| NLayoutSider | Sidebar layout |
| NLayoutContent | Content layout |
| NLayoutFooter | Footer layout |
| NGrid | Grid system |
| NGi | Grid item |
| NSpace | Spacing |
| NDivider | Divider |
| NCard | Card container |
| NThing | Content wrapper |

### Navigation Components
| Component | Fungsi |
|-----------|--------|
| NMenu | Navigation menu |
| NTabs | Tab navigation |
| NBreadcrumb | Breadcrumb navigation |
| NAnchor | Anchor navigation |
| NPagination | Pagination |
| NDrawer | Drawer overlay |
| NModal | Modal dialog |

### Feedback Components
| Component | Fungsi |
|-----------|--------|
| NDialog | Dialog/confirm |
| NMessage | Toast message |
| NNotification | Notification |
| NAlert | Alert banner |
| NPopconfirm | Popconfirm |
| NPopover | Popover |
| NTooltip | Tooltip |
| NDropdown | Dropdown menu |
| NSpin | Loading spinner |
| NResult | Result display |

### Typography Components
| Component | Fungsi |
|-----------|--------|
| NText | Text display |
| NP | Paragraph |
| NH1-NH6 | Headings |
| NBlockquote | Blockquote |
| NCode | Code display |
| NPre | Preformatted text |

## Component Patterns

### Controlled vs Uncontrolled

**Controlled**: State managed by parent
```vue
<script setup lang="ts">
const value = ref('')
</script>

<template>
  <n-input v-model:value="value" />
</template>
```

**Uncontrolled**: Component manages own state
```vue
<template>
  <n-input default-value="" />
</template>
```

### Slots

Kebanyakan component mendukung slots:

```vue
<template>
  <n-card>
    <template #header>
      Custom Header
    </template>
    <template #header-extra>
      Extra Content
    </template>
    <template #default>
      Card Content
    </template>
    <template #footer>
      Footer Content
    </template>
    <template #action>
      Action Buttons
    </template>
  </n-card>
</template>
```

### Events

Event handling dengan `on-` prefix:

```vue
<template>
  <n-input
    @update:value="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
  />
  
  <n-select
    @update:value="handleSelect"
    @update:show="handleShow"
  />
  
  <n-data-table
    @update:sorter="handleSort"
    @update:filters="handleFilter"
    @update:page="handlePage"
  />
</template>
```

### Virtual List

Semua data components mendukung virtual list secara default:

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="largeDataSet"
    :pagination="{ pageSize: 100 }"
    :virtual-scroll="true"
  />
</template>
```

## Best Practices

- Gunakan direct import untuk tree-shaking
- Manfaatkan TypeScript untuk type-safe props
- Gunakan controlled mode untuk complex state management
- Gunakan slots untuk custom rendering
- Manfaatkan virtual list untuk large datasets
- Gunakan component-specific theme overrides untuk styling
