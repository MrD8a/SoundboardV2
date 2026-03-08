import { app, BrowserWindow, shell, globalShortcut, net, protocol } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './services/database'
import { registerIpcHandlers } from './services/ipc-handlers'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-audio',
    privileges: { bypassCSP: true, stream: true, supportFetchAPI: true }
  }
])

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'SoundboardV2',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.soundboard.v2')

  protocol.handle('local-audio', (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-audio://', ''))
    return net.fetch(pathToFileURL(filePath).href)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDatabase()
  registerIpcHandlers()
  createWindow()

  registerGlobalShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeDatabase()
})

function registerGlobalShortcuts(): void {
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow?.webContents.send('shortcut:play-pause')
  })

  globalShortcut.register('MediaNextTrack', () => {
    mainWindow?.webContents.send('shortcut:next')
  })

  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow?.webContents.send('shortcut:previous')
  })
}
