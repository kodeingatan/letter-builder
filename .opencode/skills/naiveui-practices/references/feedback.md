# Naive UI Feedback Components

## Dialog

### Basic Usage

```vue
<script setup lang="ts">
import { useDialog } from 'naive-ui'

const dialog = useDialog()

function showDialog() {
  dialog.warning({
    title: 'Confirm',
    content: 'Are you sure?',
    positiveText: 'Yes',
    negativeText: 'No',
    onPositiveClick: () => {
      // Handle confirm
    },
    onNegativeClick: () => {
      // Handle cancel
    },
  })
}
</script>

<template>
  <n-button @click="showDialog">Show Dialog</n-button>
</template>
```

### Dialog Options

| Option | Type | Description |
|--------|------|-------------|
| title | `string` | Dialog title |
| content | `string` | Dialog content |
| positiveText | `string` | Positive button text |
| negativeText | `string` | Negative button text |
| onPositiveClick | `() => void \| Promise<boolean>` | Positive button handler |
| onNegativeClick | `() => void \| Promise<boolean>` | Negative button handler |
| onMaskClick | `() => void` | Mask click handler |
| onEsc | `() => void` | ESC key handler |
| type | `'info' \| 'success' \| 'warning' \| 'error' \| 'info'` | Dialog type |
| icon | `() => VNode` | Custom icon |
| loading | `boolean` | Show loading state |
| closable | `boolean` | Show close button |
| maskClosable | `boolean` | Close on mask click |

## Message

### Basic Usage

```vue
<script setup lang="ts">
import { useMessage } from 'naive-ui'

const message = useMessage()

function showMessage() {
  message.success('Operation successful!')
  message.error('Something went wrong!')
  message.warning('Warning message')
  message.info('Info message')
  message.loading('Loading...')
}

function showMessageWithDuration() {
  message.success('Success!', { duration: 5000 })
}

function showMessageWithClosable() {
  message.info('Closable message', { closable: true })
}
</script>

<template>
  <n-button @click="showMessage">Show Message</n-button>
</template>
```

### Message Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| duration | `number` | `3000` | Duration in ms |
| closable | `boolean` | `false` | Show close button |
| keepAliveOnHover | `boolean` | `false` | Keep alive on hover |

## Notification

### Basic Usage

```vue
<script setup lang="ts">
import { useNotification } from 'naive-ui'

const notification = useNotification()

function showNotification() {
  notification.success({
    title: 'Success',
    content: 'Operation completed successfully!',
    duration: 5000,
  })
}

function showNotificationWithAction() {
  notification.info({
    title: 'New Update',
    content: 'A new version is available.',
    action: {
      label: 'Update',
      onClick: () => {
        // Handle update
      },
    },
  })
}
</script>

<template>
  <n-button @click="showNotification">Show Notification</n-button>
</template>
```

### Notification Options

| Option | Type | Description |
|--------|------|-------------|
| title | `string` | Notification title |
| content | `string` | Notification content |
| type | `'info' \| 'success' \| 'warning' \| 'error'` | Notification type |
| duration | `number` | Duration in ms |
| action | `{ label: string, onClick: () => void }` | Action button |
| closable | `boolean` | Show close button |
| onClose | `() => void` | Close callback |

## Alert

```vue
<template>
  <n-alert title="Info" type="info">
    This is an info alert.
  </n-alert>
  
  <n-alert title="Success" type="success">
    Operation successful!
  </n-alert>
  
  <n-alert title="Warning" type="warning" closable>
    Warning message.
  </n-alert>
  
  <n-alert title="Error" type="error">
    Something went wrong.
  </n-alert>
  
  <n-alert title="With Icon" type="info" show-icon>
    Alert with icon.
  </n-alert>
  
  <n-alert title="With Action" type="info">
    <template #action>
      <n-button size="small" type="primary">Action</n-button>
    </template>
    Alert with action button.
  </n-alert>
</template>
```

## Popconfirm

```vue
<template>
  <n-popconfirm @positive-click="handleConfirm">
    <template #trigger>
      <n-button>Delete</n-button>
    </template>
    Are you sure you want to delete this item?
  </n-popconfirm>
  
  <n-popconfirm
    positive-text="Yes"
    negative-text="No"
    @positive-click="handleConfirm"
    @negative-click="handleCancel"
  >
    <template #trigger>
      <n-button type="warning">Confirm Action</n-button>
    </template>
    Do you want to proceed?
  </n-popconfirm>
</template>
```

## Loading

### Spin

```vue
<template>
  <n-spin :show="loading">
    <n-card title="Content">
      <p>This content will be covered by spinner when loading.</p>
    </n-card>
  </n-spin>
  
  <n-spin size="small" />
  <n-spin size="medium" />
  <n-spin size="large" />
</template>
```

### Loading Bar

```vue
<script setup lang="ts">
import { useLoadingBar } from 'naive-ui'

const loadingBar = useLoadingBar()

function startLoading() {
  loadingBar.start()
  setTimeout(() => {
    loadingBar.finish()
  }, 2000)
}
</script>

<template>
  <n-button @click="startLoading">Start Loading</n-button>
</template>
```

## Result

```vue
<template>
  <n-result status="success" title="Success" description="Operation completed">
    <template #footer>
      <n-button type="primary">Go Back</n-button>
    </template>
  </n-result>
  
  <n-result status="error" title="Error" description="Something went wrong" />
  <n-result status="warning" title="Warning" description="Please check" />
  <n-result status="info" title="Info" description="Please note" />
  <n-result status="404" title="Not Found" description="Page not found" />
</template>
```

## Best Practices

- Gunakan `useDialog` untuk confirmation dialogs
- Gunakan `useMessage` untuk simple toast messages
- Gunakan `useNotification` untuk persistent notifications
- Gunakan `NAlert` untuk inline alerts
- Gunakan `NPopconfirm` untuk quick confirmations
- Gunakan `NSpin` untuk loading states
- Gunakan `NResult` for result pages (success, error, 404)
- Set appropriate `duration` untuk message/notification
- Gunakan `closable` untuk messages yang user bisa dismiss
