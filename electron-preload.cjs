/**
 * Preload bridge — exposes a tiny, read-only desktop API to the renderer.
 * The renderer stays sandboxed: no Node.js, no raw IPC access.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  /** Resolves to { isDesktop, platform, appVersion, electronVersion, chromeVersion } */
  getAppInfo: () => ipcRenderer.invoke('desktop:app-info'),
});
