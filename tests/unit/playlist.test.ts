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
  `)
  return db
}

describe('Playlist CRUD operations', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
  })

  afterEach(() => {
    db.close()
  })

  it('should create a playlist', () => {
    const id = uuidv4()
    db.prepare('INSERT INTO playlists (id, name, description) VALUES (?, ?, ?)').run(
      id,
      'Battle Music',
      'For combat encounters'
    )
    const pl = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as Record<string, unknown>
    expect(pl.name).toBe('Battle Music')
    expect(pl.description).toBe('For combat encounters')
  })

  it('should rename a playlist', () => {
    const id = uuidv4()
    db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)').run(id, 'Old Name')
    db.prepare('UPDATE playlists SET name = ? WHERE id = ?').run('New Name', id)
    const pl = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as Record<string, unknown>
    expect(pl.name).toBe('New Name')
  })

  it('should delete a playlist', () => {
    const id = uuidv4()
    db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)').run(id, 'Temp')
    db.prepare('DELETE FROM playlists WHERE id = ?').run(id)
    const result = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id)
    expect(result).toBeUndefined()
  })

  it('should list all playlists ordered by updatedAt', () => {
    db.prepare("INSERT INTO playlists (id, name, updatedAt) VALUES (?, ?, datetime('now', '-2 hours'))").run(uuidv4(), 'Older')
    db.prepare("INSERT INTO playlists (id, name, updatedAt) VALUES (?, ?, datetime('now'))").run(uuidv4(), 'Newer')

    const playlists = db.prepare('SELECT * FROM playlists ORDER BY updatedAt DESC').all() as Array<Record<string, unknown>>
    expect(playlists).toHaveLength(2)
    expect(playlists[0].name).toBe('Newer')
  })
})

describe('Playlist track management', () => {
  let db: Database.Database
  let playlistId: string
  let trackIds: string[]

  beforeEach(() => {
    db = createTestDb()
    playlistId = uuidv4()
    trackIds = [uuidv4(), uuidv4(), uuidv4()]

    db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)').run(playlistId, 'Test Playlist')
    trackIds.forEach((id, i) => {
      db.prepare('INSERT INTO tracks (id, title, filePath) VALUES (?, ?, ?)').run(
        id,
        `Track ${i + 1}`,
        `/track${i + 1}.mp3`
      )
    })
  })

  afterEach(() => {
    db.close()
  })

  it('should add tracks to a playlist with correct ordering', () => {
    trackIds.forEach((trackId, position) => {
      db.prepare(
        'INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)'
      ).run(playlistId, trackId, position)
    })

    const tracks = db
      .prepare(
        `SELECT t.title, pt.position FROM tracks t
         JOIN playlist_tracks pt ON t.id = pt.trackId
         WHERE pt.playlistId = ? ORDER BY pt.position`
      )
      .all(playlistId) as Array<{ title: string; position: number }>

    expect(tracks).toHaveLength(3)
    expect(tracks[0].title).toBe('Track 1')
    expect(tracks[2].title).toBe('Track 3')
  })

  it('should remove a track from a playlist', () => {
    trackIds.forEach((trackId, position) => {
      db.prepare(
        'INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)'
      ).run(playlistId, trackId, position)
    })

    db.prepare('DELETE FROM playlist_tracks WHERE playlistId = ? AND trackId = ?').run(
      playlistId,
      trackIds[1]
    )

    const remaining = db
      .prepare('SELECT * FROM playlist_tracks WHERE playlistId = ?')
      .all(playlistId)
    expect(remaining).toHaveLength(2)
  })

  it('should reorder tracks in a playlist', () => {
    trackIds.forEach((trackId, position) => {
      db.prepare(
        'INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)'
      ).run(playlistId, trackId, position)
    })

    const reversed = [...trackIds].reverse()
    const stmt = db.prepare(
      'UPDATE playlist_tracks SET position = ? WHERE playlistId = ? AND trackId = ?'
    )
    const reorder = db.transaction((ids: string[]) => {
      ids.forEach((trackId, index) => {
        stmt.run(index, playlistId, trackId)
      })
    })
    reorder(reversed)

    const tracks = db
      .prepare(
        `SELECT t.title FROM tracks t
         JOIN playlist_tracks pt ON t.id = pt.trackId
         WHERE pt.playlistId = ? ORDER BY pt.position`
      )
      .all(playlistId) as Array<{ title: string }>

    expect(tracks[0].title).toBe('Track 3')
    expect(tracks[2].title).toBe('Track 1')
  })

  it('should prevent duplicate track in same playlist', () => {
    db.prepare(
      'INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)'
    ).run(playlistId, trackIds[0], 0)

    db.prepare(
      'INSERT OR IGNORE INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)'
    ).run(playlistId, trackIds[0], 1)

    const count = db
      .prepare('SELECT COUNT(*) as cnt FROM playlist_tracks WHERE playlistId = ? AND trackId = ?')
      .get(playlistId, trackIds[0]) as { cnt: number }
    expect(count.cnt).toBe(1)
  })
})
