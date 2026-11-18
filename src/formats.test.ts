import { expect, test } from 'bun:test'
import { detectFormat, fileNameForFormat, parseSource, serializeSource } from './formats'

test('detects YAML and XML files and content', () => {
  expect(detectFormat('config.yml', 'a: 1')).toBe('yaml')
  expect(detectFormat('feed.xml', '<feed/>')).toBe('xml')
  expect(detectFormat('unknown.txt', '<root/>')).toBe('xml')
  expect(fileNameForFormat('config.yml', 'json')).toBe('config.json')
})

test('parses YAML values and reports error location', () => {
  expect(parseSource('name: Ada\nactive: true\nitems:\n  - 1', 'yaml').value).toEqual({ name: 'Ada', active: true, items: [1] })
  expect(parseSource('items: [1,\nname: Ada', 'yaml').error).toMatchObject({ line: 2, column: 1 })
})

test('parses XML attributes and repeated elements', () => {
  const parsed = parseSource('<users group="dev"><user>Ada</user><user>Sam</user></users>', 'xml')
  expect(parsed.value).toEqual({ users: { user: ['Ada', 'Sam'], '@_group': 'dev' } })
  expect(parseSource('<root><item></root>', 'xml').error).toMatchObject({ line: 1, column: 13 })
  expect(parseSource('<note id="7">hello</note>', 'xml').value).toEqual({ note: { '#text': 'hello', '@_id': '7' } })
})

test('converts between JSON, YAML and XML', () => {
  const value = { users: { user: ['Ada', 'Sam'], '@_group': 'dev' } }
  const xml = serializeSource(value, 'xml')
  expect(parseSource(xml, 'xml').value).toEqual(value)
  const yaml = serializeSource(value, 'yaml')
  expect(parseSource(yaml, 'yaml').value).toEqual(value)
  expect(parseSource(serializeSource(value, 'json'), 'json').value).toEqual(value)
  expect(parseSource(serializeSource({ a: 1, b: 2 }, 'xml'), 'xml').value).toEqual({ root: { a: '1', b: '2' } })
})
