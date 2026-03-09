import { contextBridge, ipcRenderer } from 'electron'

const api = {
  db: {
    getTracks: () => ipcRenderer.invoke('db:get-tracks'),
    getTrack: (id: string) => ipcRenderer.invoke('db:get-track', id),
    updateTrack: (id: string, title: string) => ipcRenderer.invoke('db:update-track', id, title),
    deleteTrack: (id: string) => ipcRenderer.invoke('db:delete-track', id),
    getPlaylists: () => ipcRenderer.invoke('db:get-playlists'),
    getPlaylist: (id: string) => ipcRenderer.invoke('db:get-playlist', id),
    createPlaylist: (name: string, description?: string, icon?: string) =>
      ipcRenderer.invoke('db:create-playlist', name, description, icon),
    updatePlaylist: (id: string, name: string, description?: string, icon?: string) =>
      ipcRenderer.invoke('db:update-playlist', id, name, description, icon),
    deletePlaylist: (id: string) => ipcRenderer.invoke('db:delete-playlist', id),
    getPlaylistTracks: (playlistId: string) =>
      ipcRenderer.invoke('db:get-playlist-tracks', playlistId),
    addTrackToPlaylist: (playlistId: string, trackId: string) =>
      ipcRenderer.invoke('db:add-track-to-playlist', playlistId, trackId),
    removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
      ipcRenderer.invoke('db:remove-track-from-playlist', playlistId, trackId),
    reorderPlaylistTracks: (playlistId: string, trackIds: string[]) =>
      ipcRenderer.invoke('db:reorder-playlist-tracks', playlistId, trackIds),
    getSetting: (key: string) => ipcRenderer.invoke('db:get-setting', key),
    setSetting: (key: string, value: string) =>
      ipcRenderer.invoke('db:set-setting', key, value)
  },
  audio: {
    importFiles: (filePaths: string[]) => ipcRenderer.invoke('audio:import-files', filePaths),
    getFilePath: (trackId: string) => ipcRenderer.invoke('audio:get-file-path', trackId),
    showImportDialog: () => ipcRenderer.invoke('audio:show-import-dialog'),
    importDroppedFiles: (paths: string[]) =>
      ipcRenderer.invoke('audio:import-dropped-files', paths)
  },
  download: {
    getInfo: (url: string) => ipcRenderer.invoke('download:info', url),
    fromUrl: (url: string) => ipcRenderer.invoke('download:from-url', url),
    onProgress: (callback: (progress: { percent: number; speed: string; eta: string; status: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: { percent: number; speed: string; eta: string; status: string }): void => {
        callback(progress)
      }
      ipcRenderer.on('download:progress', handler)
      return () => ipcRenderer.removeListener('download:progress', handler)
    }
  },
  discord: {
    connect: (token: string) => ipcRenderer.invoke('discord:connect', token),
    disconnect: () => ipcRenderer.invoke('discord:disconnect'),
    getGuilds: () => ipcRenderer.invoke('discord:get-guilds'),
    getVoiceChannels: (guildId: string) =>
      ipcRenderer.invoke('discord:get-voice-channels', guildId),
    joinChannel: (guildId: string, channelId: string) =>
      ipcRenderer.invoke('discord:join-channel', guildId, channelId),
    leaveChannel: () => ipcRenderer.invoke('discord:leave-channel'),
    streamPlay: (filePath: string, seekSeconds: number, volume: number) =>
      ipcRenderer.invoke('discord:stream-play', filePath, seekSeconds, volume),
    streamSeek: (filePath: string, seekSeconds: number) =>
      ipcRenderer.invoke('discord:stream-seek', filePath, seekSeconds),
    streamSetVolume: (volume: number) =>
      ipcRenderer.invoke('discord:stream-set-volume', volume),
    streamPause: () => ipcRenderer.invoke('discord:stream-pause'),
    streamResume: () => ipcRenderer.invoke('discord:stream-resume'),
    streamStop: () => ipcRenderer.invoke('discord:stream-stop'),
    onStatusChange: (callback: (status: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: string): void => {
        callback(status)
      }
      ipcRenderer.on('discord:status-change', handler)
      return () => ipcRenderer.removeListener('discord:status-change', handler)
    }
  },
  shortcuts: {
    onPlayPause: (callback: () => void) => {
      ipcRenderer.on('shortcut:play-pause', callback)
      return () => ipcRenderer.removeListener('shortcut:play-pause', callback)
    },
    onNext: (callback: () => void) => {
      ipcRenderer.on('shortcut:next', callback)
      return () => ipcRenderer.removeListener('shortcut:next', callback)
    },
    onPrevious: (callback: () => void) => {
      ipcRenderer.on('shortcut:previous', callback)
      return () => ipcRenderer.removeListener('shortcut:previous', callback)
    }
  }
}

export type SoundboardAPI = typeof api

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error fallback for non-isolated context
  window.api = api
}
