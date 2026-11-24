import Parser from 'web-tree-sitter'
import coreWasmData from 'web-tree-sitter/tree-sitter.wasm?inline'
import bashWasmData from 'curlconverter/dist/tree-sitter-bash.wasm?inline'

function decodeWasm(dataUrl: string): Uint8Array {
  return Uint8Array.from(atob(dataUrl.split(',')[1]), character => character.charCodeAt(0))
}

await Parser.init({ wasmBinary: decodeWasm(coreWasmData) })
const bash = await Parser.Language.load(decodeWasm(bashWasmData))
const parser = new Parser()
parser.setLanguage(bash)

export default parser
