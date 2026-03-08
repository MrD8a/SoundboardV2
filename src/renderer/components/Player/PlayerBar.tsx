import React, { useRef, useCallback } from 'react'
import { usePlayerStore } from '../../stores/player-store'
import { formatDuration } from '../../lib/format'
import type { RepeatMode } from '../../types'

const REPEAT_CYCLE: RepeatMode[] = ['none', 'all', 'one']

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeatMode,
    shuffle,
    togglePlayPause,
    stop,
    next,
    previous,
    seek,
    setVolume,
    setRepeatMode,
    toggleShuffle
  } = usePlayerStore()

  const progressRef = useRef<HTMLDivElement>(null)
  const volumeRef = useRef<HTMLDivElement>(null)

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !duration) return
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      seek(ratio * duration)
    },
    [duration, seek]
  )

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!volumeRef.current) return
      const rect = volumeRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      setVolume(ratio)
    },
    [setVolume]
  )

  const cycleRepeatMode = useCallback(() => {
    const idx = REPEAT_CYCLE.indexOf(repeatMode)
    setRepeatMode(REPEAT_CYCLE[(idx + 1) % REPEAT_CYCLE.length])
  }, [repeatMode, setRepeatMode])

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="h-20 bg-obsidian-900 border-t border-obsidian-700 flex items-center px-6 gap-6">
      {/* Track info */}
      <div className="flex items-center gap-3 w-64 min-w-0">
        <div className="w-12 h-12 rounded bg-obsidian-700 flex items-center justify-center text-obsidian-400 flex-shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-obsidian-100">
            {currentTrack?.title || 'No track playing'}
          </p>
          <p className="text-xs truncate text-obsidian-400">
            {currentTrack?.artist || '---'}
          </p>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${
              shuffle ? 'text-arcane-400' : 'text-obsidian-400 hover:text-obsidian-100'
            }`}
            title={shuffle ? 'Shuffle on' : 'Shuffle off'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </button>

          <button
            onClick={previous}
            className="text-obsidian-400 hover:text-obsidian-100 transition-colors"
            title="Previous"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={currentTrack ? togglePlayPause : undefined}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
              currentTrack
                ? 'bg-obsidian-100 text-obsidian-950 hover:scale-105'
                : 'bg-obsidian-600 text-obsidian-400 cursor-default'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={next}
            className="text-obsidian-400 hover:text-obsidian-100 transition-colors"
            title="Next"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`transition-colors relative ${
              repeatMode !== 'none' ? 'text-arcane-400' : 'text-obsidian-400 hover:text-obsidian-100'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold text-arcane-400">1</span>
            )}
          </button>

          <button
            onClick={stop}
            className="text-obsidian-400 hover:text-obsidian-100 transition-colors"
            title="Stop"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xl flex items-center gap-2">
          <span className="text-xs text-obsidian-400 w-10 text-right tabular-nums">
            {formatDuration(progress)}
          </span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-obsidian-700 rounded-full group cursor-pointer relative"
          >
            <div
              className="h-full bg-obsidian-100 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
            </div>
          </div>
          <span className="text-xs text-obsidian-400 w-10 tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-36">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          className="text-obsidian-400 hover:text-obsidian-100 transition-colors"
          title={volume > 0 ? 'Mute' : 'Unmute'}
        >
          {volume === 0 ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
            </svg>
          )}
        </button>
        <div
          ref={volumeRef}
          onClick={handleVolumeClick}
          className="flex-1 h-1 bg-obsidian-700 rounded-full cursor-pointer relative"
        >
          <div
            className="h-full bg-obsidian-100 rounded-full"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
