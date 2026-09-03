import { z } from 'zod'

export const CreatePermissionSchema = z.object({
  permissionName: z.string().min(1).max(100),
  description: z.string().optional(),
  methods: z.array(z.string()).optional(),
  urls: z.array(z.string()).optional(),
})

export const UpdatePermissionSchema = z.object({
  permissionName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  methods: z.array(z.string()).optional(),
  urls: z.array(z.string()).optional(),
})

export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>
