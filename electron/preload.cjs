const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nextjson', {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content, name) => ipcRenderer.invoke('file:save', { content, name }),
  copy: text => ipcRenderer.send('clipboard:write', text),
  onOpenShortcut: callback => {
    const listener = () => callback()
    ipcRenderer.on('app:open-shortcut', listener)
    return () => ipcRenderer.removeListener('app:open-shortcut', listener)
  },
})
