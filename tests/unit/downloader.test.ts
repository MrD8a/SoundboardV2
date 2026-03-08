import { describe, it, expect } from 'vitest'

describe('YouTube URL validation', () => {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/abc123'
  ])('should accept valid YouTube URL: %s', (url) => {
    expect(youtubeRegex.test(url)).toBe(true)
  })

  it.each([
    'not-a-url',
    'https://example.com',
    'https://youtube.com/channel/123',
    ''
  ])('should reject invalid URL: "%s"', (url) => {
    expect(youtubeRegex.test(url)).toBe(false)
  })
})

describe('yt-dlp progress parsing', () => {
  const progressRegex =
    /\[download\]\s+(\d+\.?\d*)%\s+of\s+.*?\s+at\s+([\w./]+)\s+ETA\s+(\S+)/

  it('should parse download progress line', () => {
    const line = '[download]  45.2% of ~  5.30MiB at  2.50MiB/s ETA 00:03'
    const match = line.match(progressRegex)
    expect(match).not.toBeNull()
    expect(parseFloat(match![1])).toBeCloseTo(45.2)
    expect(match![2]).toBe('2.50MiB/s')
    expect(match![3]).toBe('00:03')
  })

  it('should parse 100% progress line', () => {
    const line = '[download] 100% of    5.30MiB at  3.00MiB/s ETA 00:00'
    const match = line.match(progressRegex)
    expect(match).not.toBeNull()
    expect(parseFloat(match![1])).toBe(100)
  })

  it('should not match non-progress lines', () => {
    const lines = [
      '[info] Extracting URL: https://example.com',
      '[download] Destination: /tmp/test.opus',
      'WARNING: [youtube] Something'
    ]
    lines.forEach((line) => {
      expect(progressRegex.test(line)).toBe(false)
    })
  })
})

describe('yt-dlp output file detection', () => {
  const destRegex = /\[ExtractAudio\] Destination: (.+)/

  it('should parse destination path from ExtractAudio line', () => {
    const line = '[ExtractAudio] Destination: /tmp/downloads/abc123.opus'
    const match = line.match(destRegex)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('/tmp/downloads/abc123.opus')
  })

  it('should handle paths with spaces', () => {
    const line = '[ExtractAudio] Destination: /tmp/my downloads/abc 123.opus'
    const match = line.match(destRegex)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('/tmp/my downloads/abc 123.opus')
  })
})
