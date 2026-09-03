import { defineEventHandler } from 'h3'
import { SettingsService } from '~~/server/services/settings.service'

export default defineEventHandler(async () => {
  return SettingsService.findAll()
})
