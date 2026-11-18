import { expect, test } from 'bun:test'
import { childPath, findMatches, parseErrorLocation } from './json'

test('JSONPath escapes unusual keys', () => {
  expect(childPath('$', 'user')).toBe('$.user')
  expect(childPath('$', 'a.b')).toBe('$["a.b"]')
  expect(childPath('$', 'a"b')).toBe('$["a\\"b"]')
  expect(childPath('$.items', 2)).toBe('$.items[2]')
})

test('searches keys and primitive values with ancestors', () => {
  const data = { users: [{ name: 'Ada' }, { name: 'Lin' }], active: true }
  expect(findMatches(data, 'name').map(item => item.path)).toEqual(['$.users[0].name', '$.users[1].name'])
  expect(findMatches(data, 'ada')[0].ancestors).toEqual(['$', '$.users', '$.users[0]'])
  expect(findMatches(data, 'true').map(item => item.path)).toEqual(['$.active'])
})

test('locates V8 JSON parser errors', () => {
  const source = '{\n  "a": 1,\n  "b":\n}'
  const error = new SyntaxError('Unexpected token } in JSON at position 19 (line 4 column 1)')
  expect(parseErrorLocation(error, source)).toMatchObject({ line: 4, column: 1 })
})
