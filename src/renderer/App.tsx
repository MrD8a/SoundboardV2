import React, { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { PlayerBar } from './components/Player'
import { LibraryView } from './components/Library'
import { PlaylistView } from './components/Playlist'
import { DownloadView } from './components/Download'
import { usePlayerStore } from './stores/player-store'
import { useLibraryStore } from './stores/library-store'
import type { Track } from './types'

const viewLabels: Record<string, string> = {
  library: 'Track Library',
  playlists: 'Playlists',
  download: 'Download Tracks',
  discord: 'Discord'
}

function App(): React.JSX.Element {
  const [activeView, setActiveView] = useState('library')
  const playTrack = usePlayerStore((s) => s.playTrack)
  const setQueue = usePlayerStore((s) => s.setQueue)
  const getFilteredTracks = useLibraryStore((s) => s.getFilteredTracks)

  const handlePlayTrackFromLibrary = useCallback(
    (track: Track) => {
      const allTracks = getFilteredTracks()
      const idx = allTracks.findIndex((t) => t.id === track.id)
      setQueue(allTracks, idx >= 0 ? idx : 0)
      playTrack(track, allTracks)
    },
    [playTrack, setQueue, getFilteredTracks]
  )

  const handlePlayTrackFromPlaylist = useCallback(
    (track: Track, queue: Track[]) => {
      const idx = queue.findIndex((t) => t.id === track.id)
      setQueue(queue, idx >= 0 ? idx : 0)
      playTrack(track, queue)
    },
    [playTrack, setQueue]
  )

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-display font-bold text-parchment-200 mb-6">
            {viewLabels[activeView] ?? activeView}
          </h2>
          {activeView === 'library' && (
            <LibraryView onPlayTrack={handlePlayTrackFromLibrary} />
          )}
          {activeView === 'playlists' && (
            <PlaylistView onPlayTrack={handlePlayTrackFromPlaylist} />
          )}
          {activeView === 'download' && <DownloadView />}
          {activeView === 'discord' && (
            <p className="text-obsidian-400 text-sm">
              Connect your Discord bot and stream audio to voice channels.
            </p>
          )}
        </main>
      </div>
      <PlayerBar />
    </div>
  )
}

export default App
