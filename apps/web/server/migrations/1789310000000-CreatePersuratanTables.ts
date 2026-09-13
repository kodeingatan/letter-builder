import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Create Persuratan tables — Task 07.
 * Versioning is snapshot-based (no separate versions tables):
 * runs lock `template_version` + store `rendered_html` (Open Question: snapshot wins).
 */
export class CreatePersuratanTables1789310000000 implements MigrationInterface {
    name = 'CreatePersuratanTables1789310000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "doc_components" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "name" varchar(120) NOT NULL UNIQUE,
            "isLooping" boolean NOT NULL DEFAULT (0),
            "tiptapJson" text NOT NULL,
            "previewHtml" text,
            "version" integer NOT NULL DEFAULT (1),
            "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
            "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
        )`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "doc_templates" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "name" varchar(120) NOT NULL UNIQUE,
            "code" varchar(60) NOT NULL UNIQUE,
            "description" text,
            "schemaJson" text NOT NULL,
            "version" integer NOT NULL DEFAULT (1),
            "status" varchar(16) NOT NULL DEFAULT ('DRAFT'),
            "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
            "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
        )`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "administrations" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "name" varchar(120) NOT NULL UNIQUE,
            "slug" varchar(64) NOT NULL UNIQUE,
            "description" text,
            "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
            "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
        )`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "admin_steps" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "adminId" integer NOT NULL,
            "templateId" integer NOT NULL,
            "stepOrder" integer NOT NULL,
            "mappingJson" text NOT NULL DEFAULT ('{}'),
            CONSTRAINT "FK_admin_steps_admin" FOREIGN KEY ("adminId") REFERENCES "administrations" ("id") ON DELETE CASCADE,
            CONSTRAINT "FK_admin_steps_template" FOREIGN KEY ("templateId") REFERENCES "doc_templates" ("id") ON DELETE RESTRICT
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_admin_steps_order" ON "admin_steps" ("adminId", "stepOrder")`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "documents" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "adminId" integer,
            "templateId" integer,
            "documentNumber" varchar(120) UNIQUE,
            "dataJson" text NOT NULL DEFAULT ('{}'),
            "renderedHtml" text,
            "pdfPath" varchar(255),
            "status" varchar(16) NOT NULL DEFAULT ('DRAFT'),
            "templateVersion" integer NOT NULL DEFAULT (1),
            "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
            "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_steps_order"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "admin_steps"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "administrations"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "doc_templates"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "doc_components"`);
    }
}
