import { getDataSource } from '../utils/db'
import { DocComponentSchema } from '../entities/doc-component.entity'
import { DocTemplateSchema } from '../entities/doc-template.entity'
import { TiptapConverterService } from './tiptap-converter.service'
import { RendererService } from './renderer.service'
import type { CreateDocComponentInput, UpdateDocComponentInput, PersuratanQueryInput } from '../dto/persuratan.dto'

/**
 * DocComponent service (Task 07): reusable Tiptap blocks with bindings.
 * Delete is RESTRICTED when referenced by templates or components (ALT-01/BR-004).
 */

function toPublic(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    is_looping: Boolean(row.isLooping),
    tiptap_json: safeParseJson(row.tiptapJson),
    preview_html: (row.previewHtml ?? null) as string | null,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function safeParseJson(text: unknown): unknown {
  try {
    return JSON.parse(String(text ?? '{}'))
  } catch {
    return {}
  }
}

export const DocComponentsService = {
  async findAll(query: PersuratanQueryInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocComponentSchema)
    const qb = repo.createQueryBuilder('c')
    if (query.search) qb.where('(c.name LIKE :search)', { search: `%${query.search}%` })
    const sortable = new Set(['id', 'name', 'version', 'createdAt', 'updatedAt'])
    qb.orderBy(`c.${sortable.has(query.sortBy) ? query.sortBy : 'id'}`, query.sortOrder)
    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()
    return { data: (data as unknown as Array<Record<string, unknown>>).map(toPublic), total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const row = await ds.getRepository(DocComponentSchema).findOne({ where: { id } })
    if (!row) notFound('Component', id)
    return toPublic(row as unknown as Record<string, unknown>)
  },

  async create(input: CreateDocComponentInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocComponentSchema)
    if (await repo.findOne({ where: { name: input.name } })) conflict(`Component "${input.name}" already exists`)
    assertLooping(input.is_looping ?? false, input.tiptap_json)
    const saved = await repo.save(repo.create({
      name: input.name,
      isLooping: input.is_looping ?? false,
      tiptapJson: JSON.stringify(input.tiptap_json),
      previewHtml: renderPreview(input.tiptap_json),
      version: 1,
    }))
    return DocComponentsService.findOne((saved as unknown as { id: number }).id)
  },

  async update(id: number, input: UpdateDocComponentInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocComponentSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound('Component', id)
    const row = current as unknown as Record<string, unknown>
    const nextName = input.name ?? String(row.name)
    if (input.name && input.name !== row.name && await repo.findOne({ where: { name: input.name } })) {
      conflict(`Component "${input.name}" already exists`)
    }
    const nextLooping = input.is_looping ?? Boolean(row.isLooping)
    const nextTiptap = input.tiptap_json ?? safeParseJson(row.tiptapJson)
    assertLooping(nextLooping, nextTiptap)
    await repo.createQueryBuilder().update().set({
      name: nextName,
      isLooping: nextLooping,
      ...(input.tiptap_json !== undefined ? { tiptapJson: JSON.stringify(input.tiptap_json), previewHtml: renderPreview(input.tiptap_json) } : {}),
      version: Number(row.version) + 1,
    }).where('id = :id', { id }).execute()
    return DocComponentsService.findOne(id)
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocComponentSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound('Component', id)
    const name = (current as unknown as { name: string }).name
    const refs = await DocComponentsService.findReferences(name)
    if (refs.length > 0) {
      const error = new Error(`Component "${name}" is still used by: ${refs.join(', ')}`) as Error & { statusCode?: number; data?: unknown }
      error.statusCode = 409
      error.data = { references: refs }
      throw error
    }
    await repo.createQueryBuilder().delete().where('id = :id', { id }).execute()
    return { id }
  },

  /** Template/component names referencing this component (ALT-01, BR-004). */
  async findReferences(name: string): Promise<string[]> {
    const ds = await getDataSource()
    const refs: string[] = []
    const templates = await ds.getRepository(DocTemplateSchema).find()
    for (const template of templates as unknown as Array<{ name: string; schemaJson: string }>) {
      if (template.schemaJson.includes(`"componentId":"${name}"`) || template.schemaJson.includes(`"componentId": "${name}"`)) {
        refs.push(`template:${template.name}`)
      }
    }
    const components = await ds.getRepository(DocComponentSchema).find()
    for (const component of components as unknown as Array<{ name: string; tiptapJson: string }>) {
      if (component.name !== name && component.tiptapJson.includes(`"component":"${name}"`)) {
        refs.push(`component:${component.name}`)
      }
    }
    return refs
  },

  /** Render a component standalone (Step 1 preview, AC-001). */
  preview(tiptapJson: unknown, data: Record<string, unknown> = {}): { html: string; warnings: string[] } {
    const tree = TiptapConverterService.toDocNode(tiptapJson)
    return RendererService.render(tree, data)
  },

  /** Registry map for RendererService component-ref (name → DocNode). */
  async registry(): Promise<Record<string, import('../../shared/types/document').DocNode>> {
    const ds = await getDataSource()
    const components = await ds.getRepository(DocComponentSchema).find()
    const map: Record<string, import('../../shared/types/document').DocNode> = {}
    for (const component of components as unknown as Array<{ name: string; tiptapJson: string }>) {
      try {
        map[component.name] = TiptapConverterService.toDocNode(JSON.parse(component.tiptapJson))
      } catch {
        // Skip corrupt entries — render warns unknown component instead.
      }
    }
    return map
  },
}

/** BR-003: looping components must bind at least one `item.*` target. */
function assertLooping(isLooping: boolean, tiptapJson: unknown): void {
  if (!isLooping) return
  const bindings = TiptapConverterService.extractBindings(tiptapJson)
  if (!bindings.some((b) => b.target.split('.')[0] === 'item')) {
    const error = new Error('Looping component must contain at least one item.* binding (BR-003)') as Error & { statusCode?: number }
    error.statusCode = 400
    throw error
  }
}

function renderPreview(tiptapJson: unknown): string {
  try {
    return DocComponentsService.preview(tiptapJson).html
  } catch {
    return ''
  }
}

function notFound(entity: string, id: number): never {
  const error = new Error(`${entity} ${id} not found`) as Error & { statusCode?: number }
  error.statusCode = 404
  throw error
}

function conflict(message: string): never {
  const error = new Error(message) as Error & { statusCode?: number }
  error.statusCode = 409
  throw error
}
