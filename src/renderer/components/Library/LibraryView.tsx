import React, { useEffect, useCallback } from 'react'
import { useLibraryStore } from '../../stores/library-store'
import { TrackRow } from './TrackRow'
import type { Track } from '../../types'
import { usePlaylistStore } from '../../stores/playlist-store'
import { TrackContextMenu } from '../TrackContextMenu'

interface LibraryViewProps {
  onPlayTrack: (track: Track) => void
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onPlayTrack }) => {
  const {
    isLoading,
    searchQuery,
    sortBy,
    loadTracks,
    importFiles,
    importDroppedFiles,
    renameTrack,
    deleteTrack,
    setSearchQuery,
    setSortBy,
    toggleSortOrder,
    getFilteredTracks
  } = useLibraryStore()
  const { playlists, loadPlaylists, addTrackToPlaylist } = usePlaylistStore()
  const [contextMenu, setContextMenu] = React.useState<{
    track: Track
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    loadTracks()
  }, [loadTracks])

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  const filteredTracks = getFilteredTracks()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const files = Array.from(e.dataTransfer.files)
      const paths = files.map((f) => f.path).filter(Boolean)

      if (paths.length > 0) {
        importDroppedFiles(paths)
      }
    },
    [importDroppedFiles]
  )

  const handleTrackContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>, track: Track) => {
    event.preventDefault()
    setContextMenu({
      track,
      x: event.clientX,
      y: event.clientY
    })
  }, [])

  const handleRenameTrack = useCallback(
    async (track: Track) => {
      const nextTitle = window.prompt('Rename track', track.title)?.trim()
      if (!nextTitle || nextTitle === track.title) return
      await renameTrack(track.id, nextTitle)
    },
    [renameTrack]
  )

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="input-field"
        >
          <option value="createdAt">Date Added</option>
          <option value="title">Title</option>
          <option value="artist">Artist</option>
          <option value="duration">Duration</option>
        </select>

        <button onClick={toggleSortOrder} className="btn-secondary px-2" title="Toggle sort order">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>

        <button onClick={importFiles} className="btn-primary">
          Import Files
        </button>
      </div>

      {/* Track list */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-obsidian-400">Loading...</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-obsidian-700 rounded-xl">
          <svg
            className="w-12 h-12 mb-3 text-obsidian-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <p className="text-obsidian-400 mb-1">
            {searchQuery ? 'No tracks match your search' : 'Your library is empty'}
          </p>
          <p className="text-obsidian-500 text-xs">
            Drag and drop audio files here or click Import Files
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {filteredTracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              onPlay={onPlayTrack}
              onDelete={deleteTrack}
              onContextMenu={handleTrackContextMenu}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <TrackContextMenu
          track={contextMenu.track}
          playlists={playlists}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onRename={() => void handleRenameTrack(contextMenu.track)}
          onAddToPlaylist={(playlistId) => void addTrackToPlaylist(playlistId, contextMenu.track.id)}
          onDelete={() => void deleteTrack(contextMenu.track.id)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
