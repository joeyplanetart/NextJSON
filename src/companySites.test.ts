import { expect, test } from 'bun:test'
import { companySiteGroups, companySites } from './companySites'

test('contains all 18 supplied sites with distinct IDs and secure URLs', () => {
  expect(companySiteGroups.map(group => group.sites.length)).toEqual([5, 3, 10])
  expect(new Set(companySites.map(site => site.id)).size).toBe(18)
  expect(companySites.every(site => site.url.startsWith('https://'))).toBe(true)
  expect(companySites.find(site => site.code === 'CPBUS')?.url).toBe('https://www.cafepress.com/business')
  expect(companySites.find(site => site.code === 'PCRUK')?.url).toBe(companySites.find(site => site.code === 'PCRUS')?.url)
})
