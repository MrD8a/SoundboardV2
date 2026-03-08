import React, { useCallback, useRef } from 'react'
import { usePlaylistStore } from '../../stores/playlist-store'
import { formatDuration } from '../../lib/format'
import type { Track } from '../../types'

interface PlaylistDetailProps {
  onBack: () => void
  onPlayTrack: (track: Track, queue: Track[]) => void
}

export const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ onBack, onPlayTrack }) => {
  const {
    playlists,
    selectedPlaylistId,
    selectedPlaylistTracks,
    removeTrackFromPlaylist,
    reorderTracks
  } = usePlaylistStore()

  const playlist = playlists.find((p) => p.id === selectedPlaylistId)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index
  }, [])

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index
  }, [])

  const handleDragEnd = useCallback(() => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current ||
      !selectedPlaylistId
    ) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }

    const newTracks = [...selectedPlaylistTracks]
    const [removed] = newTracks.splice(dragItem.current, 1)
    newTracks.splice(dragOverItem.current, 0, removed)

    reorderTracks(
      selectedPlaylistId,
      newTracks.map((t) => t.id)
    )

    dragItem.current = null
    dragOverItem.current = null
  }, [selectedPlaylistTracks, selectedPlaylistId, reorderTracks])

  if (!playlist) return null

  const totalDuration = selectedPlaylistTracks.reduce((sum, t) => sum + t.duration, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-obsidian-400 hover:text-obsidian-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h3 className="text-xl font-display font-bold text-parchment-200">{playlist.name}</h3>
          <p className="text-xs text-obsidian-400">
            {selectedPlaylistTracks.length} tracks &middot; {formatDuration(totalDuration)}
          </p>
        </div>
        {selectedPlaylistTracks.length > 0 && (
          <button
            onClick={() => onPlayTrack(selectedPlaylistTracks[0], selectedPlaylistTracks)}
            className="btn-primary ml-auto"
          >
            Play All
          </button>
        )}
      </div>

      {/* Track list */}
      {selectedPlaylistTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-obsidian-700 rounded-xl">
          <p className="text-obsidian-400 text-sm">This playlist is empty</p>
          <p className="text-obsidian-500 text-xs mt-1">
            Add tracks from the Library or the Playlists overview
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {selectedPlaylistTracks.map((track, index) => (
            <div
              key={track.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-obsidian-800/50 group cursor-grab active:cursor-grabbing transition-colors"
            >
              <span className="w-6 text-obsidian-500 cursor-grab">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </span>

              <span className="w-6 text-right text-xs text-obsidian-500 group-hover:hidden">
                {index + 1}
              </span>
              <button
                onClick={() => onPlayTrack(track, selectedPlaylistTracks)}
                className="w-6 text-right hidden group-hover:block"
              >
                <svg className="w-4 h-4 text-obsidian-100 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-obsidian-100 truncate">{track.title}</p>
                <p className="text-xs text-obsidian-400 truncate">
                  {track.artist || 'Unknown artist'}
                </p>
              </div>

              <span className="text-xs text-obsidian-400 w-12 text-right tabular-nums">
                {formatDuration(track.duration)}
              </span>

              <button
                onClick={() => removeTrackFromPlaylist(playlist.id, track.id)}
                className="opacity-0 group-hover:opacity-100 text-obsidian-400 hover:text-dragon-400 transition-all p-1"
                title="Remove from playlist"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
