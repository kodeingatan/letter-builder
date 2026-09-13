/**
 * CLI-loadable TypeORM data-source config (RBAC + Master Data + Persuratan).
 *
 * 16 EntitySchemas + dynamic `mst_*` physical tables (NOT entities — created
 * by master-ddl.service, ignored by drift detection, never dropped by
 * synchronize).
 * Same 9 EntitySchemas as the Nuxt runtime (`server/utils/db.ts`), but with
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
import { MasterTableSchema } from '../entities/master-table.entity'
import { MasterTableColumnSchema } from '../entities/master-table-column.entity'
import { DocComponentSchema } from '../entities/doc-component.entity'
import { DocTemplateSchema } from '../entities/doc-template.entity'
import { AdministrationSchema } from '../entities/administration.entity'
import { AdminStepSchema } from '../entities/admin-step.entity'
import { DocumentSchema } from '../entities/document.entity'
import { Baseline1788914913928 } from '../migrations/1788914913928-Baseline'
import { DropDynamicTables1700000000001 } from '../migrations/1700000000001-DropDynamicTables'
import { CreateMasterTables1789300000000 } from '../migrations/1789300000000-CreateMasterTables'
import { CreatePersuratanTables1789310000000 } from '../migrations/1789310000000-CreatePersuratanTables'

/** All 16 EntitySchemas — RBAC + Master Data (Task 06) + Persuratan (Task 07). */
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
  MasterTableSchema,
  MasterTableColumnSchema,
  DocComponentSchema,
  DocTemplateSchema,
  AdministrationSchema,
  AdminStepSchema,
  DocumentSchema,
]

/**
 * Checked-in migrations, oldest first. BR-001: never edit an applied
 * migration — new schema changes ship as new files in `server/migrations/`.
 */
export const appMigrations = [Baseline1788914913928, DropDynamicTables1700000000001, CreateMasterTables1789300000000, CreatePersuratanTables1789310000000]

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
