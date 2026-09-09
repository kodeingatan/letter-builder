/**
 * Migration CLI (Task 23) — runnable without ts-node via the repo's `jiti`:
 *
 *   npm run migration:run                  # apply pending migrations
 *   npm run migration:revert               # revert last applied migration
 *   npm run migration:generate -- <Name>   # diff entities vs DB → new file
 *
 * `DB_PATH` env override selects the SQLite file (default `db.sqlite` in
 * cwd). `generate` diffs the 23 EntitySchemas against the target database
 * (point it at a fully-migrated DB; an empty file yields the full schema,
 * which is how the checked-in baseline was produced).
 *
 * NOTE: relative imports only — no `~~/` Nuxt aliases — so `jiti` can load
 * this file outside the Nuxt runtime.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { appDataSourceOptions, resolveDatabasePath } from './orm-data-source'

function usage(): never {
  // eslint-disable-next-line no-console
  console.error(
    'Usage: migration-cli.ts <run|revert|generate> [--db <path>] [--name <Name>]\n' +
      '  run               apply pending migrations to DB_PATH (default db.sqlite)\n' +
      '  revert            revert the last applied migration\n' +
      '  generate --name X  write server/migrations/<timestamp>-X.ts from schema diff',
  )
  process.exit(1)
}

function parseArgs(argv: string[]): { command: string; name: string } {
  const command = argv[0]
  if (!command || !['run', 'revert', 'generate'].includes(command)) usage()
  let name = ''
  for (let i = 1; i < argv.length; i++) {
    if ((argv[i] === '--name' || argv[i] === '-n') && argv[i + 1]) {
      name = argv[++i]
    } else if (argv[i] === '--db' && argv[i + 1]) {
      process.env.DB_PATH = argv[++i]
    } else if (!argv[i].startsWith('--')) {
      name = argv[i]
    }
  }
  if (command === 'generate' && !/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
    // eslint-disable-next-line no-console
    console.error('generate requires a PascalCase migration name, e.g. --name AddFooToBar')
    process.exit(1)
  }
  return { command, name }
}

function escapeTemplateLiteral(query: string): string {
  return query.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

function toMigrationFile(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
  const className = `${name}${timestamp}`
  const up = upSqls.map((q) => `        await queryRunner.query(\`${escapeTemplateLiteral(q)}\`);`)
  const down = downSqls.map((q) => `        await queryRunner.query(\`${escapeTemplateLiteral(q)}\`);`)
  return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${className} implements MigrationInterface {
    name = '${className}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${up.join('\n')}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${down.join('\n')}
    }

}
`
}

async function buildDataSource(): Promise<DataSource> {
  const ds = new DataSource({
    ...appDataSourceOptions(resolveDatabasePath()),
    synchronize: false,
    migrationsRun: false,
  })
  await ds.initialize()
  return ds
}

async function cmdRun(): Promise<void> {
  const ds = await buildDataSource()
  try {
    const results = await ds.runMigrations({ transaction: 'all' })
    // eslint-disable-next-line no-console
    console.log(
      results.length === 0
        ? `No pending migrations (${resolveDatabasePath()} is up to date).`
        : `Applied ${results.length} migration(s) to ${resolveDatabasePath()}: ${results.map((m) => m.name).join(', ')}`,
    )
  } finally {
    await ds.destroy()
  }
}

async function cmdRevert(): Promise<void> {
  const ds = await buildDataSource()
  try {
    await ds.undoLastMigration({ transaction: 'all' })
    // eslint-disable-next-line no-console
    console.log(`Reverted last migration on ${resolveDatabasePath()}.`)
  } finally {
    await ds.destroy()
  }
}

async function cmdGenerate(name: string): Promise<void> {
  const ds = await buildDataSource()
  try {
    const { upQueries, downQueries } = await ds.driver.createSchemaBuilder().log()
    if (upQueries.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No changes in database schema were found - nothing to generate.')
      return
    }
    const timestamp = Date.now()
    const dir = resolve(process.cwd(), 'server/migrations')
    mkdirSync(dir, { recursive: true })
    const fileName = join(dir, `${timestamp}-${name}.ts`)
    writeFileSync(
      fileName,
      toMigrationFile(
        name,
        timestamp,
        upQueries.map((q) => q.query),
        downQueries
          .slice()
          .reverse()
          .map((q) => q.query),
      ),
    )
    // eslint-disable-next-line no-console
    console.log(
      `Generated ${fileName} (${upQueries.length} up / ${downQueries.length} down statements). ` +
        `Wire the new class into appMigrations in server/utils/orm-data-source.ts.`,
    )
  } finally {
    await ds.destroy()
  }
}

async function main(): Promise<void> {
  const { command, name } = parseArgs(process.argv.slice(2))
  if (command === 'run') await cmdRun()
  else if (command === 'revert') await cmdRevert()
  else await cmdGenerate(name)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration command failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
