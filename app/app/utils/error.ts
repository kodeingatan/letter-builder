export function getErrorMessage(e: any, fallback = 'An error occurred'): string {
  const msg = e?.response?.data?.message ?? e?.message ?? fallback
  if (Array.isArray(msg)) return msg.join('. ')
  return String(msg)
}
