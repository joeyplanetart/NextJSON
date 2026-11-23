import { expect, test } from 'bun:test'
import { formatBytes, imageFormat, outputImageName } from './image'

test('recognizes image formats and creates the correct output extension', () => {
  expect(imageFormat(new File([], 'photo.jpeg', { type: 'image/jpeg' }))).toBe('jpeg')
  expect(imageFormat(new File([], 'logo.webp', { type: 'image/webp' }))).toBe('webp')
  expect(imageFormat(new File([], 'notes.txt', { type: 'text/plain' }))).toBeNull()
  expect(outputImageName('photo.JPEG', 'png')).toBe('photo.png')
  expect(outputImageName('logo.png', 'jpeg')).toBe('logo.jpg')
  expect(outputImageName('logo.jpg', 'webp')).toBe('logo.webp')
  expect(formatBytes(1536)).toBe('1.5 KB')
})
