export type QrRecord = { text: string; createdAt: number }
export const QR_HISTORY_KEY = 'nextjson.qr.history.v1'

export function addQrRecord(records: QrRecord[], text: string, createdAt = Date.now()): QrRecord[] {
  return [{ text, createdAt }, ...records.filter(record => record.text !== text)].slice(0, 5)
}

export function parseQrHistory(raw: string | null): QrRecord[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    const records: QrRecord[] = []
    for (const item of value) {
      if (item && typeof item.text === 'string' && item.text.trim() && item.text.length <= 5000 && typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) && !records.some(record => record.text === item.text)) {
        records.push({ text: item.text, createdAt: item.createdAt })
        if (records.length === 5) break
      }
    }
    return records
  } catch { return [] }
}
