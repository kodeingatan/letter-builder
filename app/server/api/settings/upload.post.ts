import { defineEventHandler, getHeader, readMultipartFormData, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { StorageService } from '~~/server/services/storage.service'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400, message: 'No file uploaded' })
  const fileField = formData.find(f => f.name === 'file')
  const subfolderField = formData.find(f => f.name === 'subfolder')
  if (!fileField?.data || !fileField?.filename) throw createError({ statusCode: 400, message: 'File required' })
  const subfolder = subfolderField?.data?.toString() || 'general'
  try {
    return await StorageService.saveFile(subfolder, {
      originalFilename: fileField.filename,
      buffer: fileField.data,
    })
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
