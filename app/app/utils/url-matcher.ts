export function matchUrlPattern(pattern: string, url: string): boolean {
  if (pattern === '/*') return true;

  const cleanPattern = pattern.replace(/\/+$/, '');
  const cleanUrl = url.split('?')[0].replace(/\/+$/, '');

  if (cleanPattern.endsWith('/*')) {
    const prefix = cleanPattern.slice(0, -2);
    return cleanUrl === prefix || cleanUrl.startsWith(prefix + '/');
  }

  return cleanUrl === cleanPattern;
}
