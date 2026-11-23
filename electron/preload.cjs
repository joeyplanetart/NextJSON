const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nextjson', {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content, name, format) => ipcRenderer.invoke('file:save', { content, name, format }),
  saveImage: (bytes, name, format) => ipcRenderer.invoke('image:save', { bytes, name, format }),
  copy: text => ipcRenderer.send('clipboard:write', text),
  onOpenShortcut: callback => {
    const listener = () => callback()
    ipcRenderer.on('app:open-shortcut', listener)
    return () => ipcRenderer.removeListener('app:open-shortcut', listener)
  },
})
