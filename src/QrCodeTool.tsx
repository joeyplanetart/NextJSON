import { useEffect, useRef, useState } from 'react'
import { Check, Clock3, Copy, Download, QrCode, RotateCcw, Trash2, WandSparkles } from 'lucide-react'
import { toDataURL } from 'qrcode'
import { addQrRecord, parseQrHistory, QR_HISTORY_KEY, type QrRecord } from './qrHistory'
import './qrcode.css'

function readHistory(): QrRecord[] {
  try { return parseQrHistory(localStorage.getItem(QR_HISTORY_KEY)) }
  catch { return [] }
}

function displayTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(value)
}

export default function QrCodeTool() {
  const [input, setInput] = useState('')
  const [size, setSize] = useState(512)
  const [imageUrl, setImageUrl] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [history, setHistory] = useState<QrRecord[]>(readHistory)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const requestId = useRef(0)

  useEffect(() => {
    try { localStorage.setItem(QR_HISTORY_KEY, JSON.stringify(history)) }
    catch { /* Storage may be unavailable; the current session still keeps its history. */ }
  }, [history])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(current => current === message ? '' : current), 2600)
  }

  const editInput = (value: string) => {
    requestId.current++
    setInput(value)
    setImageUrl('')
    setGeneratedText('')
    setBusy(false)
    setError('')
  }

  const generate = async (value = input) => {
    const text = value
    if (!text.trim()) { setError('请输入要生成二维码的文本或网址'); return }
    if (text.length > 5000) { setError('内容过长，请控制在 5,000 个字符以内'); return }
    const id = ++requestId.current
    setInput(value)
    setBusy(true)
    setError('')
    setImageUrl('')
    try {
      const url = await toDataURL(text, { type: 'image/png', width: size, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#132033ff', light: '#ffffffff' } })
      if (id !== requestId.current) return
      setImageUrl(url)
      setGeneratedText(text)
      setHistory(current => addQrRecord(current, text))
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : '二维码生成失败，请缩短内容后重试')
    } finally { if (id === requestId.current) setBusy(false) }
  }

  const saveImage = async () => {
    if (!imageUrl) return
    const name = `qrcode-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.png`
    try {
      if (window.nextjson) {
        const binary = atob(imageUrl.split(',')[1])
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
        if (await window.nextjson.saveImage(bytes, name, 'png')) notify('二维码已保存')
      } else {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = name
        link.click()
        notify('二维码已下载')
      }
    } catch { setError('无法保存二维码图片') }
  }

  const copyContent = async () => {
    try {
      if (window.nextjson) window.nextjson.copy(generatedText)
      else await navigator.clipboard.writeText(generatedText)
      notify('内容已复制')
    } catch { setError('复制失败') }
  }

  return <main className="qr-tool">
    <div className="qr-heading"><div><span className="eyebrow">QR CODE TOOLS</span><h1>二维码生成</h1><p>把网址或文本生成二维码，保存为 PNG。最近 5 条记录仅保存在本机。</p></div><div className="qr-heading-icon"><QrCode size={25} /></div></div>
    <div className="qr-layout">
      <section className="qr-card qr-editor-card"><div className="qr-card-heading"><WandSparkles size={17} />生成内容</div><div className="qr-editor-body"><label htmlFor="qr-input">文本或网址</label><textarea id="qr-input" value={input} onChange={event => editInput(event.target.value)} placeholder="输入网址、文本、联系方式等内容…" spellCheck={false} /><div className="qr-options"><label htmlFor="qr-size">图片尺寸</label><select id="qr-size" value={size} onChange={event => { setSize(Number(event.target.value)); setImageUrl(''); setGeneratedText('') }}><option value={256}>256 × 256</option><option value={512}>512 × 512</option><option value={1024}>1024 × 1024</option></select><span>PNG · 白色背景</span></div><button className="qr-generate-button" disabled={busy} onClick={() => void generate()}><QrCode size={17} />{busy ? '生成中…' : '生成二维码'}</button>{error && <div className="qr-error" role="alert">{error}</div>}</div></section>
      <section className="qr-card qr-preview-card"><div className="qr-card-heading"><QrCode size={17} />预览</div><div className="qr-preview">{imageUrl ? <img src={imageUrl} alt="生成的二维码" /> : <div className="qr-preview-empty"><QrCode size={52} /><strong>等待生成二维码</strong><span>输入内容后点击“生成二维码”</span></div>}</div><div className="qr-preview-actions"><button onClick={copyContent} disabled={!imageUrl}><Copy size={15} />复制内容</button><button className="qr-save-button" onClick={() => void saveImage()} disabled={!imageUrl}><Download size={15} />保存 PNG</button></div></section>
    </div>
    <section className="qr-card qr-history-card"><div className="qr-history-heading"><div><Clock3 size={17} /><strong>最近记录</strong><span>{history.length} / 5</span></div><button onClick={() => setHistory([])} disabled={!history.length}><Trash2 size={14} />清空记录</button></div>{history.length ? <div className="qr-history-list">{history.map(record => <button key={record.text} className="qr-history-item" onClick={() => void generate(record.text)} title={record.text}><QrCode size={16} /><span>{record.text}</span><time>{displayTime(record.createdAt)}</time><RotateCcw size={13} /></button>)}</div> : <div className="qr-history-empty">生成后的内容会保留在这里，最多 5 条。</div>}</section>
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>
}
