import { useEffect, useState } from 'react'
import { CalendarDays, Check, Clock3, Copy, Pause, Play, RefreshCw, Zap } from 'lucide-react'
import { convertBatch, currentTimestamp, dateToTimestamp, timestampToDate, type BatchDirection, type TimestampUnit } from './timestamp'
import './timestamp.css'

const defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
const timeZones = [...new Set(['Asia/Shanghai', 'UTC', defaultZone, 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', ...Intl.supportedValuesOf('timeZone')])]

function UnitSelect({ value, onChange, label }: { value: TimestampUnit; onChange: (unit: TimestampUnit) => void; label: string }) {
  return <select aria-label={label} value={value} onChange={event => onChange(event.target.value as TimestampUnit)}><option value="seconds">秒 (s)</option><option value="milliseconds">毫秒 (ms)</option></select>
}

function ZoneSelect({ value, onChange, label }: { value: string; onChange: (zone: string) => void; label: string }) {
  return <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{timeZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}</select>
}

async function copyText(text: string): Promise<void> {
  if (window.nextjson) window.nextjson.copy(text)
  else await navigator.clipboard.writeText(text)
}

function LiveClock({ notify }: { notify: (message: string) => void }) {
  const [now, setNow] = useState(Date.now)
  const [unit, setUnit] = useState<TimestampUnit>('seconds')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => setNow(Date.now()), unit === 'seconds' ? 1000 : 100)
    return () => window.clearInterval(timer)
  }, [paused, unit])

  const value = currentTimestamp(unit, now)
  return <section className="ts-live-card"><div><span className="ts-label">当前时间戳</span><div className="ts-live-value"><strong>{value}</strong><span>{unit === 'seconds' ? '秒' : '毫秒'}</span></div></div><div className="ts-live-actions"><button onClick={() => setUnit(current => current === 'seconds' ? 'milliseconds' : 'seconds')}><RefreshCw size={16} />切换单位</button><button onClick={() => copyText(value).then(() => notify('当前时间戳已复制')).catch(() => notify('复制失败'))}><Copy size={16} />复制</button><button className={paused ? 'ts-resume' : 'ts-pause'} onClick={() => { if (paused) setNow(Date.now()); setPaused(!paused) }}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? '继续' : '暂停'}</button></div></section>
}

export default function TimestampTool() {
  const [tab, setTab] = useState<'single' | 'batch'>('single')
  const [timestampInput, setTimestampInput] = useState(() => currentTimestamp('seconds'))
  const [timestampUnit, setTimestampUnit] = useState<TimestampUnit>('seconds')
  const [timestampZone, setTimestampZone] = useState(defaultZone)
  const [timestampResult, setTimestampResult] = useState('')
  const [timestampError, setTimestampError] = useState('')
  const [dateInput, setDateInput] = useState(() => timestampToDate(currentTimestamp('seconds'), 'seconds', defaultZone))
  const [dateZone, setDateZone] = useState(defaultZone)
  const [dateUnit, setDateUnit] = useState<TimestampUnit>('seconds')
  const [dateResult, setDateResult] = useState('')
  const [dateError, setDateError] = useState('')
  const [batchDirection, setBatchDirection] = useState<BatchDirection>('timestamp-to-date')
  const [batchInput, setBatchInput] = useState('')
  const [batchOutput, setBatchOutput] = useState('')
  const [batchUnit, setBatchUnit] = useState<TimestampUnit>('seconds')
  const [batchZone, setBatchZone] = useState(defaultZone)
  const [batchSummary, setBatchSummary] = useState('')
  const [toast, setToast] = useState('')

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(current => current === message ? '' : current), 2600)
  }

  const copyResult = (value: string) => {
    copyText(value).then(() => notify('结果已复制')).catch(() => notify('复制失败'))
  }

  const runTimestampToDate = () => {
    try { setTimestampResult(timestampToDate(timestampInput, timestampUnit, timestampZone)); setTimestampError('') }
    catch (error) { setTimestampResult(''); setTimestampError(error instanceof Error ? error.message : '转换失败') }
  }

  const runDateToTimestamp = () => {
    try { setDateResult(dateToTimestamp(dateInput, dateUnit, dateZone)); setDateError('') }
    catch (error) { setDateResult(''); setDateError(error instanceof Error ? error.message : '转换失败') }
  }

  const runBatch = () => {
    if (!batchInput.trim()) { setBatchSummary('请先输入需要转换的内容'); setBatchOutput(''); return }
    const result = convertBatch(batchInput, batchDirection, batchUnit, batchZone)
    setBatchOutput(result.output)
    setBatchSummary(`成功 ${result.success} 项，失败 ${result.failed} 项`)
  }

  return <div className="timestamp-tool"><div className="timestamp-heading"><span className="eyebrow">TIME TOOLS</span><h1>时间戳转换</h1><p>按指定时区转换 Unix 时间戳与日期时间，支持单个及批量处理。</p></div>
    <LiveClock notify={notify} />
    <div className="ts-panel"><div className="ts-tabs" role="tablist" aria-label="转换模式"><button role="tab" aria-selected={tab === 'single'} className={tab === 'single' ? 'active' : ''} onClick={() => setTab('single')}>单个转换</button><button role="tab" aria-selected={tab === 'batch'} className={tab === 'batch' ? 'active' : ''} onClick={() => setTab('batch')}>批量转换</button></div>
      {tab === 'single' ? <div className="ts-single">
        <section className="ts-section"><h2><Clock3 size={18} />时间戳转日期时间</h2><div className="ts-form-row ts-timestamp-row"><label><span>时间戳</span><input aria-label="输入时间戳" value={timestampInput} onChange={event => { setTimestampInput(event.target.value); setTimestampResult(''); setTimestampError('') }} placeholder="例如 1795401405" /></label><label><span>单位</span><UnitSelect label="时间戳单位" value={timestampUnit} onChange={value => { setTimestampUnit(value); setTimestampResult('') }} /></label><label><span>时区</span><ZoneSelect label="时间戳转换时区" value={timestampZone} onChange={value => { setTimestampZone(value); setTimestampResult('') }} /></label><button className="ts-secondary-button" onClick={() => { setTimestampInput(currentTimestamp(timestampUnit)); setTimestampResult(''); setTimestampError('') }}><Zap size={16} />填入当前</button><button className="ts-primary-button" onClick={runTimestampToDate}>转换</button></div><div className="ts-result-row"><label><span>转换结果</span><input aria-label="时间戳转换结果" readOnly value={timestampResult} placeholder="转换结果" /></label><button className="ts-copy-button" disabled={!timestampResult} onClick={() => copyResult(timestampResult)}><Copy size={15} />复制</button></div>{timestampError && <div className="ts-error" role="alert">{timestampError}</div>}</section>
        <section className="ts-section"><h2><CalendarDays size={18} />日期时间转时间戳</h2><div className="ts-form-row ts-date-row"><label><span>日期时间</span><input aria-label="输入日期时间" value={dateInput} onChange={event => { setDateInput(event.target.value); setDateResult(''); setDateError('') }} placeholder="YYYY-MM-DD HH:mm:ss" /></label><label><span>时区</span><ZoneSelect label="日期时间转换时区" value={dateZone} onChange={value => { setDateZone(value); setDateResult('') }} /></label><button className="ts-primary-button" onClick={runDateToTimestamp}>转换</button></div><div className="ts-result-row"><label><span>转换结果</span><input aria-label="日期时间转换结果" readOnly value={dateResult} placeholder="转换结果" /></label><label className="ts-result-unit"><span>单位</span><UnitSelect label="结果单位" value={dateUnit} onChange={value => { setDateUnit(value); setDateResult('') }} /></label><button className="ts-copy-button" disabled={!dateResult} onClick={() => copyResult(dateResult)}><Copy size={15} />复制</button></div>{dateError && <div className="ts-error" role="alert">{dateError}</div>}</section>
      </div> : <div className="ts-batch"><div className="ts-batch-controls"><div><span className="ts-label">转换方向</span><div className="ts-direction"><button className={batchDirection === 'timestamp-to-date' ? 'active' : ''} onClick={() => { setBatchDirection('timestamp-to-date'); setBatchOutput(''); setBatchSummary('') }}>时间戳 → 日期时间</button><button className={batchDirection === 'date-to-timestamp' ? 'active' : ''} onClick={() => { setBatchDirection('date-to-timestamp'); setBatchOutput(''); setBatchSummary('') }}>日期时间 → 时间戳</button></div></div><label><span>单位</span><UnitSelect label="批量转换单位" value={batchUnit} onChange={value => { setBatchUnit(value); setBatchOutput('') }} /></label><label><span>时区</span><ZoneSelect label="批量转换时区" value={batchZone} onChange={value => { setBatchZone(value); setBatchOutput('') }} /></label></div><div className="ts-batch-grid"><label><span>输入内容 · 每行一项</span><textarea aria-label="批量转换输入" value={batchInput} onChange={event => { setBatchInput(event.target.value); setBatchOutput(''); setBatchSummary('') }} placeholder={batchDirection === 'timestamp-to-date' ? '1795401405\n1795401468' : '2026-11-23 10:36:45\n2026-11-23 10:37:48'} /></label><label><span>转换结果</span><textarea aria-label="批量转换结果" readOnly value={batchOutput} placeholder="转换结果会显示在这里" /></label></div><div className="ts-batch-footer"><span>{batchSummary || '支持秒、毫秒和不同时区；错误会标注行号。'}</span><div><button className="ts-copy-button" disabled={!batchOutput} onClick={() => copyResult(batchOutput)}><Copy size={15} />复制结果</button><button className="ts-primary-button" onClick={runBatch}>批量转换</button></div></div></div>}
    </div>
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </div>
}
