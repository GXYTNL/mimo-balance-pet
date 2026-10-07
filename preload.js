const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  dragStart: () => ipcRenderer.send('win:drag-start'),
  dragMove:  () => ipcRenderer.send('win:drag-move'),
  dragEnd:   () => ipcRenderer.send('win:drag-end'),
  hideToEdge: () => ipcRenderer.invoke('win:hide-to-edge'),
  restore:    () => ipcRenderer.invoke('win:restore'),
  quit:       () => ipcRenderer.send('win:quit'),
  openExternal: (url) => ipcRenderer.invoke('win:open-external', url),
  request: (opt) => ipcRenderer.invoke('http:request', opt),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (data) => ipcRenderer.invoke('settings:set', data),
  onDoQuery: (cb) => ipcRenderer.on('pet:do-query', cb)
});