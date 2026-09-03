import type { GlobalThemeOverrides } from 'naive-ui'

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#3B82F6',
    primaryColorHover: '#2563EB',
    primaryColorPressed: '#1D4ED8',
    primaryColorSuppl: '#60A5FA',

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

    textColorBase: '#111827',
    textColor1: '#111827',
    textColor2: '#374151',
    textColor3: '#6B7280',

    bodyColor: '#F9FAFB',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    popoverColor: '#FFFFFF',
    tableColor: '#FFFFFF',
    inputColor: '#FFFFFF',

    borderColor: '#E5E7EB',
    dividerColor: '#F3F4F6',
    hoverColor: '#F3F4F6',

    borderRadius: '6px',
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
    borderRadiusMedium: '6px',
    borderRadiusSmall: '4px',
    borderRadiusLarge: '8px',
  },
  Input: {
    borderRadius: '6px',
  },
  Card: {
    borderRadius: '8px',
  },
}
