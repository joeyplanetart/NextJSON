import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Download, ExternalLink, Search, X } from 'lucide-react'
import { toDataURL } from 'qrcode'
import { companySiteGroups, companySites, type CompanySite } from './companySites'
import './companySites.css'

export default function CompanySitesTool() {
  const [qrImages, setQrImages] = useState<Record<number, string>>({})
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [expandedSite, setExpandedSite] = useState<CompanySite | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all(companySites.map(async site => {
      try {
        const image = await toDataURL(site.url, { type: 'image/png', width: 512, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#132033ff', light: '#ffffffff' } })
        if (!cancelled) setQrImages(current => ({ ...current, [site.id]: image }))
      } catch { if (!cancelled) setError('部分站点的二维码生成失败') }
    }))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!expandedSite) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpandedSite(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [expandedSite])

  const groups = useMemo(() => companySiteGroups.map(group => ({ ...group, sites: group.sites.filter(site => `${site.code} ${site.id} ${site.url}`.toLowerCase().includes(query.trim().toLowerCase())) })).filter(group => group.sites.length), [query])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(current => current === message ? '' : current), 2600)
  }

  const copyUrl = async (site: CompanySite) => {
    try {
      if (window.nextjson) window.nextjson.copy(site.url)
      else await navigator.clipboard.writeText(site.url)
      notify(`已复制 ${site.code} 链接`)
    } catch { setError('复制链接失败') }
  }

  const saveQr = async (site: CompanySite) => {
    const image = qrImages[site.id]
    if (!image) return
    const name = `${site.code}-qrcode.png`
    try {
      if (window.nextjson) {
        const bytes = Uint8Array.from(atob(image.split(',')[1]), character => character.charCodeAt(0))
        if (await window.nextjson.saveImage(bytes, name, 'png')) notify(`已保存 ${name}`)
      } else {
        const link = document.createElement('a')
        link.href = image
        link.download = name
        link.click()
        notify(`已下载 ${name}`)
      }
    } catch { setError('保存二维码失败') }
  }

  return <main className="company-sites-tool">
    <div className="company-sites-heading"><div><span className="eyebrow">COMPANY SITES</span><h1>公司站点</h1><p>按业务分类查看站点链接和二维码，扫描或保存二维码即可快速访问。</p></div><span className="company-sites-total">{companySites.length} 个站点</span></div>
    <div className="company-sites-search"><Search size={16} /><input aria-label="搜索公司站点" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索站点代号、ID 或网址" />{query && <button aria-label="清空搜索" onClick={() => setQuery('')}><X size={15} /></button>}</div>
    {groups.length ? groups.map(group => <section key={group.title} className="company-site-group">
      <div className="company-site-group-heading"><div><span className="company-site-group-icon">{group.icon}</span><h2>{group.title}</h2><span>{group.sites.length} 个站点</span></div><small>{group.description}</small></div>
      <div className="company-site-grid">{group.sites.map(site => <article key={site.id} className="company-site-card">
        <button className="company-site-qr" onClick={() => setExpandedSite(site)} disabled={!qrImages[site.id]} aria-label={`放大查看 ${site.code} 二维码`} title="点击放大二维码">
          {qrImages[site.id] ? <img src={qrImages[site.id]} alt={`${site.code} 站点二维码`} /> : <span>二维码生成中…</span>}
        </button>
        <div className="company-site-details">
          <div className="company-site-info"><span className="company-site-icon">{site.icon}</span><div><strong>{site.code}</strong><small>ID: {site.id}</small></div></div>
          <a className="company-site-url" href={site.url} target="_blank" rel="noopener noreferrer" title={site.url}>{site.url.replace(/^https:\/\//, '')}</a>
          <div className="company-site-actions"><button onClick={() => void copyUrl(site)} title="复制链接"><Copy size={14} />复制</button><button onClick={() => void saveQr(site)} disabled={!qrImages[site.id]} title="保存二维码"><Download size={14} />保存</button><a href={site.url} target="_blank" rel="noopener noreferrer" title="打开站点"><ExternalLink size={14} />访问</a></div>
        </div>
      </article>)}</div>
    </section>) : <div className="company-sites-empty">没有找到匹配的站点</div>}
    {expandedSite && qrImages[expandedSite.id] && <div className="company-site-modal-backdrop" onClick={() => setExpandedSite(null)}>
      <div className="company-site-modal" role="dialog" aria-modal="true" aria-labelledby="site-qr-title" onClick={event => event.stopPropagation()}>
        <div className="company-site-modal-heading"><div><h2 id="site-qr-title">{expandedSite.code} 二维码</h2><span>{expandedSite.url}</span></div><button aria-label="关闭二维码放大视图" onClick={() => setExpandedSite(null)} autoFocus><X size={18} /></button></div>
        <img src={qrImages[expandedSite.id]} alt={`${expandedSite.code} 放大的站点二维码`} />
        <span className="company-site-modal-tip">使用手机扫描访问站点 · 按 Esc 关闭</span>
      </div>
    </div>}
    {error && <div className="company-sites-error" role="alert">{error}</div>}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>
}
