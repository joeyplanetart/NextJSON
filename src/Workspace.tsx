import { useState } from 'react'
import { Braces, ChevronRight, Clock3, FileJson2, Image, Layers3 } from 'lucide-react'
import DataTool from './App'
import ImageConverter from './ImageConverter'
import TimestampTool from './TimestampTool'

type Tool = 'data' | 'image' | 'timestamp'

export default function Workspace() {
  const [activeTool, setActiveTool] = useState<Tool>('data')

  return <div className="app">
    <aside className="sidebar">
      <div className="sidebar-brand"><div className="brand-icon"><Braces size={19} strokeWidth={2.3} /></div><div><strong>Next<span>JSON</span></strong><small>TOOLBOX</small></div></div>
      <div className="sidebar-caption">工作空间</div>
      <div className="sidebar-group"><div className="sidebar-group-label">数据工具</div><button className={`sidebar-item ${activeTool === 'data' ? 'active' : ''}`} onClick={() => setActiveTool('data')}><FileJson2 size={17} /><span>JSON · YAML · XML</span>{activeTool === 'data' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-group"><div className="sidebar-group-label">图片工具</div><button className={`sidebar-item ${activeTool === 'image' ? 'active' : ''}`} onClick={() => setActiveTool('image')}><Image size={17} /><span>格式转换</span>{activeTool === 'image' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-group"><div className="sidebar-group-label">时间工具</div><button className={`sidebar-item ${activeTool === 'timestamp' ? 'active' : ''}`} onClick={() => setActiveTool('timestamp')}><Clock3 size={17} /><span>时间戳转换</span>{activeTool === 'timestamp' && <ChevronRight size={14} />}</button></div>
      <div className="sidebar-bottom"><Layers3 size={15} /><span>更多工具即将加入</span></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="topbar-page"><span className="topbar-dot" />{{ data: '数据查看与转换', image: '图片格式转换', timestamp: '时间戳转换' }[activeTool]}<span className="topbar-separator">/</span><span className="topbar-file">NextJSON 工具集</span></div><div className="topbar-actions">{activeTool !== 'timestamp' && <span className="shortcut-hint">⌘ O 打开文件</span>}</div></header>
      <div className="tool-surface" hidden={activeTool !== 'data'}><DataTool active={activeTool === 'data'} /></div>
      <div className="tool-surface" hidden={activeTool !== 'image'}><ImageConverter active={activeTool === 'image'} /></div>
      <div className="tool-surface" hidden={activeTool !== 'timestamp'}><TimestampTool /></div>
    </div>
  </div>
}
