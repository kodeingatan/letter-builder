import { getDataSource } from '../utils/db'
import { DocumentSchema } from '../entities/document.entity'
import { StorageService } from './storage.service'
import { generatePdfFromHtml } from './pdf.service'
import type { PersuratanQueryInput } from '../dto/persuratan.dto'

/**
 * Documents service (Task 07): version-locked run results.
 * Old runs keep rendering the locked version even after re-publish (AC-006):
 * `rendered_html` is snapshotted at run time, never recomputed.
 */

export const DocumentsService = {
  async findAll(query: PersuratanQueryInput, adminId?: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocumentSchema)
    const qb = repo.createQueryBuilder('d')
    if (adminId !== undefined) qb.where('d.adminId = :adminId', { adminId })
    if (query.search) {
      const clause = '(d.documentNumber LIKE :search OR CAST(d.id AS TEXT) LIKE :search)'
      if (adminId !== undefined) qb.andWhere(clause, { search: `%${query.search}%` })
      else qb.where(clause, { search: `%${query.search}%` })
    }
    qb.orderBy('d.id', query.sortOrder)
    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()
    return {
      data: (data as unknown as Array<Record<string, unknown>>).map(toPublic),
      total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit),
    }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const row = await ds.getRepository(DocumentSchema).findOne({ where: { id } })
    if (!row) notFound(id)
    return toPublic(row as unknown as Record<string, unknown>)
  },

  /** Cancel a run (DRAFT/FINAL → CANCELLED). History rows are never deleted. */
  async cancel(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocumentSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound(id)
    const status = (current as unknown as { status: string }).status
    if (status === 'CANCELLED') return current
    await repo.createQueryBuilder().update().set({ status: 'CANCELLED' }).where('id = :id', { id }).execute()
    return DocumentsService.findOne(id)
  },

  /** Resolve the stored PDF file path for the download route. */
  async pdfFilePath(id: number): Promise<string> {
    const row = await DocumentsService.findOne(id) as unknown as { pdf_path: string | null }
    if (!row.pdf_path) {
      const error = new Error('PDF not generated for this run yet — re-run the wizard (ERR-03)') as Error & { statusCode?: number }
      error.statusCode = 404
      throw error
    }
    const match = /^\/api\/storage\/([^/]+)\/(.+)$/.exec(row.pdf_path)
    if (!match) {
      const error = new Error('Stored PDF path is invalid') as Error & { statusCode?: number }
      error.statusCode = 500
      throw error
    }
    return StorageService.getFilePath(match[1], match[2])
  },

  /** Regenerate the PDF from the locked snapshot (retry after ERR-03). */
  async regeneratePdf(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocumentSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound(id)
    const row = current as unknown as { rendered_html: string | null }
    if (!row.rendered_html) {
      const error = new Error('Run has no rendered HTML') as Error & { statusCode?: number }
      error.statusCode = 404
      throw error
    }
    const { url } = await generatePdfFromHtml(row.rendered_html)
    await repo.createQueryBuilder().update()
      .set({ pdfPath: url, status: 'FINAL' })
      .where('id = :id', { id }).execute()
    return DocumentsService.findOne(id)
  },
}

function toPublic(row: Record<string, unknown>) {
  return {
    id: row.id,
    admin_id: row.adminId ?? null,
    template_id: row.templateId ?? null,
    document_number: row.documentNumber ?? null,
    data_json: row.dataJson,
    rendered_html: row.renderedHtml ?? null,
    pdf_path: row.pdfPath ?? null,
    status: row.status,
    template_version: row.templateVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function notFound(id: number): never {
  const error = new Error(`Document ${id} not found`) as Error & { statusCode?: number }
  error.statusCode = 404
  throw error
}
