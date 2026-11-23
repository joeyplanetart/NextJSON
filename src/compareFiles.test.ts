import { expect, test } from 'bun:test'
import { compareText, normalizeDocument } from './compareFiles'

test('pairs modified lines and highlights the changed text', () => {
  const result = compareText('name: old\nkeep', 'name: new\nkeep')
  expect(result.changed).toBe(1)
  expect(result.added).toBe(0)
  expect(result.removed).toBe(0)
  expect(result.rows.map(row => row.kind)).toEqual(['changed', 'equal'])
  expect(result.rows[0].left.filter(segment => segment.changed).map(segment => segment.text).join('')).toBe('old')
  expect(result.rows[0].right.filter(segment => segment.changed).map(segment => segment.text).join('')).toBe('new')
})

test('aligns added and removed lines with line numbers', () => {
  const added = compareText('first\nlast', 'first\nextra\nlast')
  expect(added.rows[1].kind).toBe('added')
  expect(added.rows[1].leftNumber).toBeNull()
  expect(added.rows[1].rightNumber).toBe(2)
  const removed = compareText('first\nextra\nlast', 'first\nlast')
  expect(removed.rows[1].kind).toBe('removed')
  expect(removed.rows[1].leftNumber).toBe(2)
  expect(removed.rows[1].rightNumber).toBeNull()
})

test('structure comparison ignores key order and formatting across JSON and YAML', () => {
  const json = normalizeDocument('{"b":2,"a":{"x":1}}', 'left.json')
  const yaml = normalizeDocument('a:\n  x: 1\nb: 2\n', 'right.yaml')
  expect(json.error).toBeNull()
  expect(yaml.error).toBeNull()
  expect(compareText(json.text, yaml.text).rows.every(row => row.kind === 'equal')).toBe(true)
})

test('structure comparison reports invalid data and does not reinterpret XML', () => {
  expect(normalizeDocument('{oops}', 'bad.json').error).toContain('第 1 行')
  expect(normalizeDocument('<root/>', 'input.xml').error).toContain('XML')
})
