import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), {
    name: 'curlconverter-file-safe-wasm',
    enforce: 'pre',
    transform(_code, id) {
      if (id.replaceAll('\\', '/').includes('/curlconverter/dist/src/shell/webParser.js')) {
        return { code: `export { default } from ${JSON.stringify(new URL('./src/curlBrowserParser.ts', import.meta.url).pathname)}`, map: null }
      }
    },
  }],
  optimizeDeps: { exclude: ['curlconverter'], include: ['web-tree-sitter', 'yamljs', 'jsesc'] },
  assetsInclude: ['**/*.wasm'],
  build: { target: 'esnext' },
  base: './',
})
