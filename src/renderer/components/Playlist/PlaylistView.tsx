import React, { useEffect, useState, useCallback } from 'react'
import { usePlaylistStore } from '../../stores/playlist-store'
import { PlaylistDetail } from './PlaylistDetail'
import type { Playlist, Track } from '../../types'
import { PlaylistIconGlyph, PLAYLIST_ICON_OPTIONS } from '../../lib/playlist-icons'

interface PlaylistViewProps {
  onPlayTrack: (track: Track, queue: Track[]) => void
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ onPlayTrack }) => {
  const {
    playlists,
    selectedPlaylistId,
    isLoading,
    loadPlaylists,
    createPlaylist,
    deletePlaylist,
    selectPlaylist,
    updatePlaylist
  } = usePlaylistStore()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [iconPickerPlaylistId, setIconPickerPlaylistId] = useState<string | null>(null)

  useEffect(() => {
    loadPlaylists()
  }, [loadPlaylists])

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return
    await createPlaylist(newName.trim(), '', 'music')
    setNewName('')
    setShowCreate(false)
  }, [newName, createPlaylist])

  const handleStartEdit = useCallback((id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }, [])

  const handleSaveEdit = useCallback(
    async (playlist: Playlist) => {
      if (editName.trim()) {
        await updatePlaylist(playlist.id, editName.trim(), playlist.description, playlist.icon)
      }
      setEditingId(null)
    },
    [editName, updatePlaylist]
  )

  const handlePlayPlaylist = useCallback(
    async (playlistId: string) => {
      const tracks = (await window.api.db.getPlaylistTracks(playlistId)) as Track[]
      if (tracks.length > 0) {
        onPlayTrack(tracks[0], tracks)
      }
    },
    [onPlayTrack]
  )

  const handleIconChange = useCallback(
    async (playlist: Playlist, icon: string) => {
      await updatePlaylist(playlist.id, playlist.name, playlist.description, icon)
      setIconPickerPlaylistId(null)
    },
    [updatePlaylist]
  )

  if (selectedPlaylistId) {
    return (
      <PlaylistDetail
        onBack={() => selectPlaylist(null)}
        onPlayTrack={onPlayTrack}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex items-center gap-3">
        {showCreate ? (
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setShowCreate(false)
              }}
              className="input-field flex-1"
              autoFocus
            />
            <button onClick={handleCreate} className="btn-primary">
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Playlist
          </button>
        )}
      </div>

      {/* Playlist grid */}
      {isLoading ? (
        <p className="text-obsidian-400 text-sm">Loading...</p>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-obsidian-700 rounded-xl">
          <svg className="w-10 h-10 mb-2 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <p className="text-obsidian-400 text-sm">No playlists yet</p>
          <p className="text-obsidian-500 text-xs">Click &quot;New Playlist&quot; to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="relative rounded-xl border border-obsidian-700 bg-obsidian-800 p-3 transition-colors hover:bg-obsidian-700/70 group"
              onClick={() => {
                if (editingId !== pl.id) selectPlaylist(pl.id)
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-obsidian-700 text-parchment-300">
                  <PlaylistIconGlyph icon={pl.icon} className="h-7 w-7" />
                </div>

                <div className="relative flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void handlePlayPlaylist(pl.id)
                    }}
                    className="rounded-md bg-parchment-300/10 p-2 text-parchment-300 hover:bg-parchment-300/20"
                    title="Play playlist"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIconPickerPlaylistId((current) => (current === pl.id ? null : pl.id))
                    }}
                    className="rounded-md p-2 text-obsidian-400 hover:bg-obsidian-700 hover:text-obsidian-100"
                    title="Choose icon"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {editingId === pl.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(pl)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => handleSaveEdit(pl)}
                  className="input-field w-full text-sm"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <p className="text-sm font-medium text-obsidian-100 truncate">{pl.name}</p>
              )}
              {pl.description && (
                <p className="text-xs text-obsidian-400 truncate mt-0.5">{pl.description}</p>
              )}

              {/* Actions */}
              <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartEdit(pl.id, pl.name)
                  }}
                  className="text-xs text-obsidian-400 hover:text-obsidian-100 px-2 py-1 rounded"
                  title="Rename"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePlaylist(pl.id)
                  }}
                  className="text-xs text-obsidian-400 hover:text-dragon-400 px-2 py-1 rounded"
                  title="Delete"
                >
                  Delete
                </button>
              </div>

              {iconPickerPlaylistId === pl.id && (
                <div
                  className="absolute right-3 top-14 z-10 min-w-[180px] rounded-lg border border-obsidian-700 bg-obsidian-900 p-2 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wide text-obsidian-500">
                    Playlist icon
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {PLAYLIST_ICON_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => void handleIconChange(pl, option.key)}
                        className={`flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors ${
                          pl.icon === option.key
                            ? 'bg-arcane-600/20 text-arcane-300'
                            : 'text-obsidian-300 hover:bg-obsidian-800 hover:text-obsidian-100'
                        }`}
                      >
                        <PlaylistIconGlyph icon={option.key} className="h-4 w-4" />
                        <span className="truncate">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
