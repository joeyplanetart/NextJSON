import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowLeftRight, FileDiff as FileDiffIcon, FolderOpen, RotateCcw } from 'lucide-react'
import { compareText, normalizeDocument, type DiffRow, type DiffSegment } from './compareFiles'
import './fileDiff.css'

type InputSide = { name: string; text: string }
type Side = 'left' | 'right'
const emptySide = (side: Side): InputSide => ({ name: side === 'left' ? '原始内容' : '目标内容', text: '' })
const MAX_SIZE = 1024 * 1024

function renderSegments(segments: DiffSegment[]) {
  return segments.map((segment, index) => <span key={index} className={segment.changed ? 'diff-inline-change' : undefined}>{segment.text || '\u00a0'}</span>)
}

function DiffCell({ row, side }: { row: DiffRow; side: Side }) {
  const number = side === 'left' ? row.leftNumber : row.rightNumber
  const segments = side === 'left' ? row.left : row.right
  const kind = row.kind === 'changed' ? (side === 'left' ? 'removed' : 'added') : row.kind
  return <div className={`diff-cell diff-${kind}`}><span className="diff-line-number">{number ?? ''}</span><span className="diff-line-text">{number === null ? '\u00a0' : renderSegments(segments)}</span></div>
}

export default function FileDiff({ active }: { active: boolean }) {
  const [left, setLeft] = useState<InputSide>(emptySide('left'))
  const [right, setRight] = useState<InputSide>(emptySide('right'))
  const [mode, setMode] = useState<'text' | 'structure'>('text')
  const [error, setError] = useState('')
  const [currentDifference, setCurrentDifference] = useState(-1)
  const leftInput = useRef<HTMLInputElement>(null)
  const rightInput = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => active ? window.nextjson?.onOpenShortcut(() => leftInput.current?.click()) : undefined, [active])

  const loadFile = async (file: File, side: Side) => {
    if (file.size > MAX_SIZE) { setError('文件超过 1 MB。请使用较小的文本文件进行比对。'); return }
    try {
      const text = await file.text()
      if (text.includes('\0')) { setError('这似乎是二进制文件；文件比对仅支持文本。'); return }
      const update = side === 'left' ? setLeft : setRight
      update({ name: file.name, text })
      setError('')
    } catch { setError(`无法读取 ${file.name}`) }
  }

  const comparison = useMemo(() => {
    if (!left.text && !right.text) return null
    if (left.text.length > MAX_SIZE || right.text.length > MAX_SIZE) return { error: '内容超过 1 MB，请缩短后重试。', result: null }
    let leftText = left.text
    let rightText = right.text
    if (mode === 'structure') {
      const a = normalizeDocument(left.text, left.name)
      const b = normalizeDocument(right.text, right.name)
      if (a.error || b.error) return { error: a.error || b.error, result: null }
      leftText = a.text
      rightText = b.text
    }
    const result = compareText(leftText, rightText)
    if (result.rows.length > 10000) return { error: '比对结果超过 10,000 行，请使用较小的文件。', result: null }
    return { error: null, result }
  }, [left, right, mode])

  const differences = useMemo(() => comparison?.result?.rows.flatMap((row, index) => row.kind === 'equal' ? [] : [index]) ?? [], [comparison])
  const nextDifference = () => {
    if (!differences.length) return
    const next = (currentDifference + 1) % differences.length
    setCurrentDifference(next)
    resultRef.current?.querySelector(`[data-diff-row="${differences[next]}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const inputCard = (side: Side) => {
    const value = side === 'left' ? left : right
    const setValue = side === 'left' ? setLeft : setRight
    const ref = side === 'left' ? leftInput : rightInput
    return <section className="diff-input-card" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void loadFile(file, side) }}>
      <div className="diff-input-heading"><span><span className={`diff-side-indicator ${side}`} />{side === 'left' ? '原始文件' : '目标文件'}</span><span className="diff-file-name" title={value.name}>{value.name}</span></div>
      <textarea aria-label={side === 'left' ? '原始文件内容' : '目标文件内容'} spellCheck={false} value={value.text} placeholder="拖入文本文件，或在这里粘贴内容…" onChange={event => { setValue({ ...value, text: event.target.value }); setError('') }} />
      <div className="diff-input-actions"><input ref={ref} type="file" onChange={event => { const file = event.target.files?.[0]; if (file) void loadFile(file, side); event.target.value = '' }} hidden /><button onClick={() => ref.current?.click()}><FolderOpen size={14} /> 打开文件</button><button onClick={() => { setValue(emptySide(side)); setError('') }} disabled={!value.text}><RotateCcw size={13} /> 清空</button><small>{value.text.length.toLocaleString()} 字符</small></div>
    </section>
  }

  return <main className="file-diff-tool">
    <div className="file-diff-heading"><div><span className="eyebrow">FILE COMPARISON</span><h1>文件比对</h1><p>对比两份文本，快速定位新增、删除与修改。支持 JSON、YAML、XML、CSV、日志和代码等文本文件。</p></div><div className="file-diff-heading-icon"><FileDiffIcon size={25} /></div></div>
    <div className="diff-input-grid">{inputCard('left')}{inputCard('right')}</div>
    <div className="diff-controls"><div className="diff-mode"><button className={mode === 'text' ? 'active' : ''} onClick={() => { setMode('text'); setCurrentDifference(-1) }}>文本比对</button><button className={mode === 'structure' ? 'active' : ''} onClick={() => { setMode('structure'); setCurrentDifference(-1) }}>JSON / YAML 结构比对</button></div><button className="diff-swap" onClick={() => { setLeft(right); setRight(left); setCurrentDifference(-1) }}><ArrowLeftRight size={14} /> 交换两侧</button></div>
    {mode === 'structure' && <p className="diff-mode-note">结构比对会忽略缩进和对象键顺序，数组顺序仍参与比对。</p>}
    {(error || comparison?.error) && <div className="diff-error" role="alert">{error || comparison?.error}</div>}
    <section className="diff-result-panel"><div className="diff-result-heading"><div className="diff-result-title">比对结果 {comparison?.result && <span className="diff-count">{comparison.result.changed} 修改 · {comparison.result.added} 新增 · {comparison.result.removed} 删除</span>}</div><button onClick={nextDifference} disabled={!differences.length}><ArrowDown size={14} /> 下一处差异{differences.length ? ` (${Math.max(currentDifference + 1, 0)}/${differences.length})` : ''}</button></div>
      {!comparison?.result ? <div className="diff-empty"><FileDiffIcon size={35} /><strong>选择两份文件开始比对</strong><span>也可以直接在上方输入或粘贴文本</span></div>
        : comparison.result.rows.length === 0 || differences.length === 0 ? <div className="diff-empty"><FileDiffIcon size={35} /><strong>内容相同</strong><span>没有发现差异</span></div>
          : <div ref={resultRef} className="diff-result-scroll"><div className="diff-column-heading"><span>{left.name}</span><span>{right.name}</span></div>{comparison.result.rows.map((row, index) => <div key={index} data-diff-row={index} className={`diff-result-row ${differences[currentDifference] === index ? 'focused' : ''}`}><DiffCell row={row} side="left" /><DiffCell row={row} side="right" /></div>)}</div>}
    </section>
  </main>
}
