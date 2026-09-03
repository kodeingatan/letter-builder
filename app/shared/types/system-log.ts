export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL' | 'EMERGENCY'

export interface LogStackFrame {
  file: string
  line: number
  column?: number
  function?: string
}

export interface LogEntry {
  timestamp: string
  level: string
  context: string
  message: string
  stackTrace?: string
  metadata?: Record<string, any>
  rawLine: string
  codePath?: string
  codeLine?: number
}

export interface SystemLogFile {
  filename: string
  size: number
  modified: string
}

export interface QuerySystemLog {
  level?: string
  search?: string
  searchField?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface SystemLogStats {
  total: number
  byLevel: Record<string, number>
}

export interface LogDetail extends LogEntry {
  id: number
  stackFrames?: LogStackFrame[]
}
