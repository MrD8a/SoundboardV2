import React from 'react'
import type { Track } from '../../types'
import { formatDuration } from '../../lib/format'

interface TrackRowProps {
  track: Track
  index: number
  onPlay: (track: Track) => void
  onDelete: (id: string) => void
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>, track: Track) => void
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, index, onPlay, onDelete, onContextMenu }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-soundboard-track-id', track.id)
    e.dataTransfer.setData('text/plain', track.id)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onContextMenu={(event) => onContextMenu?.(event, track)}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-obsidian-800/50 group transition-colors cursor-grab active:cursor-grabbing"
    >
      <span className="w-8 text-right text-xs text-obsidian-500 group-hover:hidden">
        {index + 1}
      </span>
      <button
        onClick={() => onPlay(track)}
        className="w-8 text-right hidden group-hover:block"
        title="Play"
      >
        <svg className="w-4 h-4 text-obsidian-100 ml-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-obsidian-100 truncate">{track.title}</p>
        <p className="text-xs text-obsidian-400 truncate">{track.artist || 'Unknown artist'}</p>
      </div>

      <span className="text-xs text-obsidian-400 uppercase px-2">{track.format}</span>

      <span className="text-xs text-obsidian-400 w-12 text-right">
        {formatDuration(track.duration)}
      </span>

      <button
        onClick={() => onDelete(track.id)}
        className="opacity-0 group-hover:opacity-100 text-obsidian-400 hover:text-dragon-400 transition-all p-1"
        title="Delete track"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
