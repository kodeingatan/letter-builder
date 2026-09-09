import { DataSource } from 'typeorm'
import { appEntities, appMigrations } from '~~/server/utils/orm-data-source'

let dataSource: DataSource | null = null

export async function getDataSource(): Promise<DataSource> {
  if (!dataSource) {
    // Task 22 (REQ-004): production boots with `synchronize:false` +
    // checked-in baseline migration. Override with DB_SYNCHRONIZE env var;
    // dev default stays `true` for the synchronize-era workflow.
    const synchronize = process.env.DB_SYNCHRONIZE
      ? process.env.DB_SYNCHRONIZE !== 'false'
      : process.env.NODE_ENV !== 'production'
    // Task 23: apply pending migrations automatically on production boot
    // (before the idempotent seed in `database.server.ts`). Dev keeps
    // `synchronize:true` and never runs migrations implicitly.
    const isProd = process.env.NODE_ENV === 'production'
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: 'db.sqlite',
      entities: appEntities,
      migrations: appMigrations,
      synchronize,
      migrationsRun: isProd && !synchronize,
    })
    await dataSource.initialize()
  }
  return dataSource
}
