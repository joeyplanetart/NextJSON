# NextJSON

使用 Bun、React、CodeMirror 和 Electron 构建的 macOS JSON 查看与格式化工具。

## 功能

- 可折叠树状视图、源码语法高亮和行号
- 按键或值全文搜索，自动展开并高亮匹配节点；按 Enter / Shift+Enter 切换结果
- 一键美化、压缩，实时校验并定位解析错误
- 右键节点复制 JSONPath 或 JSON 值
- 打开、拖入、保存 JSON 文件；支持 `⌘O` 打开和 `⌘F` 搜索

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
