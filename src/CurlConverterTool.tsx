import { useMemo, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { php } from '@codemirror/lang-php'
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { go } from '@codemirror/legacy-modes/mode/go'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { Check, CircleAlert, ClipboardCopy, Code2, RotateCcw, Sparkles } from 'lucide-react'
import { codeLanguages, convertCurl, type CodeLanguage, type Conversion } from './curlConversion'
import './curlConverter.css'

const outputTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent', color: '#dce5f2', fontSize: '12px' },
  '.cm-scroller': { fontFamily: '"SFMono-Regular", Consolas, monospace', lineHeight: '21px' },
  '.cm-content': { padding: '17px 18px' },
  '.cm-gutters': { backgroundColor: '#1b2430', border: 'none', color: '#667890' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#5367ad55 !important' },
}, { dark: true })

const outputHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], color: '#aebcff' },
  { tag: [tags.string, tags.attributeValue], color: '#a5d9b6' },
  { tag: tags.number, color: '#e9bd8e' },
  { tag: [tags.bool, tags.null], color: '#d3b4e9' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#8bc9e8' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#7f8fa7', fontStyle: 'italic' },
  { tag: [tags.typeName, tags.className], color: '#e4c092' },
])

const sample = `curl 'https://api.example.com/v1/items?limit=10' -X POST -H 'accept: application/json' -H 'content-type: application/json' --data-raw '{"name":"NextJSON","active":true}'`

export default function CurlConverterTool() {
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState<CodeLanguage>('python')
  const [results, setResults] = useState<Record<CodeLanguage, Conversion> | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const extension = useMemo(() => {
    const mode = language === 'python' ? python() : language === 'go' ? StreamLanguage.define(go) : language === 'php' ? php() : javascript({ typescript: language === 'bun' })
    return [mode, syntaxHighlighting(outputHighlight), outputTheme]
  }, [language])
  const current = results?.[language]

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(current => current === message ? '' : current), 2600)
  }

  const runConversion = async () => {
    setError('')
    setResults(null)
    setBusy(true)
    try {
      if (input.length > 200_000) throw new Error('cURL 内容过长，请缩短后重试')
      const converted = await convertCurl(input)
      setResults(converted)
      const firstError = codeLanguages.every(item => converted[item.id].error) ? converted.python.error : null
      if (firstError) setError(firstError)
    } catch (cause) { setError(cause instanceof Error ? cause.message : '转换失败') }
    finally { setBusy(false) }
  }

  const copyOutput = async () => {
    if (!current?.code) return
    try {
      if (window.nextjson) window.nextjson.copy(current.code)
      else await navigator.clipboard.writeText(current.code)
      notify('代码已复制')
    } catch { setError('复制失败') }
  }

  return <main className="curl-tool">
    <div className="curl-heading"><div><span className="eyebrow">DEVELOPER TOOLS</span><h1>cURL 转代码</h1><p>粘贴浏览器开发者工具复制的 cURL，请求脚本会在本机生成。</p></div><div className="curl-heading-icon"><Code2 size={25} /></div></div>
    <div className="curl-workspace">
      <section className="curl-pane"><div className="curl-pane-heading"><span><ClipboardCopy size={16} />cURL 请求</span><button onClick={() => { setInput(sample); setResults(null); setError('') }}>填入示例</button></div><textarea aria-label="cURL 请求" value={input} onChange={event => { setInput(event.target.value); setResults(null); setError('') }} spellCheck={false} placeholder="从浏览器 Network 面板复制请求为 cURL，然后粘贴到这里…" /><div className="curl-input-footer"><button className="curl-clear-button" onClick={() => { setInput(''); setResults(null); setError('') }} disabled={!input}><RotateCcw size={14} />清空</button><button className="curl-convert-button" onClick={() => void runConversion()} disabled={busy}><Sparkles size={15} />{busy ? '转换中…' : '转换代码'}</button></div>{error && <div className="curl-error" role="alert"><CircleAlert size={15} />{error}</div>}</section>
      <section className="curl-pane curl-output-pane"><div className="curl-language-tabs" role="tablist" aria-label="输出语言">{codeLanguages.map(item => <button key={item.id} role="tab" aria-selected={language === item.id} className={language === item.id ? 'active' : ''} onClick={() => setLanguage(item.id)}>{item.label}</button>)}</div><div className="curl-output-heading"><span>{codeLanguages.find(item => item.id === language)?.detail}</span><button onClick={() => void copyOutput()} disabled={!current?.code}><ClipboardCopy size={14} />复制代码</button></div><div className="curl-code-wrap">{current?.code ? <CodeMirror value={current.code} extensions={extension} readOnly theme="none" basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false, syntaxHighlighting: false }} /> : <div className="curl-code-empty"><Code2 size={34} /><strong>{current?.error ? '当前语言转换失败' : '等待转换'}</strong><span>{current?.error || '粘贴 cURL 并点击“转换代码”'}</span></div>}</div>{current?.warnings.length ? <div className="curl-warnings"><CircleAlert size={15} /><div>{current.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div></div> : null}</section>
    </div>
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>
}
