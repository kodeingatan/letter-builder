export function getErrorMessage(e: any, fallback = 'An error occurred'): string {
  const msg = e?.response?.data?.message ?? e?.response?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? fallback
  if (Array.isArray(msg)) return msg.join('. ')
  return String(msg)
}

/** True if error is 409 Conflict (handles axios vs $fetch shapes). */
export function isConflictError(e: unknown): boolean {
  const err = e as any
  const status = err?.response?.status ?? err?.statusCode ?? err?.status ?? err?.data?.statusCode ?? err?.response?.data?.statusCode
  if (status === 409) return true
  // Also check nested data statusCode
  if (err?.response?.data?.statusCode === 409) return true
  if (err?.data?.statusCode === 409) return true
  return false
}

function extractRawData(e: unknown): any {
  const err = e as any
  // Try all known shapes: $fetch H3 vs axios
  // Priority: most specific nested first
  return (
    err?.response?.data?.data ??
    err?.response?.data ??
    err?.data?.data ??
    err?.data ??
    err?.response?._data?.data ??
    err?.response?._data ??
    null
  )
}

/** Extract 409 references array from error (handles 5+ shapes). */
export function getConflictReferences(e: unknown): string[] | null {
  const raw = extractRawData(e)
  if (!raw) return null
  // Direct array in data.references
  if (Array.isArray(raw.references)) return raw.references as string[]
  // Nested data.references (when raw is { data: { references } })
  if (raw.data && Array.isArray(raw.data.references)) return raw.data.references as string[]
  // For doc-templates shape: { steps, administrations } — not references but still conflict data
  // Return null for that shape — use getConflictData instead
  return null
}

/** Extract conflict data object (references | steps/administrations) */
export function getConflictData(e: unknown): { references?: string[]; steps?: number; administrations?: number[] } | null {
  const raw = extractRawData(e)
  if (!raw || typeof raw !== 'object') return null
  const data = raw.data && typeof raw.data === 'object' ? raw.data : raw
  const out: { references?: string[]; steps?: number; administrations?: number[] } = {}
  let has = false
  if (Array.isArray((data as any).references)) {
    out.references = (data as any).references as string[]
    has = true
  }
  if (typeof (data as any).steps === 'number') {
    out.steps = (data as any).steps as number
    has = true
  }
  if (Array.isArray((data as any).administrations)) {
    out.administrations = (data as any).administrations as number[]
    has = true
  }
  // Also check raw itself if data wrapper not used
  if (!has && Array.isArray((raw as any).references)) {
    out.references = (raw as any).references as string[]
    has = true
  }
  return has ? out : null
}

/** Generic extractor for error.data (any status) */
export function extractErrorData(e: unknown): unknown {
  return extractRawData(e)
}
