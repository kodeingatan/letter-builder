import type { GlobalThemeOverrides } from 'naive-ui'

// Notion-adapted tokens (adopsi 2026-09-13, sumber: DESIGN-notion.md):
// satu aksen struktural Notion blue, warm paper canvas, ink scale,
// hairline + micro-shadow, radius xs4/sm5/md8/lg12/xl16/full.
// Semantic ramp Tailwind dipertahankan (Notion tak punya semantic ramp).
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#0075de',
    primaryColorHover: '#0069c4',
    primaryColorPressed: '#005bab',
    primaryColorSuppl: '#62aef0',

    errorColor: '#EF4444',
    errorColorHover: '#DC2626',
    errorColorPressed: '#B91C1C',
    errorColorSuppl: '#F87171',

    warningColor: '#F59E0B',
    warningColorHover: '#D97706',
    warningColorPressed: '#B45309',
    warningColorSuppl: '#FBBF24',

    successColor: '#22C55E',
    successColorHover: '#16A34A',
    successColorPressed: '#15803D',
    successColorSuppl: '#4ADE80',

    infoColor: '#0EA5E9',
    infoColorHover: '#0284C7',
    infoColorPressed: '#0369A1',
    infoColorSuppl: '#38BDF8',

    textColorBase: '#000000',
    textColor1: '#000000',
    textColor2: '#31302e',
    textColor3: '#615d59',

    bodyColor: '#f6f5f4',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    popoverColor: '#FFFFFF',
    tableColor: '#FFFFFF',
    inputColor: '#FFFFFF',

    borderColor: '#e6e6e6',
    dividerColor: '#e6e6e6',
    hoverColor: '#f6f5f4',

    borderRadius: '8px',
    borderRadiusSmall: '4px',

    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
    fontSizeMini: '12px',
    fontSizeTiny: '12px',
    fontSizeSmall: '13px',
    fontSizeMedium: '14px',
    fontSizeLarge: '16px',
    fontSizeHuge: '18px',

    heightTiny: '28px',
    heightSmall: '32px',
    heightMedium: '36px',
    heightLarge: '40px',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '4px',
    borderRadiusLarge: '12px',
  },
  Input: {
    borderRadius: '4px',
  },
  Card: {
    borderRadius: '12px',
  },
}
