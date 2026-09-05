import { defineEventHandler, getQuery, createError, getRouterParam, readBody } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTableColumnService } from '~~/server/services/global-table-column.service'
import { CreateGlobalTableColumnSchema, GlobalTableColumnQuerySchema } from '~~/server/dto/global-table-columns.dto'
import { validateRelationConfig } from '~~/server/services/relation.service'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const tableId = Number(getRouterParam(event, 'tableId'))
  if (isNaN(tableId)) throw createError({ statusCode: 400, message: 'Invalid table id' })

  const body = await readBody(event)
  const parsed = CreateGlobalTableColumnSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })

  // Validate relation config
  const isRelational = parsed.data.type === 'select-table-relation' || parsed.data.type === 'select-table-relation-multiple'
  if (isRelational) {
    if (!parsed.data.relationTableId || !parsed.data.relationConfig) {
      throw createError({ statusCode: 422, message: 'Relation columns require relationTableId and relationConfig' })
    }
    
    const validation = await validateRelationConfig(
      parsed.data.relationTableId,
      parsed.data.relationConfig,
      tableId,
      parsed.data.name
    )
    if (!validation.valid) {
      throw createError({ statusCode: 422, message: validation.error || 'Invalid relation configuration' })
    }
  }

  try {
    const created = await GlobalTableColumnService.create(parsed.data, tableId)
    return created
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
