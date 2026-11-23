export type ImageFormat = 'jpeg' | 'png' | 'webp'

export const imageMime: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export const imageLabel: Record<ImageFormat, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
}

export function imageFormat(file: File): ImageFormat | null {
  if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)) return 'jpeg'
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) return 'png'
  if (file.type === 'image/webp' || /\.webp$/i.test(file.name)) return 'webp'
  return null
}

export function outputImageName(name: string, format: ImageFormat): string {
  const stem = name.replace(/\.(jpe?g|png|webp)$/i, '')
  return `${stem}.${format === 'jpeg' ? 'jpg' : format}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export async function convertImage(file: File, target: ImageFormat, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法创建图片画布')
    if (target === 'jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(bitmap, 0, 0)
    const mime = imageMime[target]
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('图片编码失败')), mime, quality)
    })
    if (blob.type !== mime) throw new Error(`${imageLabel[target]} 编码不可用`)
    return blob
  } finally {
    bitmap.close()
  }
}
