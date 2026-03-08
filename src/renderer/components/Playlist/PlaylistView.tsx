import React, { useEffect, useState, useCallback } from 'react'
import { usePlaylistStore } from '../../stores/playlist-store'
import { useLibraryStore } from '../../stores/library-store'
import { PlaylistDetail } from './PlaylistDetail'
import type { Track } from '../../types'

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

  useEffect(() => {
    loadPlaylists()
  }, [loadPlaylists])

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return
    await createPlaylist(newName.trim())
    setNewName('')
    setShowCreate(false)
  }, [newName, createPlaylist])

  const handleStartEdit = useCallback((id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }, [])

  const handleSaveEdit = useCallback(
    async (id: string) => {
      if (editName.trim()) {
        await updatePlaylist(id, editName.trim())
      }
      setEditingId(null)
    },
    [editName, updatePlaylist]
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="bg-obsidian-800 rounded-xl p-4 hover:bg-obsidian-700/70 transition-colors cursor-pointer group"
              onClick={() => {
                if (editingId !== pl.id) selectPlaylist(pl.id)
              }}
            >
              <div className="w-full aspect-square rounded-lg bg-obsidian-700 flex items-center justify-center mb-3">
                <svg className="w-10 h-10 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>

              {editingId === pl.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(pl.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => handleSaveEdit(pl.id)}
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
              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
          ))}
        </div>
      )}

      {/* Add tracks from library hint */}
      {playlists.length > 0 && <AddTrackHint />}
    </div>
  )
}

const AddTrackHint: React.FC = () => {
  const { playlists } = usePlaylistStore()
  const { tracks } = useLibraryStore()
  const { addTrackToPlaylist } = usePlaylistStore()
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')

  const handleAdd = useCallback(async () => {
    if (selectedTrackId && selectedPlaylistId) {
      await addTrackToPlaylist(selectedPlaylistId, selectedTrackId)
      setSelectedTrackId('')
    }
  }, [selectedTrackId, selectedPlaylistId, addTrackToPlaylist])

  if (tracks.length === 0) return null

  return (
    <div className="mt-6 p-4 bg-obsidian-800/50 rounded-xl">
      <p className="text-sm font-medium text-obsidian-200 mb-3">Quick add track to playlist</p>
      <div className="flex items-center gap-2">
        <select
          value={selectedTrackId}
          onChange={(e) => setSelectedTrackId(e.target.value)}
          className="input-field flex-1"
        >
          <option value="">Select a track...</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          value={selectedPlaylistId}
          onChange={(e) => setSelectedPlaylistId(e.target.value)}
          className="input-field"
        >
          <option value="">Select playlist...</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedTrackId || !selectedPlaylistId}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  )
}
