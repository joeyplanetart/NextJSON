export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return `${parent}.${key}`
  return `${parent}[${JSON.stringify(key)}]`
}

export function valueText(value: JsonValue): string {
  return JSON.stringify(value, null, 2)
}

export function preview(value: JsonValue): string {
  if (Array.isArray(value)) return `Array(${value.length})`
  if (value !== null && typeof value === 'object') return `Object(${Object.keys(value).length})`
  return JSON.stringify(value)
}

export function kind(value: JsonValue): 'array' | 'object' | 'string' | 'number' | 'boolean' | 'null' {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value as 'object' | 'string' | 'number' | 'boolean'
}

export type Match = { path: string; ancestors: string[] }

export function findMatches(root: JsonValue, query: string): Match[] {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return []
  const matches: Match[] = []
  function walk(value: JsonValue, path: string, ancestors: string[], key?: string) {
    const keyMatches = key?.toLocaleLowerCase().includes(needle)
    const valueMatches = value === null || typeof value !== 'object'
      ? String(value).toLocaleLowerCase().includes(needle)
      : false
    if (keyMatches || valueMatches) matches.push({ path, ancestors })
    if (value !== null && typeof value === 'object') {
      const entries = Array.isArray(value) ? value.map((item, index) => [index, item] as const) : Object.entries(value)
      for (const [childKey, childValue] of entries) {
        walk(childValue, childPath(path, childKey), [...ancestors, path], String(childKey))
      }
    }
  }
  walk(root, '$', [])
  return matches
}

export function parseErrorLocation(error: unknown, source: string): { line: number; column: number; offset: number; message: string } {
  const message = error instanceof Error ? error.message : String(error)
  const lineColumn = message.match(/line (\d+) column (\d+)/i)
  const position = message.match(/position (\d+)/i)
  let offset = position ? Number(position[1]) : source.length
  if (lineColumn) {
    const line = Number(lineColumn[1])
    const column = Number(lineColumn[2])
    const lines = source.split('\n')
    offset = lines.slice(0, line - 1).reduce((n, part) => n + part.length + 1, 0) + column - 1
  }
  offset = Math.max(0, Math.min(offset, source.length))
  const before = source.slice(0, offset).split('\n')
  return { line: before.length, column: before.at(-1)!.length + 1, offset, message }
}
