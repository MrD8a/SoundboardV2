import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { PlayerBar } from './components/Player'

const viewLabels: Record<string, string> = {
  library: 'Track Library',
  playlists: 'Playlists',
  download: 'Download Tracks',
  discord: 'Discord'
}

function App(): React.JSX.Element {
  const [activeView, setActiveView] = useState('library')

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-display font-bold text-parchment-200 mb-6">
            {viewLabels[activeView] ?? activeView}
          </h2>
          <div className="text-obsidian-400 text-sm">
            {activeView === 'library' && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-obsidian-700 rounded-xl">
                <svg className="w-12 h-12 mb-3 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-obsidian-400 mb-1">Your library is empty</p>
                <p className="text-obsidian-500 text-xs">
                  Drag and drop audio files here or use the Download tab
                </p>
              </div>
            )}
            {activeView === 'playlists' && (
              <p>Create and manage your playlists here.</p>
            )}
            {activeView === 'download' && (
              <p>Paste a YouTube URL to download audio tracks.</p>
            )}
            {activeView === 'discord' && (
              <p>Connect your Discord bot and stream audio to voice channels.</p>
            )}
          </div>
        </main>
      </div>
      <PlayerBar />
    </div>
  )
}

export default App
