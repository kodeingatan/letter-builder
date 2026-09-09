/**
 * CLI-loadable TypeORM data-source config (Task 23).
 *
 * Same 23 EntitySchemas as the Nuxt runtime (`server/utils/db.ts`), but with
 * plain relative imports and no `~~/` Nuxt aliases so it can be loaded by
 * `jiti` (see `server/utils/migration-cli.ts`) and the `migration:*` npm
 * scripts. `server/utils/db.ts` imports the canonical `appEntities` /
 * `appMigrations` lists from here — do not duplicate them elsewhere.
 */
import { DataSource, type DataSourceOptions } from 'typeorm'
import { UserSchema } from '../entities/user.entity'
import { RoleSchema } from '../entities/role.entity'
import { PermissionSchema } from '../entities/permission.entity'
import { PermissionMethodSchema } from '../entities/permission-method.entity'
import { PermissionUrlSchema } from '../entities/permission-url.entity'
import { GuardSchema } from '../entities/guard.entity'
import { GuardUrlSchema } from '../entities/guard-url.entity'
import { ActivityLogSchema } from '../entities/activity-log.entity'
import { SettingSchema } from '../entities/setting.entity'
import { GlobalTableSchema } from '../entities/global-table.entity'
import { GlobalTableColumnSchema } from '../entities/global-table-column.entity'
import { GlobalTableRowSchema } from '../entities/global-table-row.entity'
import {
  ComponentSchema,
  ComponentDataRequirementSchema,
  ComponentVersionSchema,
} from '../entities/component.entity'
import {
  TemplateSchema,
  TemplateVersionSchema,
} from '../entities/template.entity'
import { TemplateBindingSchema } from '../entities/template-binding.entity'
import {
  AdministrationSchema,
  AdministrationStepSchema,
  AdministrationVersionSchema,
} from '../entities/administration.entity'
import { AdministrationRunSchema } from '../entities/administration-run.entity'
import { DocumentSchema } from '../entities/document.entity'
import { Baseline1788914913928 } from '../migrations/1788914913928-Baseline'

/** All 23 EntitySchemas (26 physical tables incl. 3 M:N junctions). */
export const appEntities = [
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
]

/**
 * Checked-in migrations, oldest first. BR-001: never edit an applied
 * migration — new schema changes ship as new files in `server/migrations/`.
 */
export const appMigrations = [Baseline1788914913928]

/** Database file path: `DB_PATH` env override, default `db.sqlite` (cwd). */
export function resolveDatabasePath(): string {
  return process.env.DB_PATH ?? 'db.sqlite'
}

export function appDataSourceOptions(database?: string): DataSourceOptions {
  return {
    type: 'better-sqlite3',
    database: database ?? resolveDatabasePath(),
    entities: appEntities,
    migrations: appMigrations,
    synchronize: false,
    migrationsRun: false,
    logging: false,
  }
}

/** Default export for CLI-style loaders (`-d` data-source path). */
export default new DataSource(appDataSourceOptions())
