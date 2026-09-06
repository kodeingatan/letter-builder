/**
 * Output sanitizer (Task 20, Security & Permission).
 *
 * Layers on top of the Task 15 allowlist-lite sanitizer
 * (`sanitizeHtmlFragment` — strips script/iframe/form, comments, `on*`
 * handlers, `javascript:` URLs) with the Task 20 image-URL restriction:
 * only `/api/storage/*`, http(s), and small `data:image/*` URIs survive.
 * Anything else becomes a placeholder box + IMAGE_MISSING warning.
 */

import { sanitizeHtmlFragment } from '../composition-tree'

export const MAX_DATA_URI_CHARS = 2 * 1024 * 1024

export function isAllowedImageSrc(src: string): boolean {
  const value = (src || '').trim()
  if (!value) return false
  const lower = value.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:text/html')) return false
  if (lower.startsWith('/api/storage/')) return true
  if (lower.startsWith('http://') || lower.startsWith('https://')) return true
  if (lower.startsWith('data:image/')) return value.length <= MAX_DATA_URI_CHARS
  if (value.startsWith('/') && !value.startsWith('//')) return true
  return false
}

/** Final output pass: Task 15 allowlist applied to the assembled document. */
export function sanitizeOutputHtml(html: string): string {
  return sanitizeHtmlFragment(html ?? '')
}

/** Placeholder box for missing/blocked images (BR-005). */
export function missingImageBox(alt: string): string {
  const label = (alt || 'image').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<div class="render-image-missing" role="img" aria-label="Missing image: ${label}">[image missing: ${label}]</div>`
}
