import { ExpressionService } from './expression.service'
import type { DocNode } from '../../shared/types/document'
import type { BindingSpec, RequirementSpec } from '../../shared/types/persuratan'

/**
 * Tiptap JSON ↔ DocNode converter (Task 07).
 *
 * Custom editor nodes: `docBinding` (atom inline: name/target/view/component),
 * `docRepeater` (source/item container), `docCondition` (field/operator/value
 * container, optional elseContent). Standard nodes map to text/heading/
 * paragraph/image/divider; tables flatten to paragraphs (documented).
 */

interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

const BINDING_RE = /\{\{\s*([^{}]+?)\s*\}\}/g

function inlineText(node: TiptapNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'docBinding') return `{{${String(node.attrs?.target ?? '')}}}`
  if (node.type === 'hardBreak') return '\n'
  return (node.content ?? []).map(inlineText).join('')
}

function bindingSpecsFrom(nodes: TiptapNode[] | undefined): BindingSpec[] {
  const specs: BindingSpec[] = []
  const walk = (list: TiptapNode[] | undefined) => {
    for (const node of list ?? []) {
      if (node.type === 'docBinding') {
        specs.push({
          name: String(node.attrs?.name ?? ''),
          target: String(node.attrs?.target ?? ''),
          view: (node.attrs?.view as BindingSpec['view']) ?? 'text',
          ...(node.attrs?.component ? { component: String(node.attrs.component) } : {}),
        })
      }
      walk(node.content)
    }
  }
  walk(nodes)
  return specs
}

export const TiptapConverterService = {
  /** Extract binding specs from a Tiptap doc (BR-003 check helper). */
  extractBindings(tiptapJson: unknown): BindingSpec[] {
    const doc = tiptapJson as TiptapNode
    return bindingSpecsFrom(doc?.content)
  },

  /** Tiptap JSON → DocNode tree (components + template canvas import). */
  toDocNode(tiptapJson: unknown): DocNode {
    const doc = tiptapJson as TiptapNode
    if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) {
      throw new Error('Invalid Tiptap document: root must be {type:"doc",content:[]}')
    }
    return { type: 'document', children: doc.content.map((node) => convertBlock(node)) }
  },

  /** DocNode tree → Tiptap JSON (load template/component into the editor). */
  toTiptap(tree: DocNode): Record<string, unknown> {
    const content: TiptapNode[] = []
    const blocks = tree.type === 'document' ? (tree.children ?? []) : [tree]
    for (const block of blocks) {
      // Layout containers flatten to their children (Tiptap has no equivalent).
      if (['section', 'header', 'content', 'footer', 'document'].includes(block.type) && block.children?.length) {
        for (const child of block.children) content.push(docNodeToTiptap(child))
      } else {
        content.push(docNodeToTiptap(block))
      }
    }
    return { type: 'doc', content }
  },

  /** Scan `{{path}}` requirements; repeater-scoped `item.*` marked scoped. */
  scanRequirements(tree: DocNode): RequirementSpec[] {
    const found = new Map<string, boolean>()
    const add = (path: string, scoped: boolean) => {
      if (path === '' || path === 'current_date') return
      if (!found.has(path)) found.set(path, scoped)
      else if (!scoped) found.set(path, false)
    }
    const walk = (node: DocNode, scopeVars: Set<string>) => {
      if (node.type === 'repeater') {
        // The loop source itself is a data requirement (e.g. `employees`;
        // `item.trips` stays scoped).
        const source = String(node.props?.source ?? '')
        const root = source.split('.')[0]
        if (root !== '') add(source, scopeVars.has(root))
        const itemVar = String(node.props?.item ?? 'item')
        const childScope = new Set(scopeVars)
        childScope.add(itemVar)
        childScope.add(typeof node.props?.index === 'string' ? node.props.index : `${itemVar}_index`)
        for (const child of node.children ?? []) walk(child, childScope)
        return
      }
      const texts: string[] = []
      const collect = (value: unknown) => {
        if (typeof value === 'string') texts.push(value)
        else if (Array.isArray(value)) value.forEach(collect)
        else if (value && typeof value === 'object') Object.values(value).forEach(collect)
      }
      collect(node.props ?? {})
      for (const text of texts) {
        for (const match of text.matchAll(BINDING_RE)) {
          const path = match[1].trim()
          const root = path.split('.')[0]
          add(path, scopeVars.has(root))
        }
      }
      for (const child of node.children ?? []) walk(child, scopeVars)
      for (const child of node.elseChildren ?? []) walk(child, scopeVars)
    }
    walk(tree, new Set())
    return [...found.entries()].map(([path, scoped]) => ({ path, scoped }))
  },

  /**
   * Resolve a requirement value against one mapping entry.
   * `context` carries: admin data (step.*), master accessor, system values.
   */
  async resolveMapping(
    entry: { kind: string; ref: string },
    context: {
      data: Record<string, unknown>
      system: Record<string, unknown>
      masterCell: (table: string, column: string, rowId: number) => Promise<unknown>
      masterList: (table: string) => Promise<Array<Record<string, unknown>>>
    },
  ): Promise<unknown> {
    switch (entry.kind) {
      case 'value':
        return entry.ref
      case 'field':
        return ExpressionService.resolvePath(entry.ref, context.data)
      case 'system':
        return ExpressionService.resolvePath(entry.ref, context.system)
      case 'master-cell': {
        // ref: `table.column#rowId`
        const match = /^([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)#(\d+)$/.exec(entry.ref)
        if (!match) throw new Error(`Invalid master-cell ref "${entry.ref}" (want table.column#id)`)
        return context.masterCell(match[1], match[2], Number(match[3]))
      }
      case 'master-list': {
        if (!/^[a-z][a-z0-9_]*$/.test(entry.ref)) throw new Error(`Invalid master-list ref "${entry.ref}"`)
        return context.masterList(entry.ref)
      }
      default:
        throw new Error(`Unknown mapping kind "${entry.kind}"`)
    }
  },
}

function convertBlock(node: TiptapNode): DocNode {
  switch (node.type) {
    case 'paragraph':
      return { type: 'paragraph', props: { content: inlineText(node) } }
    case 'heading':
      return { type: 'heading', props: { content: inlineText(node), level: Number(node.attrs?.level ?? 2) } }
    case 'blockquote':
      return { type: 'paragraph', props: { content: inlineText(node) } }
    case 'bulletList':
    case 'orderedList': {
      const items = (node.content ?? []).filter((c) => c.type === 'listItem')
      const prefix = node.type === 'orderedList' ? (i: number) => `${i + 1}. ` : () => '• '
      return {
        type: 'section',
        children: items.map((item, i) => ({ type: 'paragraph', props: { content: prefix(i) + inlineText(item) } })),
      }
    }
    case 'image': {
      const src = String(node.attrs?.src ?? '')
      return { type: 'image', props: { src, alt: String(node.attrs?.alt ?? '') } }
    }
    case 'horizontalRule':
      return { type: 'divider' }
    case 'hardBreak':
      return { type: 'text', props: { content: '' } }
    case 'table': {
      // Static tables flatten to paragraphs (documented limitation).
      const cells: string[] = []
      const walkCells = (list: TiptapNode[] | undefined) => {
        for (const child of list ?? []) {
          if (child.type === 'tableCell' || child.type === 'tableHeader') cells.push(inlineText(child))
          else walkCells(child.content)
        }
      }
      walkCells(node.content)
      return { type: 'section', children: cells.map((c) => ({ type: 'paragraph', props: { content: c } })) }
    }
    case 'docRepeater':
      return {
        type: 'repeater',
        props: { source: String(node.attrs?.source ?? ''), item: String(node.attrs?.item ?? 'item') },
        children: (node.content ?? []).map((child) => convertBlock(child)),
      }
    case 'docCondition':
      return {
        type: 'condition',
        props: {
          field: String(node.attrs?.field ?? ''),
          operator: String(node.attrs?.operator ?? 'eq'),
          value: node.attrs?.value ?? '',
        },
        children: (node.content ?? []).map((child) => convertBlock(child)),
        elseChildren: Array.isArray(node.attrs?.elseContent)
          ? (node.attrs.elseContent as TiptapNode[]).map((child) => convertBlock(child))
          : [],
      }
    case 'docBinding': {
      const view = String(node.attrs?.view ?? 'text')
      const target = String(node.attrs?.target ?? '')
      if (view === 'image') return { type: 'image', props: { src: `{{${target}}}`, alt: String(node.attrs?.name ?? '') } }
      if (view === 'component') {
        return { type: 'component-ref', props: { componentId: String(node.attrs?.component ?? ''), propsOverride: {} } }
      }
      return { type: 'text', props: { content: `{{${target}}}` } }
    }
    default:
      // Unknown/custom blocks degrade to their inline text (never data loss).
      return { type: 'paragraph', props: { content: inlineText(node) } }
  }
}

function textToTiptapInline(text: string): TiptapNode[] {
  const out: TiptapNode[] = []
  let last = 0
  for (const match of text.matchAll(BINDING_RE)) {
    if (match.index > last) out.push({ type: 'text', text: text.slice(last, match.index) })
    out.push({
      type: 'docBinding',
      attrs: { name: match[1].trim(), target: match[1].trim(), view: 'text' },
    })
    last = (match.index ?? 0) + match[0].length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  if (out.length === 0) out.push({ type: 'text', text })
  return out
}

function docNodeToTiptap(node: DocNode): TiptapNode {
  const props = node.props ?? {}
  switch (node.type) {
    case 'paragraph':
    case 'text':
      return { type: 'paragraph', content: textToTiptapInline(String(props.content ?? '')) }
    case 'heading':
      return { type: 'heading', attrs: { level: Number(props.level ?? 2) }, content: textToTiptapInline(String(props.content ?? '')) }
    case 'image':
      return { type: 'image', attrs: { src: String(props.src ?? ''), alt: String(props.alt ?? '') } }
    case 'divider':
    case 'pagebreak':
      return { type: 'horizontalRule' }
    case 'repeater':
      return {
        type: 'docRepeater',
        attrs: { source: String(props.source ?? ''), item: String(props.item ?? 'item') },
        content: (node.children ?? []).map(docNodeToTiptap),
      }
    case 'condition':
      return {
        type: 'docCondition',
        attrs: { field: String(props.field ?? ''), operator: String(props.operator ?? 'eq'), value: String(props.value ?? '') },
        content: (node.children ?? []).map(docNodeToTiptap),
      }
    case 'component-ref':
      return {
        type: 'docBinding',
        attrs: { name: String(props.componentId ?? ''), target: '', view: 'component', component: String(props.componentId ?? '') },
      }
    default:
      return { type: 'paragraph', content: textToTiptapInline((node.children ?? []).map((c) => String(c.props?.content ?? '')).join(' ')) }
  }
}
