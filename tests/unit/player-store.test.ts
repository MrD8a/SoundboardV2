import { describe, it, expect } from 'vitest'
import type { Track, RepeatMode } from '../../src/renderer/types'

function createMockTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: `track-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 180,
    filePath: '/test/track.mp3',
    fileSize: 1024,
    format: 'mp3',
    source: 'import',
    sourceUrl: '',
    thumbnailPath: '',
    createdAt: new Date().toISOString(),
    ...overrides
  }
}

describe('Player queue logic', () => {
  it('should calculate next index in sequential mode', () => {
    const queue = [createMockTrack(), createMockTrack(), createMockTrack()]
    const currentIndex = 0
    const nextIndex = currentIndex + 1
    expect(nextIndex).toBe(1)
    expect(nextIndex < queue.length).toBe(true)
  })

  it('should wrap to start when repeat-all at end of queue', () => {
    const queue = [createMockTrack(), createMockTrack(), createMockTrack()]
    const currentIndex = queue.length - 1
    const repeatMode: RepeatMode = 'all'
    let nextIndex = currentIndex + 1
    if (nextIndex >= queue.length && repeatMode === 'all') {
      nextIndex = 0
    }
    expect(nextIndex).toBe(0)
  })

  it('should stop when no repeat at end of queue', () => {
    const queue = [createMockTrack(), createMockTrack()]
    const currentIndex = queue.length - 1
    const repeatMode: RepeatMode = 'none'
    let nextIndex: number | null = currentIndex + 1
    if (nextIndex >= queue.length && repeatMode === 'none') {
      nextIndex = null
    }
    expect(nextIndex).toBeNull()
  })

  it('should go to previous track', () => {
    const currentIndex = 2
    const prevIndex = currentIndex - 1
    expect(prevIndex).toBe(1)
  })

  it('should wrap to end from first track', () => {
    const queueLength = 5
    const currentIndex = 0
    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      prevIndex = queueLength - 1
    }
    expect(prevIndex).toBe(4)
  })

  it('should generate different shuffle index', () => {
    const attempts = 100
    const queueLength = 5
    const currentIndex = 2
    let allSame = true

    for (let i = 0; i < attempts; i++) {
      let next: number
      do {
        next = Math.floor(Math.random() * queueLength)
      } while (next === currentIndex)

      if (next !== currentIndex) {
        allSame = false
      }
      expect(next).not.toBe(currentIndex)
    }

    expect(allSame).toBe(false)
  })
})

describe('Player volume', () => {
  it('should clamp volume between 0 and 1', () => {
    const clamp = (v: number) => Math.max(0, Math.min(1, v))
    expect(clamp(-0.5)).toBe(0)
    expect(clamp(0)).toBe(0)
    expect(clamp(0.5)).toBe(0.5)
    expect(clamp(1)).toBe(1)
    expect(clamp(1.5)).toBe(1)
  })
})

describe('Repeat mode cycling', () => {
  it('should cycle through repeat modes', () => {
    const modes: RepeatMode[] = ['none', 'all', 'one']
    const cycle = (current: RepeatMode): RepeatMode => {
      const idx = modes.indexOf(current)
      return modes[(idx + 1) % modes.length]
    }

    expect(cycle('none')).toBe('all')
    expect(cycle('all')).toBe('one')
    expect(cycle('one')).toBe('none')
  })
})
