import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

const LOGS_DIR = join(process.cwd(), 'logs')

export const SystemLogsService = {
  async listFiles() {
    try {
      const files = await readdir(LOGS_DIR)
      const logFiles = files.filter(f => f.endsWith('.log'))
      const result = await Promise.all(
        logFiles.map(async (filename) => {
          const fileStat = await stat(join(LOGS_DIR, filename))
          return { filename, size: fileStat.size, modified: fileStat.mtime }
        })
      )
      return result.sort((a, b) => b.modified.getTime() - a.modified.getTime())
    } catch {
      return []
    }
  },

  async readFileContent(filename: string, options?: { level?: string; search?: string; limit?: number; offset?: number }) {
    const content = await readFile(join(LOGS_DIR, filename), 'utf-8')
    let lines = content.split('\n').filter(Boolean)

    if (options?.level) {
      lines = lines.filter(l => l.includes(`[${options.level.toUpperCase()}]`))
    }
    if (options?.search) {
      const searchLower = options.search.toLowerCase()
      lines = lines.filter(l => l.toLowerCase().includes(searchLower))
    }

    const total = lines.length
    const offset = options?.offset || 0
    const limit = options?.limit || 100
    lines = lines.slice(offset, offset + limit)

    return { lines, total, offset, limit }
  },

  async getStats(filename: string) {
    const { lines } = await this.readFileContent(filename)
    const levels = { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0, TRACE: 0 }
    for (const line of lines) {
      for (const level of Object.keys(levels)) {
        if (line.includes(`[${level}]`)) levels[level as keyof typeof levels]++
      }
    }
    return { total: lines.length, levels }
  },
}
