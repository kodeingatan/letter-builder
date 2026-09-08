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
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
import { GlobalTableRowSchema } from '~~/server/entities/global-table-row.entity'
import {
  ComponentSchema,
  ComponentDataRequirementSchema,
  ComponentVersionSchema,
} from '~~/server/entities/component.entity'
import {
  TemplateSchema,
  TemplateVersionSchema,
} from '~~/server/entities/template.entity'
import { TemplateBindingSchema } from '~~/server/entities/template-binding.entity'
import {
  AdministrationSchema,
  AdministrationStepSchema,
  AdministrationVersionSchema,
} from '~~/server/entities/administration.entity'
import { AdministrationRunSchema } from '~~/server/entities/administration-run.entity'
import { DocumentSchema } from '~~/server/entities/document.entity'

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
        GlobalTableColumnSchema,
        GlobalTableRowSchema,
        ComponentSchema,
        ComponentDataRequirementSchema,
        ComponentVersionSchema,
        TemplateSchema,
        TemplateVersionSchema,
        TemplateBindingSchema,
        AdministrationSchema,
        AdministrationStepSchema,
        AdministrationVersionSchema,
        AdministrationRunSchema,
        DocumentSchema,
      ],
      // Task 22 (REQ-004): production boots with `synchronize:false` +
      // checked-in baseline migration. Override with DB_SYNCHRONIZE env var;
      // dev default stays `true` for the synchronize-era workflow.
      synchronize: process.env.DB_SYNCHRONIZE
        ? process.env.DB_SYNCHRONIZE !== 'false'
        : process.env.NODE_ENV !== 'production',
    })
    await dataSource.initialize()
  }
  return dataSource
}
