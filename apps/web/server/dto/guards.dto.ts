import { z } from 'zod'

export const CreateGuardSchema = z.object({
  guardName: z.string().min(1).max(100),
  description: z.string().optional(),
  allowUrls: z.array(z.string()).optional(),
  denyUrls: z.array(z.string()).optional(),
})

export const UpdateGuardSchema = z.object({
  guardName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  allowUrls: z.array(z.string()).optional(),
  denyUrls: z.array(z.string()).optional(),
})

export type CreateGuardInput = z.infer<typeof CreateGuardSchema>
export type UpdateGuardInput = z.infer<typeof UpdateGuardSchema>
