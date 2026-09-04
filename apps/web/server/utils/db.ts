import { DataSource } from 'typeorm'
import { UserSchema } from '~~/server/entities/user.entity'
import { RoleSchema } from '~~/server/entities/role.entity'
import { PermissionSchema } from '~~/server/entities/permission.entity'
import { PermissionMethodSchema } from '~~/server/entities/permission-method.entity'
import { PermissionUrlSchema } from '~~/server/entities/permission-url.entity'
import { GuardSchema } from '~~/server/entities/guard.entity'
import { GuardUrlSchema } from '~~/server/entities/guard-url.entity'
import { ActivityLogSchema } from '~~/server/entities/activity-log.entity'
import { SettingSchema } from '~~/server/entities/setting.entity'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'

let dataSource: DataSource | null = null

export async function getDataSource(): Promise<DataSource> {
  if (!dataSource) {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: 'db.sqlite',
      entities: [
        UserSchema,
        RoleSchema,
        PermissionSchema,
        PermissionMethodSchema,
        PermissionUrlSchema,
        GuardSchema,
        GuardUrlSchema,
        ActivityLogSchema,
        SettingSchema,
        GlobalTableSchema,
      ],
      synchronize: true,
    })
    await dataSource.initialize()
  }
  return dataSource
}
