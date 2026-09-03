import { z } from 'zod'

export const CreateRoleSchema = z.object({
  roleName: z.string().min(1).max(100),
  description: z.string().optional(),
  guardIds: z.array(z.number()).optional(),
  permissionIds: z.array(z.number()).optional(),
})

export const UpdateRoleSchema = z.object({
  roleName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  guardIds: z.array(z.number()).optional(),
  permissionIds: z.array(z.number()).optional(),
})

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>
