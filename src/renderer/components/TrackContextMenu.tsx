import React, { useEffect, useRef, useState } from 'react'
import type { Playlist, Track } from '../types'

interface TrackContextMenuProps {
  track: Track
  playlists: Playlist[]
  position: { x: number; y: number }
  showRemoveFromPlaylist?: boolean
  onRename: () => void
  onAddToPlaylist: (playlistId: string) => void
  onDelete: () => void
  onRemoveFromPlaylist?: () => void
  onClose: () => void
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  track,
  playlists,
  position,
  showRemoveFromPlaylist = false,
  onRename,
  onAddToPlaylist,
  onDelete,
  onRemoveFromPlaylist,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [submenuOpen, setSubmenuOpen] = useState(false)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const menuStyle: React.CSSProperties = {
    left: Math.min(position.x, window.innerWidth - 220),
    top: Math.min(position.y, window.innerHeight - 220)
  }

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="fixed z-50 min-w-[200px] rounded-lg border border-obsidian-700 bg-obsidian-900 shadow-2xl"
    >
      <div className="border-b border-obsidian-700 px-3 py-2">
        <p className="truncate text-xs font-medium text-obsidian-100">{track.title}</p>
      </div>

      <div className="py-1 text-sm">
        <button
          onClick={() => {
            onRename()
            onClose()
          }}
          className="flex w-full items-center px-3 py-2 text-left text-obsidian-200 hover:bg-obsidian-800"
        >
          Rename
        </button>

        <div
          className="relative"
          onMouseEnter={() => setSubmenuOpen(true)}
          onMouseLeave={() => setSubmenuOpen(false)}
        >
          <button className="flex w-full items-center justify-between px-3 py-2 text-left text-obsidian-200 hover:bg-obsidian-800">
            <span>Add to</span>
            <svg className="h-4 w-4 text-obsidian-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {submenuOpen && (
            <div className="absolute left-full top-0 ml-1 min-w-[180px] rounded-lg border border-obsidian-700 bg-obsidian-900 shadow-2xl">
              <div className="py-1">
                {playlists.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-obsidian-500">No playlists yet</div>
                ) : (
                  playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        onAddToPlaylist(playlist.id)
                        onClose()
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-obsidian-200 hover:bg-obsidian-800"
                    >
                      <span className="truncate">{playlist.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {showRemoveFromPlaylist && onRemoveFromPlaylist && (
          <button
            onClick={() => {
              onRemoveFromPlaylist()
              onClose()
            }}
            className="flex w-full items-center px-3 py-2 text-left text-obsidian-200 hover:bg-obsidian-800"
          >
            Remove from playlist
          </button>
        )}

        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          className="flex w-full items-center px-3 py-2 text-left text-dragon-400 hover:bg-obsidian-800"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
