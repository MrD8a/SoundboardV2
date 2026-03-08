import { app, dialog } from 'electron'
import { join, extname, basename } from 'path'
import { existsSync, mkdirSync, copyFileSync, statSync, unlinkSync } from 'fs'
import { parseFile } from 'music-metadata'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from './database'

const SUPPORTED_FORMATS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.opus', '.webm', '.aac']

export function getTracksDir(): string {
  const dir = join(app.getPath('userData'), 'data', 'tracks')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function isSupportedFormat(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return SUPPORTED_FORMATS.includes(ext)
}

interface ImportedTrack {
  id: string
  title: string
  artist: string
  duration: number
  filePath: string
  fileSize: number
  format: string
  source: 'import' | 'youtube'
  sourceUrl: string
  createdAt: string
}

export async function importAudioFile(
  sourcePath: string,
  source: 'import' | 'youtube' = 'import',
  sourceUrl = ''
): Promise<ImportedTrack> {
  if (!existsSync(sourcePath)) {
    throw new Error(`File not found: ${sourcePath}`)
  }

  if (!isSupportedFormat(sourcePath)) {
    throw new Error(`Unsupported format: ${extname(sourcePath)}`)
  }

  const id = uuidv4()
  const ext = extname(sourcePath).toLowerCase()
  const destFileName = `${id}${ext}`
  const destPath = join(getTracksDir(), destFileName)

  copyFileSync(sourcePath, destPath)

  const stats = statSync(destPath)
  let title = basename(sourcePath, ext)
  let artist = ''
  let duration = 0

  try {
    const metadata = await parseFile(destPath)
    title = metadata.common.title || title
    artist = metadata.common.artist || ''
    duration = metadata.format.duration || 0
  } catch {
    // Metadata extraction failed; use filename-based defaults
  }

  const format = ext.replace('.', '')
  const db = getDb()
  db.prepare(
    `INSERT INTO tracks (id, title, artist, duration, filePath, fileSize, format, source, sourceUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title, artist, duration, destPath, stats.size, format, source, sourceUrl)

  const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as ImportedTrack
  return track
}

export async function importMultipleFiles(filePaths: string[]): Promise<ImportedTrack[]> {
  const results: ImportedTrack[] = []

  for (const filePath of filePaths) {
    if (isSupportedFormat(filePath)) {
      try {
        const track = await importAudioFile(filePath)
        results.push(track)
      } catch {
        // Skip files that fail to import
      }
    }
  }

  return results
}

export async function showImportDialog(): Promise<ImportedTrack[]> {
  const result = await dialog.showOpenDialog({
    title: 'Import Audio Files',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Audio Files',
        extensions: SUPPORTED_FORMATS.map((f) => f.replace('.', ''))
      }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  return importMultipleFiles(result.filePaths)
}

export function deleteTrackFile(trackId: string): void {
  const db = getDb()
  const track = db.prepare('SELECT filePath FROM tracks WHERE id = ?').get(trackId) as
    | { filePath: string }
    | undefined

  if (track && existsSync(track.filePath)) {
    unlinkSync(track.filePath)
  }

  db.prepare('DELETE FROM tracks WHERE id = ?').run(trackId)
}

export function getTrackFilePath(trackId: string): string | null {
  const db = getDb()
  const track = db.prepare('SELECT filePath FROM tracks WHERE id = ?').get(trackId) as
    | { filePath: string }
    | undefined

  if (track && existsSync(track.filePath)) {
    return track.filePath
  }

  return null
}
