# NextJSON

使用 Bun、React、CodeMirror 和 Electron 构建的 macOS JSON、YAML、XML 查看与转换工具。

## 功能

- 可折叠树状视图、源码语法高亮和行号
- 按键或值全文搜索，自动展开并高亮匹配节点；按 Enter / Shift+Enter 切换结果
- 一键美化、压缩，实时校验并定位解析错误
- 打开 JSON、YAML、XML 文件，按扩展名识别格式；粘贴内容可手动切换解析格式
- 在 JSON、YAML、XML 之间转换，并更新保存文件的扩展名
- 右键节点复制 JSONPath 或 JSON 值
- 打开、拖入、保存数据文件；支持 `⌘O` 打开和 `⌘F` 搜索
- YAML 支持美化；JSON 和 XML 支持美化、压缩

XML 转换采用结构映射：属性为 `@_属性名`，文本节点为 `#text`，同名元素为数组。JSON/YAML 转 XML 时，若顶层没有单一根元素，会添加 `<root>`。XML 注释、声明、混合内容的原始顺序以及文本前后空白不会在转换后保留；XML 数字和布尔文本会作为字符串读取。

## 开发

需要 Bun。运行：

```bash
bun install
bun run desktop:dev
```

仅运行浏览器界面可用 `bun run dev`。

## 构建 macOS 应用

在 Apple Silicon Mac 上运行：

```bash
bun run pack:mac
```

生成 `release/mac-arm64/NextJSON.app`。如需 DMG 安装包：

```bash
bun run dist:mac
```

首次构建前，`build/icon.icns` 可以通过 `scripts/make-icon.swift` 和 macOS 的 `sips`、`iconutil` 重新生成。当前仓库已包含图标。

公开分发需要配置 Apple Developer ID 签名和公证；本地构建无需证书。

## 验证

```bash
bun test
bun run build
```
