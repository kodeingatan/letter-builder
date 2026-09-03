import { z } from 'zod'

export const UpdateSettingSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
})

export type UpdateSettingInput = z.infer<typeof UpdateSettingSchema>
