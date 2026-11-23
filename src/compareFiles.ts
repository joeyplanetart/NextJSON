import { diffArrays, diffWordsWithSpace } from 'diff'
import { detectFormat, parseSource } from './formats'
import type { JsonValue } from './json'

export type DiffKind = 'equal' | 'added' | 'removed' | 'changed'
export type DiffSegment = { text: string; changed: boolean }
export type DiffRow = {
  kind: DiffKind
  leftNumber: number | null
  rightNumber: number | null
  left: DiffSegment[]
  right: DiffSegment[]
}
export type DiffResult = { rows: DiffRow[]; added: number; removed: number; changed: number }

function linesOf(text: string): string[] {
  if (!text) return []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (text.endsWith('\n')) lines.pop()
  return lines
}

function segments(left: string, right: string): [DiffSegment[], DiffSegment[]] {
  const changes = diffWordsWithSpace(left, right)
  return [
    changes.filter(part => !part.added).map(part => ({ text: part.value, changed: !!part.removed })),
    changes.filter(part => !part.removed).map(part => ({ text: part.value, changed: !!part.added })),
  ]
}

export function compareText(leftText: string, rightText: string): DiffResult {
  const leftLines = linesOf(leftText)
  const rightLines = linesOf(rightText)
  const rows: DiffRow[] = []
  let leftNumber = 1
  let rightNumber = 1
  let added = 0
  let removed = 0
  let changed = 0
  let pendingLeft: string[] = []
  let pendingRight: string[] = []

  const flush = () => {
    const paired = Math.min(pendingLeft.length, pendingRight.length)
    for (let index = 0; index < paired; index++) {
      const [left, right] = segments(pendingLeft[index], pendingRight[index])
      rows.push({ kind: 'changed', leftNumber: leftNumber++, rightNumber: rightNumber++, left, right })
      changed++
    }
    for (const value of pendingLeft.slice(paired)) {
      rows.push({ kind: 'removed', leftNumber: leftNumber++, rightNumber: null, left: [{ text: value, changed: true }], right: [] })
      removed++
    }
    for (const value of pendingRight.slice(paired)) {
      rows.push({ kind: 'added', leftNumber: null, rightNumber: rightNumber++, left: [], right: [{ text: value, changed: true }] })
      added++
    }
    pendingLeft = []
    pendingRight = []
  }

  for (const part of diffArrays(leftLines, rightLines)) {
    if (part.removed) pendingLeft.push(...part.value)
    else if (part.added) pendingRight.push(...part.value)
    else {
      flush()
      for (const value of part.value) {
        const same = [{ text: value, changed: false }]
        rows.push({ kind: 'equal', leftNumber: leftNumber++, rightNumber: rightNumber++, left: same, right: same })
      }
    }
  }
  flush()
  return { rows, added, removed, changed }
}

function sortKeys(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sortKeys(child)])) as JsonValue
  }
  return value
}

export function normalizeDocument(source: string, name: string): { text: string; error: string | null } {
  if (!source.trim()) return { text: '', error: `${name}：请先输入内容。` }
  const format = detectFormat(name, source)
  if (format === 'xml') return { text: '', error: '结构比对支持 JSON 和 YAML；XML 请使用文本比对。' }
  const parsed = parseSource(source, format)
  if (parsed.error) return { text: '', error: `${name}：第 ${parsed.error.line} 行 ${parsed.error.message}` }
  return { text: JSON.stringify(sortKeys(parsed.value), null, 2), error: null }
}
