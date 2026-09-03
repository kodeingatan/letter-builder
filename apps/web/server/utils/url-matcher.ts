export function matchUrlPattern(pattern: string, url: string): boolean {
  const normalizedPattern = pattern.replace(/\/+$/, '') || '/'
  const normalizedUrl = url.replace(/\/+$/, '') || '/'

  if (normalizedPattern === '/*' || normalizedPattern === '/') return true

  const patternParts = normalizedPattern.split('/').filter(Boolean)
  const urlParts = normalizedUrl.split('/').filter(Boolean)

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === '*') return true
    if (i >= urlParts.length) return false
    if (patternParts[i] !== urlParts[i]) return false
  }

  return patternParts.length === urlParts.length
}
