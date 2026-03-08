import React, { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { PlayerBar } from './components/Player'
import { LibraryView } from './components/Library'
import type { Track } from './types'

const viewLabels: Record<string, string> = {
  library: 'Track Library',
  playlists: 'Playlists',
  download: 'Download Tracks',
  discord: 'Discord'
}

function App(): React.JSX.Element {
  const [activeView, setActiveView] = useState('library')

  const handlePlayTrack = useCallback((_track: Track) => {
    // Will be implemented in Phase 3 (Audio Player)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-display font-bold text-parchment-200 mb-6">
            {viewLabels[activeView] ?? activeView}
          </h2>
          {activeView === 'library' && <LibraryView onPlayTrack={handlePlayTrack} />}
          {activeView === 'playlists' && (
            <p className="text-obsidian-400 text-sm">Create and manage your playlists here.</p>
          )}
          {activeView === 'download' && (
            <p className="text-obsidian-400 text-sm">
              Paste a YouTube URL to download audio tracks.
            </p>
          )}
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
