import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'

describe('Audio file support detection', () => {
  const SUPPORTED = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.opus', '.webm', '.aac']
  const UNSUPPORTED = ['.txt', '.pdf', '.jpg', '.exe', '.py']

  function isSupportedFormat(filePath: string): boolean {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase()
    return SUPPORTED.includes(ext)
  }

  it.each(SUPPORTED)('should accept %s files', (ext) => {
    expect(isSupportedFormat(`track${ext}`)).toBe(true)
  })

  it.each(UNSUPPORTED)('should reject %s files', (ext) => {
    expect(isSupportedFormat(`file${ext}`)).toBe(false)
  })

  it('should be case-insensitive', () => {
    expect(isSupportedFormat('track.MP3')).toBe(true)
    expect(isSupportedFormat('track.Wav')).toBe(true)
  })
})

describe('Audio file copy workflow', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `soundboard-test-${uuidv4()}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('should detect when source file exists', () => {
    const filePath = join(tempDir, 'test.mp3')
    writeFileSync(filePath, Buffer.alloc(1024))
    expect(existsSync(filePath)).toBe(true)
  })

  it('should detect when source file does not exist', () => {
    const filePath = join(tempDir, 'nonexistent.mp3')
    expect(existsSync(filePath)).toBe(false)
  })

  it('should create destination directory', () => {
    const destDir = join(tempDir, 'tracks')
    mkdirSync(destDir, { recursive: true })
    expect(existsSync(destDir)).toBe(true)
  })
})
