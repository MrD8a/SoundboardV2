import { ipcMain } from 'electron'
import { getDb } from './database'
import { v4 as uuidv4 } from 'uuid'
import {
  importMultipleFiles,
  showImportDialog,
  deleteTrackFile,
  getTrackFilePath
} from './audio-manager'
import { downloadAudio, getVideoInfo } from './downloader'
import {
  connectBot,
  disconnectBot,
  getGuilds,
  getVoiceChannels,
  joinChannel,
  leaveChannel,
  streamPlay,
  streamSeek,
  streamSetVolume,
  streamPause,
  streamResume,
  streamStop
} from './discord'

export function registerIpcHandlers(): void {
  registerDbHandlers()
  registerAudioHandlers()
  registerDownloadHandlers()
  registerDiscordHandlers()
}

function registerDbHandlers(): void {
  ipcMain.handle('db:get-tracks', () => {
    return getDb().prepare('SELECT * FROM tracks ORDER BY createdAt DESC').all()
  })

  ipcMain.handle('db:get-track', (_event, id: string) => {
    return getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id)
  })

  ipcMain.handle('db:delete-track', (_event, id: string) => {
    deleteTrackFile(id)
    return true
  })

  ipcMain.handle('db:update-track', (_event, id: string, title: string) => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      throw new Error('Track title cannot be empty')
    }

    getDb()
      .prepare('UPDATE tracks SET title = ? WHERE id = ?')
      .run(trimmedTitle, id)

    return getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id)
  })

  ipcMain.handle('db:get-playlists', () => {
    return getDb().prepare('SELECT * FROM playlists ORDER BY updatedAt DESC').all()
  })

  ipcMain.handle('db:get-playlist', (_event, id: string) => {
    return getDb().prepare('SELECT * FROM playlists WHERE id = ?').get(id)
  })

  ipcMain.handle(
    'db:create-playlist',
    (_event, name: string, description?: string) => {
      const id = uuidv4()
      getDb()
        .prepare('INSERT INTO playlists (id, name, description) VALUES (?, ?, ?)')
        .run(id, name, description ?? '')
      return getDb().prepare('SELECT * FROM playlists WHERE id = ?').get(id)
    }
  )

  ipcMain.handle(
    'db:update-playlist',
    (_event, id: string, name: string, description?: string) => {
      getDb()
        .prepare(
          "UPDATE playlists SET name = ?, description = ?, updatedAt = datetime('now') WHERE id = ?"
        )
        .run(name, description ?? '', id)
      return getDb().prepare('SELECT * FROM playlists WHERE id = ?').get(id)
    }
  )

  ipcMain.handle('db:delete-playlist', (_event, id: string) => {
    getDb().prepare('DELETE FROM playlists WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('db:get-playlist-tracks', (_event, playlistId: string) => {
    return getDb()
      .prepare(
        `SELECT t.* FROM tracks t
         JOIN playlist_tracks pt ON t.id = pt.trackId
         WHERE pt.playlistId = ?
         ORDER BY pt.position ASC`
      )
      .all(playlistId)
  })

  ipcMain.handle(
    'db:add-track-to-playlist',
    (_event, playlistId: string, trackId: string) => {
      const maxPos = getDb()
        .prepare(
          'SELECT COALESCE(MAX(position), -1) as maxPos FROM playlist_tracks WHERE playlistId = ?'
        )
        .get(playlistId) as { maxPos: number }

      getDb()
        .prepare(
          'INSERT OR IGNORE INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)'
        )
        .run(playlistId, trackId, maxPos.maxPos + 1)

      return true
    }
  )

  ipcMain.handle(
    'db:remove-track-from-playlist',
    (_event, playlistId: string, trackId: string) => {
      getDb()
        .prepare('DELETE FROM playlist_tracks WHERE playlistId = ? AND trackId = ?')
        .run(playlistId, trackId)
      return true
    }
  )

  ipcMain.handle(
    'db:reorder-playlist-tracks',
    (_event, playlistId: string, trackIds: string[]) => {
      const stmt = getDb().prepare(
        'UPDATE playlist_tracks SET position = ? WHERE playlistId = ? AND trackId = ?'
      )
      const reorder = getDb().transaction((ids: string[]) => {
        ids.forEach((trackId, index) => {
          stmt.run(index, playlistId, trackId)
        })
      })
      reorder(trackIds)
      return true
    }
  )

  ipcMain.handle('db:get-setting', (_event, key: string) => {
    const row = getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row?.value ?? null
  })

  ipcMain.handle('db:set-setting', (_event, key: string, value: string) => {
    getDb()
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
      )
      .run(key, value, value)
    return true
  })
}

function registerAudioHandlers(): void {
  ipcMain.handle('audio:import-files', async (_event, filePaths: string[]) => {
    return importMultipleFiles(filePaths)
  })

  ipcMain.handle('audio:show-import-dialog', async () => {
    return showImportDialog()
  })

  ipcMain.handle('audio:import-dropped-files', async (_event, paths: string[]) => {
    return importMultipleFiles(paths)
  })

  ipcMain.handle('audio:get-file-path', (_event, trackId: string) => {
    return getTrackFilePath(trackId)
  })
}

function registerDownloadHandlers(): void {
  ipcMain.handle('download:info', async (_event, url: string) => {
    return getVideoInfo(url)
  })

  ipcMain.handle('download:from-url', async (event, url: string) => {
    return downloadAudio(url, (progress) => {
      event.sender.send('download:progress', progress)
    })
  })
}

function registerDiscordHandlers(): void {
  ipcMain.handle('discord:connect', async (_event, token: string) => {
    return connectBot(token)
  })

  ipcMain.handle('discord:disconnect', async () => {
    await disconnectBot()
    return true
  })

  ipcMain.handle('discord:get-guilds', () => {
    return getGuilds()
  })

  ipcMain.handle('discord:get-voice-channels', (_event, guildId: string) => {
    return getVoiceChannels(guildId)
  })

  ipcMain.handle(
    'discord:join-channel',
    async (_event, guildId: string, channelId: string) => {
      await joinChannel(guildId, channelId)
      return true
    }
  )

  ipcMain.handle('discord:leave-channel', () => {
    leaveChannel()
    return true
  })

  ipcMain.handle(
    'discord:stream-play',
    (_event, filePath: string, seekSeconds: number, volume: number) => {
      streamPlay(filePath, seekSeconds, volume)
      return true
    }
  )

  ipcMain.handle(
    'discord:stream-seek',
    (_event, filePath: string, seekSeconds: number) => {
      streamSeek(filePath, seekSeconds)
      return true
    }
  )

  ipcMain.handle('discord:stream-set-volume', (_event, volume: number) => {
    streamSetVolume(volume)
    return true
  })

  ipcMain.handle('discord:stream-pause', () => {
    streamPause()
    return true
  })

  ipcMain.handle('discord:stream-resume', () => {
    streamResume()
    return true
  })

  ipcMain.handle('discord:stream-stop', () => {
    streamStop()
    return true
  })
}
