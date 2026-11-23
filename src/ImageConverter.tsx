import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Download, FileImage, ImagePlus, Info, RefreshCw, UploadCloud, X } from 'lucide-react'
import { convertImage, formatBytes, imageFormat, imageLabel, outputImageName, type ImageFormat } from './image'

const formats: ImageFormat[] = ['png', 'jpeg', 'webp']

export default function ImageConverter({ active }: { active: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<ImageFormat>('png')
  const [quality, setQuality] = useState(90)
  const [dimensions, setDimensions] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [resultUrl, setResultUrl] = useState('')

  useEffect(() => {
    if (!file) { setSourceUrl(''); setDimensions(''); return }
    const url = URL.createObjectURL(file)
    setSourceUrl(url)
    const image = new Image()
    image.onload = () => setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`)
    image.src = url
    return () => { image.onload = null; URL.revokeObjectURL(url) }
  }, [file])

  useEffect(() => {
    if (!result) { setResultUrl(''); return }
    const url = URL.createObjectURL(result)
    setResultUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [result])

  useEffect(() => active ? window.nextjson?.onOpenShortcut(() => inputRef.current?.click()) : undefined, [active])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(current => current === message ? '' : current), 2600)
  }

  const loadFile = (incoming: File | undefined) => {
    if (!incoming) return
    if (!imageFormat(incoming)) { setError('请选择 JPG、PNG 或 WebP 图片'); return }
    setError('')
    setFile(incoming)
    setResult(null)
    setTarget(imageFormat(incoming) === 'png' ? 'jpeg' : 'png')
  }

  const runConversion = async () => {
    if (!file) return
    setBusy(true); setError(''); setResult(null)
    try { setResult(await convertImage(file, target, quality / 100)); notify('转换完成，可以保存图片') }
    catch (cause) { setError(cause instanceof Error ? cause.message : '图片转换失败') }
    finally { setBusy(false) }
  }

  const saveResult = async () => {
    if (!file || !result) return
    const name = outputImageName(file.name, target)
    try {
      if (window.nextjson) {
        const bytes = new Uint8Array(await result.arrayBuffer())
        if (await window.nextjson.saveImage(bytes, name, target)) notify(`已保存 ${name}`)
      } else {
        const link = document.createElement('a')
        const url = URL.createObjectURL(result)
        link.href = url; link.download = name; link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        notify(`已下载 ${name}`)
      }
    } catch { setError('无法保存图片') }
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault(); setDragging(false)
    loadFile(event.dataTransfer.files[0])
  }

  return <div className="image-tool" onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }} onDrop={onDrop}>
    <input ref={inputRef} id="image-file-input" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden onChange={event => { loadFile(event.target.files?.[0]); event.target.value = '' }} />
    <div className="image-tool-heading"><div><span className="eyebrow">IMAGE TOOLS</span><h1>图片格式转换</h1><p>在 JPG、PNG 与 WebP 之间自由转换，图片只在本机处理。</p></div><div className="image-heading-badge"><FileImage size={16} /> JPG · PNG · WebP</div></div>

    {!file ? <div className={`image-empty-drop ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click() }}>
      <div className="drop-icon"><UploadCloud size={32} /></div><h2>将图片拖到这里</h2><p>或点击选择本地图片开始转换</p><button className="primary-button" onClick={event => { event.stopPropagation(); inputRef.current?.click() }}><ImagePlus size={16} />选择图片</button><div className="drop-formats"><span>JPG / JPEG</span><span>PNG</span><span>WebP</span></div>
    </div> : <div className={`image-tool-grid ${result ? 'with-result' : ''}`}>
      <div className="image-card source-image-card"><div className="image-card-heading"><span><FileImage size={16} />原始图片</span><button className="image-plain-button" onClick={() => inputRef.current?.click()}><RefreshCw size={14} />更换图片</button></div><div className="image-preview checkerboard">{sourceUrl && <img src={sourceUrl} alt="原始图片预览" />}</div><div className="image-detail"><strong title={file.name}>{file.name}</strong><span>{imageLabel[imageFormat(file)!]} · {dimensions || '读取尺寸中'} · {formatBytes(file.size)}</span></div></div>
      <div className="image-options-card"><div className="image-card-heading"><span><ArrowRight size={16} />转换设置</span></div><div className="image-options-content"><label className="image-field-label">输出格式</label><div className="image-format-grid">{formats.map(item => <button key={item} className={`image-format-option ${target === item ? 'active' : ''}`} onClick={() => { setTarget(item); setResult(null) }}><span>{imageLabel[item]}</span><small>{item === 'png' ? '无损 · 支持透明' : item === 'jpeg' ? '兼容性最佳' : '体积更小'}</small>{target === item && <Check size={15} />}</button>)}</div>
      {target !== 'png' && <div className="quality-section"><div className="quality-heading"><label htmlFor="image-quality">图片质量</label><strong>{quality}%</strong></div><input id="image-quality" type="range" min="40" max="100" value={quality} onChange={event => { setQuality(Number(event.target.value)); setResult(null) }} /><div className="quality-scale"><span>更小体积</span><span>更高画质</span></div></div>}
      {target === 'jpeg' && <div className="image-note"><Info size={15} />透明区域将填充为白色</div>}
      <button className="image-convert-button" onClick={runConversion} disabled={busy}>{busy ? '转换中…' : '转换图片'}<ArrowRight size={16} /></button></div></div>
      {result && <div className="image-card result-image-card"><div className="image-card-heading"><span><Check size={16} />转换结果</span><span className="result-ready">已完成</span></div><div className="image-preview checkerboard">{resultUrl && <img src={resultUrl} alt="转换结果预览" />}</div><div className="image-detail"><strong>{outputImageName(file.name, target)}</strong><span>{imageLabel[target]} · {dimensions} · {formatBytes(result.size)}</span></div><button className="image-save-button" onClick={saveResult}><Download size={16} />保存转换后的图片</button></div>}
    </div>}
    {error && <div className="image-error"><X size={15} />{error}</div>}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
    {dragging && <div className="drop-overlay"><ImagePlus size={38} /><strong>松开以打开图片</strong></div>}
  </div>
}
