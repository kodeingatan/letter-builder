import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drop Dynamic Administration tables — Task 01 RBAC-Only cleanup.
 * Removes 14 tables that are no longer in appEntities (9 schemas).
 * Prod: run `npm run migration:run` after deploying this file.
 * Dev: `synchronize:true` + `rm db.sqlite` also works (no migration needed).
 */
export class DropDynamicTables1700000000001 implements MigrationInterface {
    name = 'DropDynamicTables1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Order: leaf → root to satisfy FKs (documents → ... → global_tables)
        await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "administration_runs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "administration_versions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "administration_steps"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "administrations"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "template_bindings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "template_versions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "templates"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "component_versions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "component_data_requirements"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "components"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "global_table_rows"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "global_table_columns"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "global_tables"`);
        // Drop indexes that may linger (IF EXISTS for SQLite compatibility)
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_GLOBAL_TABLE_COLUMN_TABLE_ID_NAME"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_GLOBAL_TABLE_COLUMN_TABLE_ID_POSITION"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_GLOBAL_TABLE_COLUMN_RELATION_TABLE_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_GLOBAL_TABLE_ROWS_TABLE_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_COMPONENT_NAME"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_COMPONENT_STATUS"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_COMPONENT_REQUIREMENT_COMPONENT_ID_NAME"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_COMPONENT_REQUIREMENT_COMPONENT_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_COMPONENT_VERSION_COMPONENT_ID_VERSION"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_COMPONENT_VERSION_COMPONENT_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEMPLATE_NAME"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEMPLATE_STATUS"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEMPLATE_VERSION_TEMPLATE_ID_VERSION"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEMPLATE_VERSION_TEMPLATE_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEMPLATE_BINDING_TEMPLATE_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEMPLATE_BINDING_TEMPLATE_PLACEMENT_REQUIREMENT"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEMPLATE_BINDING_COMPONENT_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMINISTRATION_NAME"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMINISTRATION_STATUS"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMIN_STEP_ADMIN_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMIN_STEP_ADMIN_ID_ORDER"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMIN_STEP_TEMPLATE_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMIN_VERSION_ADMIN_ID_VERSION"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMIN_VERSION_ADMIN_ID"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMIN_RUN_ADMIN_ID_STATUS"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ADMIN_RUN_STARTED_BY"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_DOCUMENT_ADMIN_ID_CREATED_AT"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_DOCUMENT_RUN_ID"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No down: dynamic tables are intentionally removed. Re-create via git revert of this migration + baseline if needed.
    }
}
