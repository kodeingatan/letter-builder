import { defineEventHandler, getRouterParam, createError, sendStream } from 'h3'
import { StorageService } from '~~/server/services/storage.service'
import { createReadStream } from 'fs'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') as string
  const parts = path.split('/')
  if (parts.length < 2) throw createError({ statusCode: 400, message: 'Invalid path' })
  const [subfolder, ...filenameParts] = parts
  const filename = filenameParts.join('/')
  try {
    const filePath = await StorageService.getFilePath(subfolder, filename)
    const stream = createReadStream(filePath)
    return sendStream(event, stream)
  } catch {
    throw createError({ statusCode: 404, message: 'File not found' })
  }
})
