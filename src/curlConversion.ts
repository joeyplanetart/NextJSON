import type { Warnings } from 'curlconverter'

export type CodeLanguage = 'python' | 'javascript' | 'bun' | 'go' | 'php'
export type Conversion = { code: string; warnings: string[]; error: string | null }
export const codeLanguages: { id: CodeLanguage; label: string; detail: string }[] = [
  { id: 'python', label: 'Python', detail: 'requests' },
  { id: 'javascript', label: 'JavaScript', detail: 'Node.js fetch' },
  { id: 'bun', label: 'Bun', detail: 'Bun fetch' },
  { id: 'go', label: 'Go', detail: 'net/http' },
  { id: 'php', label: 'PHP', detail: 'cURL' },
]

function runGenerator(converter: typeof import('curlconverter'), source: string, language: CodeLanguage): [string, Warnings] {
  if (language === 'python') return converter.toPythonWarn(source)
  if (language === 'go') return converter.toGoWarn(source)
  if (language === 'php') return converter.toPhpWarn(source)
  const [code, warnings] = converter.toNodeWarn(source)
  const builtInFetchCode = code.replace(/^import fetch(?:, \{[^}]+\})? from 'node-fetch';\n/, '')
  return language === 'bun' ? [`// Save as request.ts and run: bun request.ts\n\n${builtInFetchCode}`, warnings] : [builtInFetchCode, warnings]
}

export async function convertCurl(source: string): Promise<Record<CodeLanguage, Conversion>> {
  const input = source.trim().replace(/^\$\s+/, '')
  if (!/^curl(?:\s|$)/.test(input)) throw new Error('请粘贴以 curl 开头的命令')
  const converter = await import('curlconverter')
  return Object.fromEntries(codeLanguages.map(({ id }) => {
    try {
      const [code, warnings] = runGenerator(converter, input, id)
      return [id, { code, warnings: [...new Set(warnings.map(([, message]) => message))], error: null }]
    } catch (cause) {
      return [id, { code: '', warnings: [], error: cause instanceof Error ? cause.message : '转换失败' }]
    }
  })) as Record<CodeLanguage, Conversion>
}
