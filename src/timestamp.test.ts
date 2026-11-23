import { expect, test } from 'bun:test'
import { convertBatch, currentTimestamp, dateToTimestamp, timestampToDate } from './timestamp'

test('converts seconds and milliseconds with the chosen time zone', () => {
  expect(timestampToDate('1795401405', 'seconds', 'Asia/Shanghai')).toBe('2026-11-23 10:36:45')
  expect(timestampToDate('1795401405123', 'milliseconds', 'Asia/Shanghai')).toBe('2026-11-23 10:36:45.123')
  expect(timestampToDate('1795401405', 'seconds', 'UTC')).toBe('2026-11-23 02:36:45')
  expect(dateToTimestamp('2026-11-23 10:36:45.123', 'milliseconds', 'Asia/Shanghai')).toBe('1795401405123')
  expect(dateToTimestamp('2026-11-23 10:36:45', 'seconds', 'Asia/Shanghai')).toBe('1795401405')
  expect(currentTimestamp('seconds', 1795401405123)).toBe('1795401405')
  expect(timestampToDate('-0.5', 'seconds', 'UTC')).toBe('1969-12-31 23:59:59.500')
  expect(dateToTimestamp('1969-12-31 23:59:59.500', 'seconds', 'UTC')).toBe('-0.5')
})

test('rejects invalid dates and ambiguous daylight-saving times', () => {
  expect(() => dateToTimestamp('2026-02-30 12:00:00', 'seconds', 'UTC')).toThrow('日期时间无效')
  expect(() => dateToTimestamp('2026-11-01 01:30:00', 'seconds', 'America/New_York')).toThrow('不唯一')
  expect(() => dateToTimestamp('2026-03-08 02:30:00', 'seconds', 'America/New_York')).toThrow('不存在')
  expect(() => timestampToDate('abc', 'seconds', 'UTC')).toThrow('有效的秒级时间戳')
})

test('batch conversion preserves lines and reports bad rows', () => {
  expect(convertBatch('1795401405\ninvalid\n999999999999999999', 'timestamp-to-date', 'seconds', 'UTC')).toMatchObject({ success: 1, failed: 2 })
  expect(convertBatch('2026-11-23 10:36:45\n\n2026-11-23 10:36:45.123', 'date-to-timestamp', 'milliseconds', 'Asia/Shanghai').output).toBe('1795401405000\n\n1795401405123')
})
