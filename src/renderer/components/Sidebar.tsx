import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePlaylistStore } from '../stores/playlist-store'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const navItems = [
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'playlists', label: 'Playlists', icon: PlaylistIcon },
  { id: 'download', label: 'Download', icon: DownloadIcon },
  { id: 'discord', label: 'Discord', icon: DiscordIcon }
]

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { playlists, selectedPlaylistId, loadPlaylists, selectPlaylist, addTrackToPlaylist } =
    usePlaylistStore()
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(activeView === 'playlists')
  const [dragOverPlaylistId, setDragOverPlaylistId] = useState<string | null>(null)

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  useEffect(() => {
    if (activeView === 'playlists') {
      setIsPlaylistMenuOpen(true)
    }
  }, [activeView])

  const navItemsWithState = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        isActive: activeView === item.id
      })),
    [activeView]
  )

  const handlePlaylistHeaderClick = useCallback(() => {
    onViewChange('playlists')
    void selectPlaylist(null)
  }, [onViewChange, selectPlaylist])

  const handlePlaylistToggle = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsPlaylistMenuOpen((open) => !open)
  }, [])

  const handlePlaylistSelect = useCallback(
    async (playlistId: string) => {
      onViewChange('playlists')
      await selectPlaylist(playlistId)
    },
    [onViewChange, selectPlaylist]
  )

  const hasDraggedTrack = (e: React.DragEvent): boolean => {
    return (
      Array.from(e.dataTransfer.types).includes('application/x-soundboard-track-id') ||
      Array.from(e.dataTransfer.types).includes('text/plain')
    )
  }

  const getDraggedTrackId = (e: React.DragEvent): string => {
    return (
      e.dataTransfer.getData('application/x-soundboard-track-id') ||
      e.dataTransfer.getData('text/plain')
    )
  }

  const handlePlaylistDragOver = useCallback((e: React.DragEvent, playlistId: string) => {
    if (!hasDraggedTrack(e)) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsPlaylistMenuOpen(true)
    setDragOverPlaylistId(playlistId)
  }, [])

  const handlePlaylistDragEnter = useCallback((e: React.DragEvent, playlistId: string) => {
    if (!hasDraggedTrack(e)) return
    e.preventDefault()
    setIsPlaylistMenuOpen(true)
    setDragOverPlaylistId(playlistId)
  }, [])

  const handlePlaylistDrop = useCallback(
    async (e: React.DragEvent, playlistId: string) => {
      const trackId = getDraggedTrackId(e)
      e.preventDefault()
      e.stopPropagation()
      setDragOverPlaylistId(null)
      if (!trackId) return
      await addTrackToPlaylist(playlistId, trackId)
    },
    [addTrackToPlaylist]
  )

  const handlePlaylistDragLeave = useCallback((playlistId: string) => {
    setDragOverPlaylistId((current) => (current === playlistId ? null : current))
  }, [])

  const handlePlaylistMenuDragOver = useCallback((e: React.DragEvent) => {
    if (!hasDraggedTrack(e)) return
    e.preventDefault()
    e.stopPropagation()
    setIsPlaylistMenuOpen(true)
  }, [])

  const handlePlaylistMenuDragEnter = useCallback((e: React.DragEvent) => {
    if (!hasDraggedTrack(e)) return
    e.preventDefault()
    setIsPlaylistMenuOpen(true)
  }, [])

  return (
    <aside className="w-56 bg-obsidian-900 border-r border-obsidian-700 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-obsidian-700">
        <h1 className="font-display text-lg font-bold text-parchment-300 tracking-wide">
          SoundboardV2
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItemsWithState.map((item) => {
          return (
            <div key={item.id}>
              {item.id === 'playlists' ? (
                <div onDragEnter={handlePlaylistMenuDragEnter} onDragOver={handlePlaylistMenuDragOver}>
                  <div
                    className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors ${
                      item.isActive
                        ? 'bg-arcane-600/20 text-arcane-400'
                        : 'text-obsidian-300 hover:text-obsidian-100 hover:bg-obsidian-800'
                    }`}
                  >
                    <button
                      onClick={handlePlaylistHeaderClick}
                      className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                    <button
                      onClick={(e) => handlePlaylistToggle(e)}
                      className="px-3 py-2.5 text-obsidian-400 hover:text-obsidian-100"
                      title={isPlaylistMenuOpen ? 'Collapse playlists' : 'Expand playlists'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isPlaylistMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {isPlaylistMenuOpen && (
                    <div className="mt-1 ml-4 space-y-1">
                      {playlists.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-obsidian-500">No playlists yet</div>
                      ) : (
                        playlists.map((playlist) => {
                          const isSelected = selectedPlaylistId === playlist.id
                          const isDropTarget = dragOverPlaylistId === playlist.id

                          return (
                            <button
                              key={playlist.id}
                              onClick={() => void handlePlaylistSelect(playlist.id)}
                              onDragEnter={(e) => handlePlaylistDragEnter(e, playlist.id)}
                              onDragOver={(e) => handlePlaylistDragOver(e, playlist.id)}
                              onDragLeave={() => handlePlaylistDragLeave(playlist.id)}
                              onDrop={(e) => void handlePlaylistDrop(e, playlist.id)}
                              className={`w-full flex items-center rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                                isDropTarget
                                  ? 'bg-parchment-400/15 text-parchment-200 ring-1 ring-parchment-400/40'
                                  : isSelected
                                    ? 'bg-arcane-600/20 text-arcane-300'
                                    : 'text-obsidian-400 hover:bg-obsidian-800 hover:text-obsidian-100'
                              }`}
                            >
                              <span className="truncate">{playlist.name}</span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'bg-arcane-600/20 text-arcane-400'
                      : 'text-obsidian-300 hover:text-obsidian-100 hover:bg-obsidian-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              )}
            </div>
          )
        })}
      </nav>

      {/* Version info */}
      <div className="px-5 py-3 border-t border-obsidian-700">
        <p className="text-xs text-obsidian-500">v0.1.0</p>
      </div>
    </aside>
  )
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function PlaylistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}
