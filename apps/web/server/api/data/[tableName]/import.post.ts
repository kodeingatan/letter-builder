import { defineEventHandler, getRouterParam, createError, readMultipartFormData } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TableDataService } from '~~/server/services/table-data.service'

const MAX_BYTES = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const tableName = getRouterParam(event, 'tableName')
  if (!tableName) throw createError({ statusCode: 400, message: 'Invalid table name' })

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.data?.length)
  if (!file) throw createError({ statusCode: 422, message: 'CSV file is required (field: file)' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 422, message: 'Import file must be ≤5MB' })

  const filename = (file as any).filename ?? ''
  if (filename && !filename.toLowerCase().endsWith('.csv')) {
    throw createError({ statusCode: 422, message: 'Only .csv files are accepted' })
  }
  const mime = (file as any).type ?? ''
  if (mime && !['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/octet-stream'].includes(mime)) {
    throw createError({ statusCode: 422, message: 'Only .csv files are accepted' })
  }

  try {
    return await TableDataService.importCsv(tableName, Buffer.from(file.data).toString('utf-8'), userId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
