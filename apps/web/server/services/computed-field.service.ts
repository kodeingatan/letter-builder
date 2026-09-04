import { getDataSource } from '~~/server/utils/db'
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
import { validate, extractRefs, evaluate } from '~~/server/utils/expressions'

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

export interface ComputedColumn {
  id: number
  name: string
  type: 'hidden-computed' | 'readonly-computed'
  expression: string
  dependencies: string[]
}

/**
 * Detect cycles in a dependency graph using DFS.
 * Returns the cycle path if found, otherwise null.
 */
export function detectCycle(
  columns: ComputedColumn[],
  changedColumnId?: number,
  changedDeps?: string[]
): string[] | null {
  const graph = new Map<string, string>()
  const nameToId = new Map<string, number>()

  for (const col of columns) {
    nameToId.set(col.name, col.id)
  }

  for (const col of columns) {
    for (const dep of col.dependencies) {
      if (nameToId.has(dep)) {
        graph.set(`${col.id}->${nameToId.get(dep)}`, dep)
      }
    }
  }

  // If checking a specific change, add the new dependency
  if (changedColumnId !== undefined && changedDeps) {
    for (const dep of changedDeps) {
      if (nameToId.has(dep)) {
        graph.set(`${changedColumnId}->${nameToId.get(dep)}`, dep)
      }
    }
  }

  const visited = new Set<number>()
  const recStack = new Set<number>()
  const path: number[] = []

  function dfs(id: number): number[] | null {
    if (recStack.has(id)) {
      // Found cycle - return the cycle path
      const cycleStart = path.indexOf(id)
      if (cycleStart >= 0) {
        return path.slice(cycleStart).map(n => columns.find(c => c.id === n)?.name || String(n))
      }
      return [String(id)]
    }
    if (visited.has(id)) return null

    visited.add(id)
    recStack.add(id)
    path.push(id)

    // Find dependencies of this column
    const col = columns.find(c => c.id === id)
    if (col) {
      for (const dep of col.dependencies) {
        const depId = nameToId.get(dep)
        if (depId) {
          const result = dfs(depId)
          if (result) return result
        }
      }
    }

    path.pop()
    recStack.delete(id)
    return null
  }

  for (const col of columns) {
    if (!visited.has(col.id)) {
      const result = dfs(col.id)
      if (result) return result
    }
  }

  return null
}

/**
 * Topologically sort computed columns by their dependencies.
 * Returns sorted array (dependencies first).
 */
export function topologicalSort(columns: ComputedColumn[]): ComputedColumn[] {
  const sorted: ComputedColumn[] = []
  const visited = new Set<number>()
  const temp = new Set<number>()

  const nameToId = new Map<string, number>()
  for (const col of columns) {
    nameToId.set(col.name, col.id)
  }

  function visit(col: ComputedColumn) {
    if (visited.has(col.id)) return
    if (temp.has(col.id)) {
      throw httpError(422, 'CYCLIC_DEPENDENCY: Cycle detected during topological sort')
    }

    temp.add(col.id)

    for (const dep of col.dependencies) {
      const depId = nameToId.get(dep)
      if (depId) {
        const depCol = columns.find(c => c.id === depId)
        if (depCol) {
          visit(depCol)
        }
      }
    }

    temp.delete(col.id)
    visited.add(col.id)
    sorted.push(col)
  }

  for (const col of columns) {
    visit(col)
  }

  return sorted
}

/**
 * Validate a computed column expression against sibling column names.
 * Returns { valid, error?, deps? }
 */
export function validateComputedColumn(
  expression: string,
  siblingNames: string[],
  sampleContext?: Record<string, any>
): { valid: boolean; error?: string; deps: string[] } {
  const result = validate(expression, sampleContext)
  if (!result.valid) {
    return { valid: false, error: result.error, deps: result.refs }
  }

  // Check refs are all known siblings
  for (const ref of result.refs) {
    if (!siblingNames.includes(ref)) {
      return {
        valid: false,
        error: `UNKNOWN_REF: '${ref}' is not a known sibling column`,
        deps: result.refs,
      }
    }
  }

  return { valid: true, deps: result.refs }
}

/**
 * Recompute computed column values for a row.
 * Returns { values: { colName: value }, errors: { colName: error } }
 */
export function recomputeRow(
  columns: ComputedColumn[],
  inputValues: Record<string, any>
): { values: Record<string, any>; errors: Record<string, string> } {
  const sorted = topologicalSort(columns)
  const values: Record<string, any> = { ...inputValues }
  const errors: Record<string, string> = {}

  for (const col of sorted) {
    const result = evaluate(col.expression, values)
    if (result.error) {
      errors[col.name] = result.error
    } else {
      values[col.name] = result.value
    }
  }

  return { values, errors }
}

/**
 * Fetch all computed columns for a table.
 */
export async function getComputedColumnsForTable(
  tableId: number
): Promise<ComputedColumn[]> {
  const ds = await getDataSource()
  const repo = ds.getRepository(GlobalTableColumnSchema)
  const columns = await repo.find({
    where: { globalTableId: tableId },
    order: { position: 'ASC' },
  })

  return columns
    .filter(c => c.type === 'hidden-computed' || c.type === 'readonly-computed')
    .map(c => ({
      id: c.id,
      name: c.name,
      type: c.type as 'hidden-computed' | 'readonly-computed',
      expression: c.expression || '',
      dependencies: c.dependencies ? JSON.parse(c.dependencies) : [],
    }))
}

/**
 * Save computed column dependencies (denormalized JSON).
 */
export async function saveComputedDependencies(
  columnId: number,
  deps: string[]
): Promise<void> {
  const ds = await getDataSource()
  const repo = ds.getRepository(GlobalTableColumnSchema)
  await repo.update(columnId, { dependencies: JSON.stringify(deps) })
}