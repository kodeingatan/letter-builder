import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Create Master Data meta tables — Task 06.
 * Physical `mst_*` tables are NOT migrations: they are created at runtime
 * by master-ddl.service and ignored by drift detection (BR-006).
 */
export class CreateMasterTables1789300000000 implements MigrationInterface {
    name = 'CreateMasterTables1789300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "master_tables" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "name" varchar(60) NOT NULL,
            "displayName" varchar(120) NOT NULL,
            "slug" varchar(64) NOT NULL UNIQUE,
            "description" text,
            "status" varchar(16) NOT NULL DEFAULT ('DRAFT'),
            "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
            "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
        )`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "master_table_columns" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "tableId" integer NOT NULL,
            "name" varchar(60) NOT NULL,
            "displayName" varchar(120) NOT NULL,
            "type" varchar(32) NOT NULL,
            "configJson" text,
            "defaultValue" text,
            "isRequired" boolean NOT NULL DEFAULT (0),
            "isOrderable" boolean NOT NULL DEFAULT (0),
            "isSearchable" boolean NOT NULL DEFAULT (0),
            "sortOrder" integer NOT NULL DEFAULT (0),
            CONSTRAINT "FK_master_columns_table" FOREIGN KEY ("tableId") REFERENCES "master_tables" ("id") ON DELETE CASCADE
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_master_columns_table_name" ON "master_table_columns" ("tableId", "name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_master_columns_table_name"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "master_table_columns"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "master_tables"`);
    }
}
