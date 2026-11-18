import YAML, { LineCounter } from 'yaml'
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser'
import { parseErrorLocation, type JsonValue } from './json'

export type DataFormat = 'json' | 'yaml' | 'xml'
export type SourceError = { line: number; column: number; offset: number; message: string }
export type ParseResult = { value: JsonValue; error: SourceError | null; empty: boolean }

export const formatLabel: Record<DataFormat, string> = { json: 'JSON', yaml: 'YAML', xml: 'XML' }
export const formatExtension: Record<DataFormat, string> = { json: 'json', yaml: 'yaml', xml: 'xml' }

function offsetAt(source: string, line: number, column: number): number {
  const lines = source.split('\n')
  return Math.min(source.length, lines.slice(0, line - 1).reduce((total, part) => total + part.length + 1, 0) + column - 1)
}

function errorAt(source: string, line: number, column: number, message: string): SourceError {
  return { line, column, offset: offsetAt(source, line, column), message }
}

function parseYaml(source: string): JsonValue {
  const lineCounter = new LineCounter()
  const document = YAML.parseDocument(source, { lineCounter, uniqueKeys: true })
  if (document.errors.length) {
    const error = document.errors[0]
    const at = lineCounter.linePos(error.pos[0])
    throw errorAt(source, at.line, at.col, error.message.split('\n')[0])
  }
  const value = document.toJS({ maxAliasCount: 100 })
  if (value === undefined) return null
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

function parseXml(source: string): JsonValue {
  const validation = XMLValidator.validate(source)
  if (validation !== true) {
    const { line, col, msg } = validation.err
    throw errorAt(source, line, col, msg)
  }
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
    ignoreDeclaration: true,
  })
  const value = parser.parse(source) as JsonValue
  if (value === null || typeof value !== 'object' || Object.keys(value).length === 0) {
    throw errorAt(source, 1, 1, 'XML 必须包含根元素')
  }
  return value
}

export function parseSource(source: string, format: DataFormat): ParseResult {
  if (!source.trim()) return { value: null, error: null, empty: true }
  try {
    const value = format === 'json' ? JSON.parse(source) as JsonValue
      : format === 'yaml' ? parseYaml(source) : parseXml(source)
    return { value, error: null, empty: false }
  } catch (error) {
    const location = error && typeof error === 'object' && 'offset' in error && 'line' in error
      ? error as SourceError : parseErrorLocation(error, source)
    return { value: null, error: location, empty: false }
  }
}

function xmlRoot(value: JsonValue): Record<string, JsonValue> {
  if (Array.isArray(value)) return { root: { item: value } }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 1 && !keys[0].startsWith('@_') && keys[0] !== '#text') return value
    return { root: value }
  }
  return { root: value }
}

export function serializeSource(value: JsonValue, format: DataFormat, compact = false): string {
  if (format === 'json') return JSON.stringify(value, null, compact ? undefined : 2)
  if (format === 'yaml') return YAML.stringify(value, { lineWidth: 0 })
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    format: !compact,
    indentBy: '  ',
  })
  const output = builder.build(xmlRoot(value)) as string
  if (XMLValidator.validate(output) !== true) throw new Error('数据包含 XML 不支持的键名或结构')
  return output.trimEnd()
}

export function detectFormat(name: string, source: string): DataFormat {
  if (/\.ya?ml$/i.test(name)) return 'yaml'
  if (/\.xml$/i.test(name)) return 'xml'
  if (/\.json$/i.test(name)) return 'json'
  const trimmed = source.trimStart()
  if (trimmed.startsWith('<')) return 'xml'
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  return 'yaml'
}

export function fileNameForFormat(name: string, format: DataFormat): string {
  const stem = name.replace(/\.(json|ya?ml|xml|txt)$/i, '')
  return `${stem}.${formatExtension[format]}`
}
