import { useState } from 'react'
import { Braces, ChevronRight, Clock3, FileDiff as FileDiffIcon, FileJson2, Globe2, Image, Layers3, QrCode } from 'lucide-react'
import DataTool from './App'
import ImageConverter from './ImageConverter'
import TimestampTool from './TimestampTool'
import FileDiff from './FileDiff'
import QrCodeTool from './QrCodeTool'
import CompanySitesTool from './CompanySitesTool'

type Tool = 'data' | 'image' | 'qrcode' | 'timestamp' | 'diff' | 'sites'

export default function Workspace() {
  const [activeTool, setActiveTool] = useState<Tool>('data')

  return <div className="app">
    <aside className="sidebar">
      <div className="sidebar-brand"><div className="brand-icon"><Braces size={19} strokeWidth={2.3} /></div><div><strong>Next<span>JSON</span></strong><small>TOOLBOX</small></div></div>
      <div className="sidebar-caption">工作空间</div>
      <div className="sidebar-group"><div className="sidebar-group-label">数据工具</div><button className={`sidebar-item ${activeTool === 'data' ? 'active' : ''}`} onClick={() => setActiveTool('data')}><FileJson2 size={17} /><span>JSON · YAML · XML</span>{activeTool === 'data' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-group"><div className="sidebar-group-label">图片工具</div><button className={`sidebar-item ${activeTool === 'image' ? 'active' : ''}`} onClick={() => setActiveTool('image')}><Image size={17} /><span>格式转换</span>{activeTool === 'image' && <ChevronRight size={14} />}</button><button className={`sidebar-item ${activeTool === 'qrcode' ? 'active' : ''}`} onClick={() => setActiveTool('qrcode')}><QrCode size={17} /><span>二维码生成</span>{activeTool === 'qrcode' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-group"><div className="sidebar-group-label">时间工具</div><button className={`sidebar-item ${activeTool === 'timestamp' ? 'active' : ''}`} onClick={() => setActiveTool('timestamp')}><Clock3 size={17} /><span>时间戳转换</span>{activeTool === 'timestamp' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-group"><div className="sidebar-group-label">文件工具</div><button className={`sidebar-item ${activeTool === 'diff' ? 'active' : ''}`} onClick={() => setActiveTool('diff')}><FileDiffIcon size={17} /><span>文件比对</span>{activeTool === 'diff' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-group"><div className="sidebar-group-label">站点工具</div><button className={`sidebar-item ${activeTool === 'sites' ? 'active' : ''}`} onClick={() => setActiveTool('sites')}><Globe2 size={17} /><span>公司站点</span>{activeTool === 'sites' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-bottom"><Layers3 size={15} /><span>更多工具即将加入</span></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="topbar-page"><span className="topbar-dot" />{{ data: '数据查看与转换', image: '图片格式转换', qrcode: '二维码生成', timestamp: '时间戳转换', diff: '文件比对', sites: '公司站点' }[activeTool]}<span className="topbar-separator">/</span><span className="topbar-file">NextJSON 工具集</span></div><div className="topbar-actions">{(activeTool === 'data' || activeTool === 'image' || activeTool === 'diff') && <span className="shortcut-hint">⌘ O 打开文件</span>}</div></header>
      <div className="tool-surface" hidden={activeTool !== 'data'}><DataTool active={activeTool === 'data'} /></div>
      <div className="tool-surface" hidden={activeTool !== 'image'}><ImageConverter active={activeTool === 'image'} /></div>
      <div className="tool-surface" hidden={activeTool !== 'qrcode'}><QrCodeTool /></div>
      <div className="tool-surface" hidden={activeTool !== 'timestamp'}><TimestampTool /></div>
      <div className="tool-surface" hidden={activeTool !== 'diff'}><FileDiff active={activeTool === 'diff'} /></div>
      <div className="tool-surface" hidden={activeTool !== 'sites'}><CompanySitesTool /></div>
    </div>
  </div>
}
