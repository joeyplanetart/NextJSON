const { app, BrowserWindow, clipboard, dialog, ipcMain, Menu } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 920,
    minHeight: 600,
    title: 'NextJSON',
    backgroundColor: '#10141d',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 17 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) win.loadURL('http://localhost:5173')
  else win.loadFile(path.join(__dirname, '../dist/index.html'))

  win.webContents.on('before-input-event', (event, input) => {
    if (input.meta && input.key.toLowerCase() === 'o') {
      event.preventDefault()
      win.webContents.send('app:open-shortcut')
    }
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'NextJSON', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] },
    { label: '编辑', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: '视图', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
  ]))
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json', 'jsonl', 'txt'] }, { name: '所有文件', extensions: ['*'] }] })
    if (result.canceled || !result.filePaths[0]) return null
    const filePath = result.filePaths[0]
    return { name: path.basename(filePath), content: await fs.readFile(filePath, 'utf8') }
  })
  ipcMain.handle('file:save', async (_event, { content, name }) => {
    const result = await dialog.showSaveDialog({ defaultPath: name || 'data.json', filters: [{ name: 'JSON', extensions: ['json'] }] })
    if (result.canceled || !result.filePath) return false
    await fs.writeFile(result.filePath, content, 'utf8')
    return true
  })
  ipcMain.on('clipboard:write', (_event, text) => clipboard.writeText(text))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
