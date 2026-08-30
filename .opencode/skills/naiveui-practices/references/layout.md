# Naive UI Layout

## Basic Layout

```vue
<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider
      bordered
      :collapsed="collapsed"
      :collapsed-width="64"
      :width="240"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <AppSidebar :collapsed="collapsed" />
    </n-layout-sider>
    
    <n-layout>
      <n-layout-header bordered style="height: 64px; padding: 0 24px">
        <AppHeader />
      </n-layout-header>
      
      <n-layout-content style="padding: 24px">
        <slot />
      </n-layout-content>
      
      <n-layout-footer bordered style="height: 64px; padding: 0 24px">
        <AppFooter />
      </n-layout-footer>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
const collapsed = ref(false)
</script>
```

## Layout Components

### NLayout

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| has-sider | `boolean` | `false` | Has sidebar |
| native-scrollbar | `boolean` | `true` | Use native scrollbar |
| position | `'static' \| 'absolute'` | `'static'` | Layout position |

### NLayoutSider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| bordered | `boolean` | `false` | Show border |
| collapsed | `boolean` | `false` | Collapsed state |
| collapsed-width | `number` | `48` | Width when collapsed |
| width | `number \| string` | `200` | Full width |
| show-trigger | `boolean` | `false` | Show collapse trigger |
| native-scrollbar | `boolean` | `true` | Use native scrollbar |
| position | `'static' \| 'absolute'` | `'static'` | Position |
| content-style | `string \| object` | - | Content style |

### NLayoutHeader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| bordered | `boolean` | `false` | Show border |
| inverted | `boolean` | `false` | Inverted theme |
| position | `'static' \| 'absolute'` | `'static'` | Position |
| native-scrollbar | `boolean` | `true` | Use native scrollbar |

### NLayoutContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| bordered | `boolean` | `false` | Show border |
| native-scrollbar | `boolean` | `true` | Use native scrollbar |
| position | `'static' \| 'absolute'` | `'static'` | Position |
| embedded | `boolean` | `false` | Embedded mode |

### NLayoutFooter

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| bordered | `boolean` | `false` | Show border |
| inverted | `boolean` | `false` | Inverted theme |
| position | `'static' \| 'absolute'` | `'static'` | Position |
| native-scrollbar | `boolean` | `true` | Use native scrollbar |

## Nested Layout

```vue
<template>
  <n-layout has-sider>
    <n-layout-sider bordered width="240">
      <AppSidebar />
    </n-layout-sider>
    
    <n-layout>
      <n-layout-header bordered height="64">
        <AppHeader />
      </n-layout-header>
      
      <n-layout has-sider style="height: calc(100vh - 64px)">
        <n-layout-sider bordered width="200" :native-scrollbar="false">
          <AppSubMenu />
        </n-layout-sider>
        
        <n-layout-content :native-scrollbar="false">
          <slot />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-layout>
</template>
```

## Absolute Positioning

```vue
<template>
  <n-layout position="absolute" style="top: 0; left: 0; right: 0; bottom: 0">
    <n-layout-header bordered position="absolute" style="height: 64px; z-index: 1">
      <AppHeader />
    </n-layout-header>
    
    <n-layout-content
      position="absolute"
      style="top: 64px; bottom: 0"
      :native-scrollbar="false"
    >
      <slot />
    </n-layout-content>
  </n-layout>
</template>
```

## Grid System

```vue
<template>
  <n-grid :cols="12" :x-gap="16" :y-gap="16">
    <n-gi :span="8">
      <n-card title="Main Content">
        <p>Content</p>
      </n-card>
    </n-gi>
    
    <n-gi :span="4">
      <n-card title="Sidebar">
        <p>Content</p>
      </n-card>
    </n-gi>
  </n-grid>
</template>
```

### Responsive Grid

```vue
<template>
  <n-grid
    :cols="12"
    :x-gap="16"
    :y-gap="16"
    item-responsive
  >
    <n-gi span="12 m:8 l:8">
      <n-card title="Content">
        <p>Responsive content</p>
      </n-card>
    </n-gi>
    
    <n-gi span="12 m:4 l:4">
      <n-card title="Sidebar">
        <p>Responsive sidebar</p>
      </n-card>
    </n-gi>
  </n-grid>
</template>
```

## Spacing

```vue
<template>
  <!-- Horizontal spacing -->
  <n-space horizontal>
    <n-button>Button 1</n-button>
    <n-button>Button 2</n-button>
    <n-button>Button 3</n-button>
  </n-space>
  
  <!-- Vertical spacing -->
  <n-space vertical>
    <n-card title="Card 1">Content</n-card>
    <n-card title="Card 2">Content</n-card>
    <n-card title="Card 3">Content</n-card>
  </n-space>
  
  <!-- Custom spacing -->
  <n-space :size="24" justify="space-between">
    <n-button>Left</n-button>
    <n-button>Right</n-button>
  </n-space>
</template>
```

## Divider

```vue
<template>
  <n-divider />
  <n-divider>With Text</n-divider>
  <n-divider title-placement="left">Left Aligned</n-divider>
  <n-divider title-placement="right">Right Aligned</n-divider>
  <n-divider :vertical="true" />
</template>
```

## Best Practices

- Gunakan `has-sider` untuk layout dengan sidebar
- Gunakan `position: absolute` untuk full-screen layout
- Gunakan `native-scrollbar: false` untuk custom scrollbar
- Gunakan `bordered` untuk visual separation
- Gunakan Grid system untuk responsive layouts
- Gunakan Space untuk consistent spacing
- Gunakan Divider untuk visual separation
