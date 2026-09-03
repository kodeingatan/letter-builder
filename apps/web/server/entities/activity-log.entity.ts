import { EntitySchema } from 'typeorm'

export interface ActivityLog {
  id: number
  userId: number
  action: string
  entity: string
  entityId: number
  description: string
  metadata: string
  ipAddress: string
  userAgent: string
  level: string
  createdAt: Date
}

export const ActivityLogSchema = new EntitySchema<ActivityLog>({
  name: 'activity_logs',
  columns: {
    id: { type: Number, primary: true, generated: true },
    userId: { type: Number, nullable: true },
    action: { type: String },
    entity: { type: String },
    entityId: { type: Number, nullable: true },
    description: { type: 'text', nullable: true },
    metadata: { type: 'text', nullable: true },
    ipAddress: { type: String, nullable: true },
    userAgent: { type: String, nullable: true },
    level: { type: String, length: 20, default: 'INFO' },
    createdAt: { type: 'datetime', createDate: true },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'users',
      inverseSide: 'activityLogs',
      joinColumn: { name: 'userId' },
      onDelete: 'SET NULL',
      nullable: true,
    },
  },
})
