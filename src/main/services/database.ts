import type Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { createRequire } from 'node:module'

// Runtime require for native module that can't be bundled by Vite
const _require = createRequire(import.meta.url)
const BetterSqlite3 = _require('better-sqlite3') as typeof Database

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  const dataDir = join(userDataPath, 'data')

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = join(dataDir, 'soundboard.db')
  db = new BetterSqlite3(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations()
}

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
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

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlistId TEXT NOT NULL,
      trackId TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (playlistId, trackId),
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
  }
}
