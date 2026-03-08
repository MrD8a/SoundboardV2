import { create } from 'zustand'
import { Howl } from 'howler'
import type { Track, RepeatMode } from '../types'
import { useDiscordStore } from './discord-store'

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  repeatMode: RepeatMode
  shuffle: boolean
  _howl: Howl | null
  _progressInterval: ReturnType<typeof setInterval> | null

  playTrack: (track: Track, queue?: Track[]) => void
  pause: () => void
  resume: () => void
  togglePlayPause: () => void
  stop: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setRepeatMode: (mode: RepeatMode) => void
  toggleShuffle: () => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  clearQueue: () => void
}

function getShuffledIndex(current: number, length: number): number {
  if (length <= 1) return 0
  let next: number
  do {
    next = Math.floor(Math.random() * length)
  } while (next === current)
  return next
}

function shouldMirror(): boolean {
  return useDiscordStore.getState().isInChannel
}

async function resolveFilePath(track: Track): Promise<string | null> {
  try {
    return await window.api.audio.getFilePath(track.id)
  } catch {
    return null
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  repeatMode: 'none',
  shuffle: false,
  _howl: null,
  _progressInterval: null,

  playTrack: (track: Track, queue?: Track[]) => {
    const state = get()

    if (state._howl) {
      state._howl.unload()
    }
    if (state._progressInterval) {
      clearInterval(state._progressInterval)
    }

    if (queue) {
      const idx = queue.findIndex((t) => t.id === track.id)
      set({ queue, queueIndex: idx >= 0 ? idx : 0 })
    }

    const howl = new Howl({
      src: [`local-audio://${encodeURIComponent(track.filePath)}`],
      volume: state.volume,
      html5: true,
      onload: () => {
        set({ duration: howl.duration() })
      },
      onplay: () => {
        set({ isPlaying: true })
        const interval = setInterval(() => {
          const h = get()._howl
          if (h && h.playing()) {
            set({ progress: h.seek() as number })
          }
        }, 250)
        set({ _progressInterval: interval })
      },
      onpause: () => {
        set({ isPlaying: false })
      },
      onstop: () => {
        set({ isPlaying: false, progress: 0 })
        const pi = get()._progressInterval
        if (pi) clearInterval(pi)
      },
      onend: () => {
        const pi = get()._progressInterval
        if (pi) clearInterval(pi)
        set({ isPlaying: false, progress: 0 })

        const { repeatMode } = get()
        if (repeatMode === 'one') {
          howl.play()
        } else {
          get().next()
        }
      }
    })

    howl.play()
    set({ currentTrack: track, _howl: howl, progress: 0 })

    if (shouldMirror()) {
      resolveFilePath(track).then((fp) => {
        if (fp) window.api.discord.streamPlay(fp, 0, get().volume)
      })
    }
  },

  pause: () => {
    get()._howl?.pause()
    if (shouldMirror()) window.api.discord.streamPause()
  },

  resume: () => {
    get()._howl?.play()
    if (shouldMirror()) window.api.discord.streamResume()
  },

  togglePlayPause: () => {
    const { isPlaying, _howl } = get()
    if (!_howl) return
    if (isPlaying) {
      get().pause()
    } else {
      get().resume()
    }
  },

  stop: () => {
    const { _howl, _progressInterval } = get()
    if (_howl) {
      _howl.stop()
      _howl.unload()
    }
    if (_progressInterval) {
      clearInterval(_progressInterval)
    }
    set({
      _howl: null,
      _progressInterval: null,
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      duration: 0
    })

    if (shouldMirror()) window.api.discord.streamStop()
  },

  next: () => {
    const { queue, queueIndex, shuffle, repeatMode } = get()
    if (queue.length === 0) return

    let nextIndex: number
    if (shuffle) {
      nextIndex = getShuffledIndex(queueIndex, queue.length)
    } else {
      nextIndex = queueIndex + 1
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0
        } else {
          get().stop()
          return
        }
      }
    }

    set({ queueIndex: nextIndex })
    get().playTrack(queue[nextIndex])
  },

  previous: () => {
    const { queue, queueIndex, progress, shuffle } = get()
    if (queue.length === 0) return

    if (progress > 3) {
      get().seek(0)
      return
    }

    let prevIndex: number
    if (shuffle) {
      prevIndex = getShuffledIndex(queueIndex, queue.length)
    } else {
      prevIndex = queueIndex - 1
      if (prevIndex < 0) {
        prevIndex = queue.length - 1
      }
    }

    set({ queueIndex: prevIndex })
    get().playTrack(queue[prevIndex])
  },

  seek: (time: number) => {
    const { _howl, currentTrack } = get()
    if (_howl) {
      _howl.seek(time)
      set({ progress: time })
    }

    if (shouldMirror() && currentTrack) {
      resolveFilePath(currentTrack).then((fp) => {
        if (fp) window.api.discord.streamSeek(fp, time)
      })
    }
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume))
    const { _howl } = get()
    if (_howl) {
      _howl.volume(clamped)
    }
    set({ volume: clamped })

    if (shouldMirror()) window.api.discord.streamSetVolume(clamped)
  },

  setRepeatMode: (mode: RepeatMode) => {
    set({ repeatMode: mode })
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }))
  },

  setQueue: (tracks: Track[], startIndex = 0) => {
    set({ queue: tracks, queueIndex: startIndex })
  },

  clearQueue: () => {
    set({ queue: [], queueIndex: -1 })
  }
}))
