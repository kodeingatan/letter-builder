# Naive UI Theming System

## Theme Architecture

Naive UI menggunakan hierarchical theme system:
- **Common variables**: warna, spacing, font
- **Component-specific variables**: style per component
- **Nested ConfigProvider**: theme inheritance

## Built-in Themes

### Light Theme (default)
```ts
import { lightTheme } from 'naive-ui'
```

### Dark Theme
```ts
import { darkTheme } from 'naive-ui'
```

## ConfigProvider

Central point untuk theme dan configuration:

```vue
<script setup lang="ts">
import { NConfigProvider, darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
  },
  Button: {
    textColor: '#333',
  }
}
</script>

<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <App />
  </n-config-provider>
</template>
```

## Theme Customization

### Global Theme Overrides

```ts
const themeOverrides: GlobalThemeOverrides = {
  common: {
    // Warna utama
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
    primaryColorSuppl: '#36ad6a',
    
    // Warna status
    infoColor: '#2080f0',
    successColor: '#18a058',
    warningColor: '#f0a020',
    errorColor: '#d03050',
    
    // Typography
    fontFamily: 'v-sans, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    
    // Border radius
    borderRadius: '4px',
    
    // Spacing
    paddingSmall: '0 8px',
    paddingMedium: '0 12px',
    paddingLarge: '0 16px',
  },
  
  // Component-specific overrides
  Button: {
    textColor: '#333',
    colorPrimary: '#18a058',
    borderRadiusMedium: '4px',
  },
  
  Card: {
    borderRadius: '8px',
    paddingMedium: '16px',
  }
}
```

### Component-Specific Overrides

Setiap component bisa di-override secara individual:

```ts
const themeOverrides: GlobalThemeOverrides = {
  Input: {
    borderRadius: '8px',
    color: '#f5f5f5',
    borderHover: '1px solid #18a058',
  },
  
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '8px',
      }
    }
  },
  
  DataTable: {
    borderRadius: '8px',
    thColor: '#fafafa',
  }
}
```

## Theme Inheritance

Nested ConfigProvider untuk theme berbeda di area berbeda:

```vue
<template>
  <n-config-provider :theme-overrides="globalOverrides">
    <!-- Global theme -->
    <AppHeader />
    
    <!-- Theme berbeda untuk sidebar -->
    <n-config-provider :theme-overrides="sidebarOverrides">
      <AppSidebar />
    </n-config-provider>
    
    <!-- Theme berbeda untuk content -->
    <n-config-provider :theme-overrides="contentOverrides">
      <AppContent />
    </n-config-provider>
  </n-config-provider>
</template>
```

## Dark Mode

Toggle dark mode dengan reactive theme:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'

const isDark = ref(false)
const theme = computed(() => isDark.value ? darkTheme : null)

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
  }
}
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-button @click="isDark = !isDark">
      Toggle Dark Mode
    </n-button>
  </n-config-provider>
</template>
```

## Performance Optimization

### Inline Theme Disabled

Untuk SSR atau devtools yang lebih bersih:

```vue
<n-config-provider :inline-theme-disabled="true">
  <App />
</n-config-provider>
```

### CSS Variables

Theme variables di-mount sebagai CSS variables untuk efficient updates.

## Best Practices

- Definisikan theme overrides di file terpisah
- Gunakan TypeScript untuk type-safe theme
- Gunakan nested ConfigProvider untuk theme sections berbeda
- Manfaatkan `inlineThemeDisabled` untuk SSR
- Test theme di light dan dark mode
- Gunakan CSS variables untuk custom styling
