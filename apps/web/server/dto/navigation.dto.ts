import { z } from 'zod'

/**
 * Task 21 — Generated Menu: icon allowlist shared by the two menu PUT
 * endpoints. Unknown values fall back to the group default client-side.
 */
export const MENU_ICON_ALLOWLIST = ['Table', 'Document', 'Folder', 'Star', 'Book', 'File'] as const

export type MenuIcon = (typeof MENU_ICON_ALLOWLIST)[number]

export function isMenuIconAllowed(icon: unknown): icon is MenuIcon {
  return typeof icon === 'string' && (MENU_ICON_ALLOWLIST as readonly string[]).includes(icon)
}

/**
 * Designer-gated reorder/icon update payload. Both fields nullable so a
 * Designer can clear back to the alphabetical default.
 */
export const MenuUpdateSchema = z.object({
  menuOrder: z.number().int().min(0).nullable().optional(),
  menuIcon: z
    .string()
    .max(32)
    .nullable()
    .optional()
    .refine((v) => v === undefined || v === null || isMenuIconAllowed(v), {
      message: `menuIcon must be one of: ${MENU_ICON_ALLOWLIST.join(', ')}`,
    }),
})

export type MenuUpdateInput = z.infer<typeof MenuUpdateSchema>
