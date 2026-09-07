import { Book, Document, DocumentBlank, Folder, Star, Table } from '@vicons/carbon'

/** Client-side mirror of the server MENU_ICON_ALLOWLIST (value import — keep app-side). */
export const NAVIGATION_ICON_OPTIONS = ['Table', 'Document', 'Folder', 'Star', 'Book', 'File'] as const

/**
 * Task 21 — menuIcon allowlist → Carbon icon components.
 * Unknown keys fall back to the caller's group default.
 */
const MENU_ICONS: Record<string, unknown> = {
  Table,
  Document,
  Folder,
  Star,
  Book,
  // Spec allowlist key `File` has no Carbon export — closest visual.
  File: DocumentBlank,
}

export function resolveMenuIcon(icon: string | null | undefined, fallback: unknown) {
  if (icon && MENU_ICONS[icon]) return MENU_ICONS[icon]
  return fallback
}
