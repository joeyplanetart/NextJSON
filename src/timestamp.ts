import { Temporal } from '@js-temporal/polyfill'

export type TimestampUnit = 'seconds' | 'milliseconds'
export type BatchDirection = 'timestamp-to-date' | 'date-to-timestamp'

const maxEpochMilliseconds = 8_640_000_000_000_000n

export function currentTimestamp(unit: TimestampUnit, now = Date.now()): string {
  return unit === 'seconds' ? String(Math.floor(now / 1000)) : String(now)
}

function parseEpochMilliseconds(input: string, unit: TimestampUnit): number {
  const text = input.trim()
  const pattern = unit === 'seconds' ? /^(-?)(\d+)(?:\.(\d{1,3}))?$/ : /^-?\d+$/
  const match = text.match(pattern)
  if (!match) throw new Error(unit === 'seconds' ? '请输入有效的秒级时间戳（最多 3 位小数）' : '请输入有效的毫秒级时间戳')
  let milliseconds: bigint
  if (unit === 'seconds') {
    milliseconds = BigInt(match[2]) * 1000n + BigInt((match[3] || '').padEnd(3, '0') || '0')
    if (match[1] === '-') milliseconds = -milliseconds
  } else milliseconds = BigInt(text)
  if (milliseconds > maxEpochMilliseconds || milliseconds < -maxEpochMilliseconds) throw new Error('时间戳超出可转换范围')
  return Number(milliseconds)
}

function pad(value: number, width = 2): string { return String(value).padStart(width, '0') }

export function timestampToDate(input: string, unit: TimestampUnit, timeZone: string): string {
  const date = Temporal.Instant.fromEpochMilliseconds(parseEpochMilliseconds(input, unit)).toZonedDateTimeISO(timeZone)
  const base = `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)} ${pad(date.hour)}:${pad(date.minute)}:${pad(date.second)}`
  return date.millisecond ? `${base}.${pad(date.millisecond, 3)}` : base
}

export function dateToTimestamp(input: string, unit: TimestampUnit, timeZone: string): string {
  const match = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (!match) throw new Error('日期时间格式应为 YYYY-MM-DD HH:mm:ss')
  let date: Temporal.PlainDateTime
  try {
    date = Temporal.PlainDateTime.from({
      year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
      hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6]),
      millisecond: Number((match[7] || '').padEnd(3, '0') || '0'),
    }, { overflow: 'reject' })
  } catch { throw new Error('日期时间无效，请检查年月日和时分秒') }
  let epochMilliseconds: number
  try { epochMilliseconds = date.toZonedDateTime(timeZone, { disambiguation: 'reject' }).epochMilliseconds }
  catch { throw new Error('该时间在所选时区不存在或不唯一（夏令时）') }
  if (unit === 'milliseconds') return String(epochMilliseconds)
  return String(epochMilliseconds / 1000)
}

export function convertBatch(input: string, direction: BatchDirection, unit: TimestampUnit, timeZone: string): { output: string; success: number; failed: number } {
  let success = 0
  let failed = 0
  const output = input.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return ''
    try {
      const converted = direction === 'timestamp-to-date' ? timestampToDate(line, unit, timeZone) : dateToTimestamp(line, unit, timeZone)
      success++
      return converted
    } catch (error) {
      failed++
      return `第 ${index + 1} 行错误：${error instanceof Error ? error.message : '转换失败'}`
    }
  }).join('\n')
  return { output, success, failed }
}
