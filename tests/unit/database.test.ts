import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT DEFAULT '',
      duration REAL DEFAULT 0,
      filePath TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      format TEXT DEFAULT '',
      source TEXT CHECK(source IN ('youtube', 'import')) DEFAULT 'import',
      sourceUrl TEXT DEFAULT '',
      thumbnailPath TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE playlist_tracks (
      playlistId TEXT NOT NULL,
      trackId TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (playlistId, trackId),
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
  return db
}

describe('Database schema', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
  })

  afterEach(() => {
    db.close()
  })

  describe('tracks table', () => {
    it('should insert and retrieve a track', () => {
      const id = uuidv4()
      db.prepare(
        'INSERT INTO tracks (id, title, filePath) VALUES (?, ?, ?)'
      ).run(id, 'Tavern Music', '/tracks/tavern.mp3')

      const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Record<string, unknown>
      expect(track).toBeDefined()
      expect(track.title).toBe('Tavern Music')
      expect(track.filePath).toBe('/tracks/tavern.mp3')
      expect(track.source).toBe('import')
    })

    it('should delete a track', () => {
      const id = uuidv4()
      db.prepare(
        'INSERT INTO tracks (id, title, filePath) VALUES (?, ?, ?)'
      ).run(id, 'Battle Theme', '/tracks/battle.mp3')

      db.prepare('DELETE FROM tracks WHERE id = ?').run(id)
      const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id)
      expect(track).toBeUndefined()
    })

    it('should enforce source constraint', () => {
      const id = uuidv4()
      expect(() =>
        db.prepare(
          "INSERT INTO tracks (id, title, filePath, source) VALUES (?, ?, ?, 'invalid')"
        ).run(id, 'Bad Track', '/tracks/bad.mp3')
      ).toThrow()
    })
  })

  describe('playlists table', () => {
    it('should create and retrieve a playlist', () => {
      const id = uuidv4()
      db.prepare(
        'INSERT INTO playlists (id, name, description) VALUES (?, ?, ?)'
      ).run(id, 'Combat Music', 'Tracks for combat encounters')

      const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as Record<string, unknown>
      expect(playlist).toBeDefined()
      expect(playlist.name).toBe('Combat Music')
      expect(playlist.description).toBe('Tracks for combat encounters')
    })

    it('should delete a playlist', () => {
      const id = uuidv4()
      db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)').run(id, 'Temp')

      db.prepare('DELETE FROM playlists WHERE id = ?').run(id)
      const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id)
      expect(playlist).toBeUndefined()
    })
  })

  describe('playlist_tracks join table', () => {
    it('should link tracks to playlists with ordering', () => {
      const playlistId = uuidv4()
      const trackId1 = uuidv4()
      const trackId2 = uuidv4()

      db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)').run(playlistId, 'Ambiance')
      db.prepare('INSERT INTO tracks (id, title, filePath) VALUES (?, ?, ?)').run(trackId1, 'Rain', '/rain.mp3')
      db.prepare('INSERT INTO tracks (id, title, filePath) VALUES (?, ?, ?)').run(trackId2, 'Thunder', '/thunder.mp3')

      db.prepare('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)').run(playlistId, trackId1, 0)
      db.prepare('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)').run(playlistId, trackId2, 1)

      const tracks = db.prepare(
        `SELECT t.title, pt.position FROM tracks t
         JOIN playlist_tracks pt ON t.id = pt.trackId
         WHERE pt.playlistId = ?
         ORDER BY pt.position ASC`
      ).all(playlistId) as Array<{ title: string; position: number }>

      expect(tracks).toHaveLength(2)
      expect(tracks[0].title).toBe('Rain')
      expect(tracks[1].title).toBe('Thunder')
    })

    it('should cascade delete when playlist is removed', () => {
      const playlistId = uuidv4()
      const trackId = uuidv4()

      db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)').run(playlistId, 'Temp')
      db.prepare('INSERT INTO tracks (id, title, filePath) VALUES (?, ?, ?)').run(trackId, 'Song', '/song.mp3')
      db.prepare('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)').run(playlistId, trackId, 0)

      db.prepare('DELETE FROM playlists WHERE id = ?').run(playlistId)
      const links = db.prepare('SELECT * FROM playlist_tracks WHERE playlistId = ?').all(playlistId)
      expect(links).toHaveLength(0)
    })

    it('should cascade delete when track is removed', () => {
      const playlistId = uuidv4()
      const trackId = uuidv4()

      db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)').run(playlistId, 'Temp')
      db.prepare('INSERT INTO tracks (id, title, filePath) VALUES (?, ?, ?)').run(trackId, 'Song', '/song.mp3')
      db.prepare('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)').run(playlistId, trackId, 0)

      db.prepare('DELETE FROM tracks WHERE id = ?').run(trackId)
      const links = db.prepare('SELECT * FROM playlist_tracks WHERE trackId = ?').all(trackId)
      expect(links).toHaveLength(0)
    })
  })

  describe('settings table', () => {
    it('should store and retrieve settings', () => {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('volume', '0.7')

      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('volume') as { value: string }
      expect(row.value).toBe('0.7')
    })

    it('should upsert settings', () => {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('theme', 'dark')
      db.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
      ).run('theme', 'light', 'light')

      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('theme') as { value: string }
      expect(row.value).toBe('light')
    })
  })
})
