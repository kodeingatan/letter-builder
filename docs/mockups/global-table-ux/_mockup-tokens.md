# Mockup Tokens — Global Table UX Hi-Fi (Task 28)

> Exact tokens untuk implementasi Task 29. Sumber `docs/design-system.md` + `app/utils/naiveui-theme.ts` + fondasi Task 27. Wireframe anotasi di `docs/wireframes/global-table-ux/_wireframe-spec.md`.

## Colors

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| primary | `#3B82F6` | Main brand, NButton primary, link, active sider, input focus, chips | ✅ token |
| primaryHover | `#2563EB` | hover | ✅ |
| primaryPressed | `#1D4ED8` | active | ✅ |
| primary-50 | `#EFF6FF` | active bg sider, tag bg, computed live indicator | ✅ |
| primary-100 | `#DBEAFE` | focus shadow `0 0 0 2px` | ✅ |
| primary-200 | `#BFDBFE` | active border | ✅ |
| error | `#EF4444` | NAlert error, validation, delete | ✅ |
| errorBg | `#FEF2F2` | NAlert error bg | ✅ |
| errorBorder | `#FECACA` | NAlert error border | ✅ |
| success | `#22C55E` | success toast, live indicator | ✅ |
| successBg | `#F0FDF4` | NAlert success bg | ✅ |
| warning | `#F59E0B` | warning, currency tag | ✅ |
| warningBg | `#FFFBEB` | NAlert warning, computed section | ✅ |
| info | `#0EA5E9` | info | ✅ |
| gray-50 | `#F9FAFB` | body, PageShell head | ✅ |
| gray-100 | `#F3F4F6` | hover, divider | ✅ |
| gray-200 | `#E5E7EB` | border default | ✅ |
| gray-300 | `#D1D5DB` | border muted | ✅ |
| gray-400 | `#9CA3AF` | detail-label muted, placeholder | ✅ |
| gray-500 | `#6B7280` | text3, muted | ✅ |
| gray-700 | `#374151` | text2 | ✅ |
| gray-800 | `#1F2937` | text1 | ✅ |
| card | `#FFFFFF` | card, modal, drawer | ✅ |
| detail-label | `#94a3b8` | .detail-label (bukan #666) | ✅ token |
| Off-token removed | `purple` (`typeColors currency:35`) | → `warning` (NTag type enum) | ✅ fixed |
| Off-token removed | `#666` (`GlobalTableColumnFormModal:292`) | → `#94a3b8` / `text-gray-400` | ✅ fixed |
| Off-token removed | `text-blue-500` (`DynamicForm:165` span) | → `NButton type="primary" ghost` `#3B82F6` | ✅ fixed |

## Typography

| Token | Size | Line | Weight | Usage |
|-------|------|------|--------|-------|
| H1 shell | 18-20px | 28px | 600 | PageShell title |
| H2 | 19px | 28px | 600 | mockup section |
| H3 | 14px | 20px | 600 | card title |
| Body | 14px | 20px | 400 | default |
| Small | 13px | 18px | 400 | input, table |
| Caption | 12px | 16px | 400 | muted |
| Label | 11px | 16px | 600 | detail-label uppercase |
| Mono | 13px | 18px | 400 | `JetBrains Mono` / `SF Mono` — `{{field}}`, `nip` |

Font: `Inter, ui-sans-serif, system-ui, sans-serif` + `JetBrains Mono, SF Mono` untuk code — via Google Fonts + naiveui-theme.ts `fontFamily`.

## Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| xs | 2px | — |
| sm | 4px | — |
| md | 8px | gap 8 |
| lg | 12px | toolbar gap |
| xl | 16px | padding card/modal |
| 2xl | 24px | section gap |
| 3xl | 32px | page padding desktop |
| PageShell head | 16px 20px | — |
| PageShell body | 20px | — |
| Form gap | 12px | NFormItem gap |
| Drawer | 16px | NDrawerContent |

Container padding: mobile 16px, tablet 24px, desktop 32px. Gap toolbar 12px, flex-wrap.

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | small button, tag, checkbox |
| md | 6px | default (button, input, alert, NPopconfirm) |
| lg | 8px | card, PageShell, table, modal, drawer |

## Dimensions

| Item | Value |
|------|-------|
| PageShell radius | 8px |
| Table row | 36px |
| Table head | 40px |
| Table cell padding | 8px 10px |
| Input height | 32px |
| Select height | 32px |
| Search min-width | 320px |
| Select width | 160px |
| Modal width | `min(640px,90vw)` `max-w-2xl` preset card |
| Drawer width | 480px desktop / 100vw mobile |
| NTag height | 20px |
| NButton height | 32px (small 28) |

## Icons

- Library: `@vicons/carbon`, wrapper `h(NIcon, null, {default:()=>h(Icon)})`, sizes 16px (menu/input) / 20px (card).
- Mapping: Add `Add`, Edit `Edit`, View/Detail `View`/`Eye`, Delete `TrashCan`, Reorder `ChevronUp`/`ChevronDown` (bukan `DragHandle` palsu), Search `Search`, Refresh `Restart`, Settings `Settings`, Upload `Upload`, Close `Close`.
- Dokumen distinct tidak relevan di modul ini (tetap token Grid/Document/Task/Activity/Report per Task27).

## Animation Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| Fast | 150ms | ease-out | hover, button scale, menu hover |
| Normal | 250ms | ease | page, card, NAlert slideDown, debounce saving |
| Slow | 350ms | ease-in-out | modal/drawer, toast |

Vue transitions: `.page-enter 250ms`, `.fade 250ms`, `.slide-up 250ms`, `.alert-enter 250ms`, `AccessDenied slideIn 300ms`.

## Naive UI Overrides (`naiveui-theme.ts`)

`common.primaryColor #3B82F6`, `primaryColorHover #2563EB`, `primaryColorPressed #1D4ED8`, `borderRadius 6px`, `borderRadiusSmall 4px`, fontFamily Inter, heights Tiny 28/Small 32/Medium 36/Large 40 — sama dengan foundation Task27, tidak ada perubahan.

## Detail View Pattern

Standar Task27 (bukan NDescriptions): `.detail-view flex column`, `.detail-field 12px 0 border-bottom rgba(0,0,0,.06)`, `.detail-label 11px uppercase #94a3b8`, `.detail-value 14px #1e293b` — dipakai `TableRowDetailDrawer.vue`.

