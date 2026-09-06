import { defineEventHandler, readBody, createError, setHeader } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { PreviewRenderSchema } from '~~/server/dto/render.dto'
import { RenderingService } from '~~/server/services/rendering.service'
import { checkPreviewRateLimit, withRenderSlot } from '~~/server/utils/render-guard'

/**
 * `POST /api/render/preview` (Task 20, REQ-005).
 * Designer/Operator live preview: `{ templateId | tree, context }` →
 * `{ html, warnings[] }`. Rate-limited (30/min/user); the in-process
 * semaphore answers 503 + Retry-After when saturated (AC-007).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  try {
    checkPreviewRateLimit(userId)
  } catch (e: any) {
    if (e.statusCode === 429) {
      setHeader(event, 'Retry-After', String(e.data?.retryAfter ?? 60))
    }
    throw createError({ statusCode: e.statusCode ?? 429, message: e.message, data: e.data })
  }

  const body = await readBody(event)
  const parsed = PreviewRenderSchema.safeParse(body ?? {})
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: parsed.error.errors[0]?.message ?? 'Invalid preview payload' })
  }

  try {
    const result = await withRenderSlot(async () => {
      if (parsed.data.templateId !== undefined) {
        return RenderingService.previewForTemplate(parsed.data.templateId as number, parsed.data.context)
      }
      return RenderingService.previewWithTree(parsed.data.tree, parsed.data.context)
    })
    return { html: result.html, warnings: result.warnings, timings: result.timings }
  } catch (e: any) {
    if (e.statusCode === 503) {
      setHeader(event, 'Retry-After', String(e.data?.retryAfter ?? 5))
      throw createError({ statusCode: 503, message: e.message, data: e.data })
    }
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
