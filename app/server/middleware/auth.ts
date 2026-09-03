import { defineEventHandler, getHeader } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'

export default defineEventHandler((event) => {
  const auth = getHeader(event, 'authorization')
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(auth.slice(7))
      event.context.user = payload
    } catch {}
  }
})
