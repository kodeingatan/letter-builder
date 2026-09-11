# Mockup Tokens — Foundation Hi-Fi

> Exact tokens untuk implementasi Task 27. Sumber `docs/design-system.md` + `app/utils/naiveui-theme.ts`.

## Colors

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| primary | `#3B82F6` | Main brand, button, link, active sider, input focus | ✅ token |
| primaryHover | `#2563EB` | hover | ✅ |
| primaryPressed | `#1D4ED8` | active | ✅ |
| primary-50 | `#EFF6FF` | active bg sider, tag bg | ✅ |
| primary-100 | `#DBEAFE` | focus shadow | ✅ |
| primary-200 | `#BFDBFE` | active border | ✅ |
| error | `#EF4444` | NAlert error, validation | ✅ |
| errorHover | `#DC2626` | error hover | ✅ |
| success | `#22C55E` | success toast | ✅ |
| warning | `#F59E0B` | warning | ✅ |
| info | `#0EA5E9` | info | ✅ |
| gray-50 | `#F9FAFB` | body, sidebar bg | ✅ |
| gray-100 | `#F3F4F6` | hover, divider | ✅ |
| gray-200 | `#E5E7EB` | border default | ✅ |
| gray-300 | `#D1D5DB` | border muted | ✅ |
| gray-400 | `#9CA3AF` | detail-label, muted | ✅ |
| gray-500 | `#6B7280` | text3, muted | ✅ |
| gray-700 | `#374151` | text2 | ✅ |
| gray-800 | `#1F2937` | text1 | ✅ |
| card | `#FFFFFF` | card, modal | ✅ |
| Off-token removed | `indigo-500 #6366f1`, `indigo-600 #4F46E5`, `purple-500`, `blue-50→indigo-100` | — | ❌ replaced → token above |

## Typography

| Token | Size | Line | Weight | Usage |
|-------|------|------|--------|-------|
| Display | 32px | 40px | 700 | hero |
| H1 | 28px | 36px | 700 | page title |
| H2 | 24px | 32px | 700 | section |
| H3 | 20px | 28px | 600 | card title |
| Body | 14px | 20px | 400 | default |
| Small | 13px | 18px | 400 | input, table |
| Caption | 12px | 16px | 400 | muted |
| Label | 11px | 16px | 600 | detail-label uppercase |

Font: `Inter, ui-sans-serif, system-ui, sans-serif` via Google Fonts + naiveui-theme.ts `fontFamily`.

## Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| xs | 2px | — |
| sm | 4px | — |
| md | 8px | gap 8 |
| lg | 12px | — |
| xl | 16px | padding card/modal |
| 2xl | 24px | section gap |
| 3xl | 32px | page padding desktop |
| Card Padding | 12px | — |
| Form Gap | 12px | — |
| Section Gap | 20px | page shell |

Container padding: mobile 16px, tablet 24px, desktop 32px.

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | small button, tag |
| md | 6px | default (button, input, alert) |
| lg | 8px | card, sider |

## Dimensions

| Item | Value |
|------|-------|
| Sider width | 220px |
| Sider collapsed | 72px |
| Navbar height | 52px |
| Menu item height | 36px |
| Input height | 32px |
| Select height | 32px |
| Search min-width | 320px |
| Select width | 160px |
| Table row | 36px |
| Header | 40px |

## Icons

- Library: `@vicons/carbon`, wrapper `h(NIcon, null, {default:()=>h(Icon)})`, sizes 16px (menu/input) / 20px (card).
- Button icons: Login `Login`, Add `Add`, Edit `Edit`, Delete `TrashCan`, Search `Search`, Refresh `Restart`, Settings `Settings`, Close `Close`.
- Dokumen distinct: Components `Grid`/`DataTableIcon`, Templates `Document`, Administrations `Flow`/`Task`, Runs `Activity`, Documents `Report` — bukan 5× `Document`.

## Animation Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| Fast | 150ms | ease-out | hover, button scale, menu hover |
| Normal | 250ms | ease | page, card, alert slideDown |
| Slow | 350ms | ease-in-out | modal/drawer, toast |

Vue transitions: `.page-enter 250ms`, `.fade 250ms`, `.slide-up 250ms`, `.alert-enter 250ms`, `AccessDenied slideIn 300ms`.

## Naive UI Overrides (`naiveui-theme.ts`)

`common.primaryColor #3B82F6`, `primaryColorHover #2563EB`, `primaryColorPressed #1D4ED8`, `borderRadius 6px`, `borderRadiusSmall 4px`, fontFamily Inter, heights Tiny 28/Small 32/Medium 36/Large 40.
