import { expect, test } from 'bun:test'
import { addQrRecord, parseQrHistory } from './qrHistory'

test('keeps five most recent unique QR contents', () => {
  let records = [] as ReturnType<typeof addQrRecord>
  for (let index = 0; index < 6; index++) records = addQrRecord(records, `item ${index}`, index)
  expect(records.map(record => record.text)).toEqual(['item 5', 'item 4', 'item 3', 'item 2', 'item 1'])
  records = addQrRecord(records, 'item 2', 9)
  expect(records.map(record => record.text)).toEqual(['item 2', 'item 5', 'item 4', 'item 3', 'item 1'])
})

test('ignores malformed locally stored records', () => {
  expect(parseQrHistory('{bad')).toEqual([])
  expect(parseQrHistory(JSON.stringify([{ text: 'valid', createdAt: 1 }, { text: '', createdAt: 2 }, { text: 'valid', createdAt: 3 }]))).toEqual([{ text: 'valid', createdAt: 1 }])
})
