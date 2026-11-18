import AppKit

let size = 1024
let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
    isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0
)!

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
NSGraphicsContext.current?.imageInterpolation = .high

let background = NSBezierPath(roundedRect: NSRect(x: 40, y: 40, width: 944, height: 944), xRadius: 220, yRadius: 220)
NSGradient(starting: NSColor(calibratedRed: 0.40, green: 0.48, blue: 0.90, alpha: 1), ending: NSColor(calibratedRed: 0.21, green: 0.25, blue: 0.55, alpha: 1))!.draw(in: background, angle: -45)

let inner = NSBezierPath(roundedRect: NSRect(x: 158, y: 190, width: 708, height: 644), xRadius: 105, yRadius: 105)
NSColor(calibratedRed: 0.12, green: 0.17, blue: 0.34, alpha: 0.55).setFill()
inner.fill()

let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center
let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.monospacedSystemFont(ofSize: 430, weight: .medium),
    .foregroundColor: NSColor(calibratedRed: 0.94, green: 0.96, blue: 1, alpha: 1),
    .paragraphStyle: paragraph,
]
("{ }" as NSString).draw(in: NSRect(x: 130, y: 280, width: 764, height: 510), withAttributes: attributes)

NSColor(calibratedRed: 0.50, green: 0.86, blue: 0.79, alpha: 1).setFill()
NSBezierPath(ovalIn: NSRect(x: 487, y: 409, width: 50, height: 50)).fill()

NSGraphicsContext.restoreGraphicsState()
let data = bitmap.representation(using: .png, properties: [:])!
try data.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
