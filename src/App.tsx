import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { yaml as yamlLanguage } from '@codemirror/lang-yaml'
import { xml as xmlLanguage } from '@codemirror/lang-xml'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { linter, lintGutter, type LintSource } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import {
  Check, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown,
  CircleAlert, Clipboard, Code2, Copy, Download, FileJson2, FolderOpen,
  ListTree, Search, Sparkles, WrapText, X,
} from 'lucide-react'
import { childPath, findMatches, kind, preview, valueText, type JsonValue } from './json'
import { detectFormat, fileNameForFormat, formatLabel, parseSource, serializeSource, type DataFormat } from './formats'

const demo = `{
  "project": "NextJSON",
  "version": "1.0.0",
  "description": "A better way to explore your data",
  "features": [
    "Tree view",
    "Instant search",
    "JSONPath copying"
  ],
  "settings": {
    "theme": "dark",
    "indent": 2,
    "autoFormat": true
  },
  "contributors": [
    { "name": "Alex", "role": "developer" },
    { "name": "Sam", "role": "designer" }
  ],
  "active": true,
  "metadata": null
}`

const editorTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent', color: '#dce3ee', fontSize: '13px' },
  '.cm-scroller': { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace', lineHeight: '22px' },
  '.cm-content': { padding: '20px 24px', caretColor: '#8c9eff' },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: '#526074', paddingLeft: '10px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#ffffff08' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#5367ad55 !important' },
  '.cm-cursor': { borderLeftColor: '#9aaaff' },
  '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px wavy #ff777e' },
  '.cm-diagnostic-error': { borderLeftColor: '#ff777e' },
  '.cm-tooltip': { backgroundColor: '#222b3a', border: '1px solid #3c4658', color: '#e8edf5' },
}, { dark: true })

const editorHighlight = HighlightStyle.define([
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: '#b4c5ff' },
  { tag: [tags.string, tags.attributeValue], color: '#a3d9b5' },
  { tag: tags.number, color: '#e9bd8e' },
  { tag: [tags.bool, tags.null], color: '#d3b4e9' },
  { tag: [tags.tagName, tags.typeName], color: '#b4c5ff' },
  { tag: tags.attributeName, color: '#e9bd8e' },
  { tag: [tags.lineComment, tags.blockComment], color: '#8291a6', fontStyle: 'italic' },
  { tag: [tags.separator, tags.punctuation, tags.brace, tags.squareBracket, tags.angleBracket, tags.definitionOperator], color: '#9aa9bd' },
  { tag: tags.invalid, color: '#ff858c', textDecoration: 'underline' },
])

type MenuState = { x: number; y: number; path: string; value: JsonValue } | null

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const needle = query.trim().toLocaleLowerCase()
  const lower = text.toLocaleLowerCase()
  const parts: React.ReactNode[] = []
  let cursor = 0
  while (cursor < text.length) {
    const index = lower.indexOf(needle, cursor)
    if (index < 0) break
    parts.push(text.slice(cursor, index), <mark key={index}>{text.slice(index, index + needle.length)}</mark>)
    cursor = index + needle.length
  }
  parts.push(text.slice(cursor))
  return <>{parts}</>
}

function countNodes(value: JsonValue): number {
  if (value === null || typeof value !== 'object') return 1
  return 1 + Object.values(value).reduce<number>((total, item) => total + countNodes(item), 0)
}

function allExpandablePaths(value: JsonValue, path = '$'): string[] {
  if (value === null || typeof value !== 'object') return []
  return [path, ...Object.entries(value).flatMap(([key, child]) => allExpandablePaths(child, childPath(path, Array.isArray(value) ? Number(key) : key)))]
}

function initialExpanded(format: DataFormat, source: string): Set<string> {
  const paths = new Set(['$'])
  if (format === 'xml') {
    const parsed = parseSource(source, format)
    if (!parsed.error && parsed.value && typeof parsed.value === 'object' && !Array.isArray(parsed.value)) {
      const rootKey = Object.keys(parsed.value)[0]
      if (rootKey) paths.add(childPath('$', rootKey))
    }
  }
  return paths
}

export default function App({ active }: { active: boolean }) {
  const [source, setSource] = useState(demo)
  const [fileName, setFileName] = useState('sample.json')
  const [format, setFormat] = useState<DataFormat>('json')
  const [query, setQuery] = useState('')
  const [activeMatch, setActiveMatch] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['$', '$.settings', '$.features']))
  const [selected, setSelected] = useState('$')
  const [menu, setMenu] = useState<MenuState>(null)
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState(false)
  const editor = useRef<ReactCodeMirrorRef>(null)
  const searchInput = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => parseSource(source, format), [source, format])
  const extensions = useMemo(() => {
    const language = format === 'json' ? json() : format === 'yaml' ? yamlLanguage() : xmlLanguage()
    const diagnosticSource: LintSource = format === 'json' ? jsonParseLinter() : view => {
      const error = parseSource(view.state.doc.toString(), format).error
      return error ? [{ from: error.offset, to: Math.min(error.offset + 1, view.state.doc.length), severity: 'error', message: error.message }] : []
    }
    return [language, syntaxHighlighting(editorHighlight), linter(diagnosticSource), lintGutter(), editorTheme]
  }, [format])
  const matches = useMemo(() => parsed.error || parsed.empty ? [] : findMatches(parsed.value, query), [parsed, query])
  const matchPaths = useMemo(() => new Set(matches.map(match => match.path)), [matches])
  const nodeCount = useMemo(() => parsed.error || parsed.empty ? 0 : countNodes(parsed.value), [parsed])

  useEffect(() => {
    if (!query.trim()) return
    setExpanded(previous => {
      const next = new Set(previous)
      for (const match of matches) match.ancestors.forEach(path => next.add(path))
      return next
    })
  }, [matches, query])

  useEffect(() => {
    const match = matches[activeMatch]
    if (!match) return
    const row = [...document.querySelectorAll<HTMLElement>('[data-node-path]')].find(element => element.dataset.nodePath === match.path)
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeMatch, matches, expanded])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault(); searchInput.current?.focus(); searchInput.current?.select()
      }
      if (event.key === 'Escape') { setMenu(null); if (document.activeElement === searchInput.current) searchInput.current?.blur() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(current => current === message ? '' : current), 2500)
  }, [])

  const loadContent = useCallback((content: string, name: string) => {
    const detected = detectFormat(name, content)
    setSource(content); setFileName(name); setFormat(detected); setSelected('$'); setQuery(''); setExpanded(initialExpanded(detected, content))
    notify(`已打开 ${name}`)
  }, [notify])

  const openFile = useCallback(async () => {
    if (window.nextjson) {
      try { const file = await window.nextjson.openFile(); if (file) loadContent(file.content, file.name) }
      catch { notify('无法读取文件') }
    } else {
      const input = document.createElement('input')
      input.type = 'file'; input.accept = '.json,.yaml,.yml,.xml,.txt,application/json,application/xml,text/plain'
      input.onchange = async () => { const file = input.files?.[0]; if (file) loadContent(await file.text(), file.name) }
      input.click()
    }
  }, [loadContent, notify])

  useEffect(() => active ? window.nextjson?.onOpenShortcut(openFile) : undefined, [active, openFile])

  const saveFile = async () => {
    if (window.nextjson) {
      try { if (await window.nextjson.saveFile(source, fileName, format)) notify('文件已保存') }
      catch { notify('无法保存文件') }
    } else {
      const anchor = document.createElement('a')
      anchor.href = URL.createObjectURL(new Blob([source], { type: format === 'xml' ? 'application/xml' : format === 'yaml' ? 'application/yaml' : 'application/json' }))
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(anchor.href)
      notify('文件已下载')
    }
  }

  const transform = (compact: boolean) => {
    if (parsed.error || parsed.empty) { notify(`请先输入有效的 ${formatLabel[format]}`); return }
    try { setSource(serializeSource(parsed.value, format, compact)); notify(`${formatLabel[format]} 已${compact ? '压缩' : '美化'}`) }
    catch (error) { notify(error instanceof Error ? error.message : '格式化失败') }
  }

  const convertTo = (target: DataFormat) => {
    if (parsed.error || parsed.empty) { notify(`请先输入有效的 ${formatLabel[format]}`); return }
    try {
      const converted = serializeSource(parsed.value, target)
      setSource(converted)
      setFormat(target)
      setFileName(current => fileNameForFormat(current, target))
      setSelected('$')
      setExpanded(initialExpanded(target, converted))
      notify(`已转换为 ${formatLabel[target]}`)
    } catch (error) { notify(error instanceof Error ? error.message : '转换失败') }
  }

  const copy = async (text: string, label: string) => {
    try {
      if (window.nextjson) window.nextjson.copy(text)
      else await navigator.clipboard.writeText(text)
      notify(`${label}已复制`)
    } catch { notify('复制失败') }
    setMenu(null)
  }

  const showError = () => {
    if (!parsed.error || !editor.current?.view) return
    const view = editor.current.view
    view.dispatch({ selection: { anchor: parsed.error.offset, head: Math.min(parsed.error.offset + 1, source.length) }, scrollIntoView: true })
    view.focus()
  }

  const toggle = (path: string) => setExpanded(previous => {
    const next = new Set(previous)
    if (next.has(path)) next.delete(path); else next.add(path)
    return next
  })

  const renderNode = (value: JsonValue, path: string, label: string, depth: number): React.ReactNode => {
    const type = kind(value)
    const expandable = type === 'array' || type === 'object'
    const isExpanded = expanded.has(path)
    const isMatch = matchPaths.has(path)
    const isActiveMatch = matches[activeMatch]?.path === path && query.trim() !== ''
    const raw = preview(value)
    const text = raw
    return <div key={path}>
      <div
        className={`tree-row ${selected === path ? 'selected' : ''} ${isMatch ? 'matched' : ''} ${isActiveMatch ? 'active-match' : ''}`}
        style={{ paddingLeft: 14 + depth * 20 }}
        data-node-path={path}
        onClick={() => { setSelected(path); if (expandable) toggle(path) }}
        onContextMenu={event => { event.preventDefault(); setSelected(path); setMenu({ x: Math.min(event.clientX, window.innerWidth - 210), y: Math.min(event.clientY, window.innerHeight - 105), path, value }) }}
      >
        <span className="tree-caret">{expandable ? isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : <span className="tree-dot" />}</span>
        <span className={`tree-key ${path === '$' ? 'root-key' : ''}`}><Highlight text={label} query={query} /></span>
        <span className="tree-colon">:</span>
        <span className={`tree-value type-${type}`} title={text}><Highlight text={text} query={query} /></span>
        <span className="tree-row-actions" onClick={event => event.stopPropagation()}>
          <button title="复制 JSONPath" onClick={() => copy(path, 'JSONPath')}><Copy size={13} /></button>
        </span>
      </div>
      {expandable && isExpanded && Object.entries(value as JsonValue[] | Record<string, JsonValue>).map(([key, child]) =>
        renderNode(child, childPath(path, type === 'array' ? Number(key) : key), key, depth + 1),
      )}
    </div>
  }

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault(); setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) loadContent(await file.text(), file.name)
  }

  return <div className="data-tool" onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }} onDrop={onDrop} onClick={() => menu && setMenu(null)}>
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="primary-button" onClick={openFile}><FolderOpen size={16} />打开文件</button>
        <button className="toolbar-button" onClick={saveFile}><Download size={16} />保存</button>
        <div className="toolbar-divider" />
        <label className="format-picker"><span>格式</span><select aria-label="解析格式" value={format} onChange={event => { const next = event.target.value as DataFormat; setFormat(next); setFileName(current => fileNameForFormat(current, next)); setExpanded(initialExpanded(next, source)) }}><option value="json">JSON</option><option value="yaml">YAML</option><option value="xml">XML</option></select></label>
        <label className="convert-picker"><select aria-label="转换为" value="" onChange={event => convertTo(event.target.value as DataFormat)}><option value="" disabled>转换为…</option>{(['json', 'yaml', 'xml'] as DataFormat[]).filter(item => item !== format).map(item => <option value={item} key={item}>{formatLabel[item]}</option>)}</select></label>
        <div className="toolbar-divider" />
        <button className="toolbar-button" onClick={() => transform(false)} title={`美化 ${formatLabel[format]}`}><Sparkles size={16} />美化</button>
        <button className="toolbar-button" onClick={() => transform(true)} title={format === 'yaml' ? 'YAML 不支持压缩' : `压缩 ${formatLabel[format]}`} disabled={format === 'yaml'}><WrapText size={16} />压缩</button>
      </div>
      <div className="search-box"><Search size={16} /><input ref={searchInput} value={query} onChange={event => { setQuery(event.target.value); setActiveMatch(0) }} onKeyDown={event => { if (event.key === 'Enter' && matches.length) { event.preventDefault(); setActiveMatch(index => (index + (event.shiftKey ? -1 : 1) + matches.length) % matches.length) } }} placeholder="搜索键或值..." aria-label="搜索键或值" />{query && <><span className="search-count">{matches.length ? `${activeMatch + 1}/${matches.length}` : '0 结果'}</span><button className="search-clear" onClick={() => setQuery('')} title="清除搜索"><X size={14} /></button></>}<kbd>⌘ F</kbd></div>
    </div>

    <main className="workspace">
      <section className="pane source-pane">
        <div className="pane-header"><div className="pane-title"><Code2 size={16} /><span>源码编辑器</span></div><div className="pane-meta"><span className="live-dot" />实时解析</div></div>
        <div className="editor-wrap"><CodeMirror ref={editor} value={source} onChange={setSource} extensions={extensions} basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, highlightSelectionMatches: true, syntaxHighlighting: false }} theme="none" placeholder={`在这里粘贴 ${formatLabel[format]}，或拖入文件...`} /></div>
        {parsed.error && <button className="error-banner" onClick={showError}><CircleAlert size={17} /><span><strong>解析错误</strong> · 第 {parsed.error.line} 行，第 {parsed.error.column} 列<br /><small>{parsed.error.message}</small></span><ChevronRight size={16} /></button>}
        {!parsed.error && !parsed.empty && <div className="source-status"><Check size={14} />有效的 {formatLabel[format]} <span>·</span> {source.split('\n').length} 行 <span>·</span> {new Blob([source]).size.toLocaleString()} 字节</div>}
      </section>

      <section className="pane tree-pane">
        <div className="pane-header"><div className="pane-title"><ListTree size={16} /><span>树状视图</span><span className="node-count">{nodeCount} 个节点</span></div><div className="tree-tools"><button title="全部展开" onClick={() => setExpanded(new Set(allExpandablePaths(parsed.value)))} disabled={!!parsed.error || parsed.empty}><ChevronsUpDown size={16} /></button><button title="全部折叠" onClick={() => setExpanded(new Set())} disabled={!!parsed.error || parsed.empty}><ChevronsDownUp size={16} /></button></div></div>
        <div className="tree-scroll">
          {parsed.error ? <div className="empty-tree"><CircleAlert size={27} /><strong>无法生成树状视图</strong><span>修复左侧的 {formatLabel[format]} 语法错误后即可查看</span></div>
            : parsed.empty ? <div className="empty-tree"><FileJson2 size={28} /><strong>等待 {formatLabel[format]} 数据</strong><span>粘贴内容或打开文件</span></div>
            : renderNode(parsed.value, '$', 'root', 0)}
        </div>
        <div className="tree-footer"><span><span className="footer-swatch key-swatch" />键</span><span><span className="footer-swatch string-swatch" />字符串</span><span><span className="footer-swatch number-swatch" />数字</span><span><span className="footer-swatch bool-swatch" />布尔值</span></div>
      </section>
    </main>

    <footer className="app-footer"><span><FileJson2 size={14} /> {fileName}</span><span className="footer-tip">右键节点复制 JSONPath 或值 <span>·</span> 拖入文件以打开</span><span className={`footer-valid ${parsed.error ? 'invalid' : ''}`}><span className="status-dot" />{parsed.error ? '语法错误' : parsed.empty ? '等待输入' : `${formatLabel[format]} 有效`}</span></footer>

    {menu && <div className="context-menu" style={{ left: menu.x, top: menu.y }} onClick={event => event.stopPropagation()}><div className="context-heading">{menu.path}</div><button onClick={() => copy(menu.path, 'JSONPath')}><Clipboard size={15} />复制 JSONPath<span>⌘⇧C</span></button><button onClick={() => copy(valueText(menu.value), '节点值')}><Copy size={15} />复制节点值</button></div>}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
    {dragging && <div className="drop-overlay"><FileJson2 size={38} /><strong>松开以打开数据文件</strong></div>}
  </div>
}
