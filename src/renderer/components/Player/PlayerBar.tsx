import React from 'react'

export const PlayerBar: React.FC = () => {
  return (
    <div className="h-20 bg-obsidian-900 border-t border-obsidian-700 flex items-center px-6 gap-6">
      {/* Track info */}
      <div className="flex items-center gap-3 w-64 min-w-0">
        <div className="w-12 h-12 rounded bg-obsidian-700 flex items-center justify-center text-obsidian-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-obsidian-100">No track playing</p>
          <p className="text-xs truncate text-obsidian-400">---</p>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button className="text-obsidian-400 hover:text-obsidian-100 transition-colors" title="Shuffle">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4l3 9 3-9h4M4 20h4l3-9 3 9h4" />
            </svg>
          </button>
          <button className="text-obsidian-400 hover:text-obsidian-100 transition-colors" title="Previous">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button className="w-9 h-9 rounded-full bg-obsidian-100 text-obsidian-950 flex items-center justify-center hover:scale-105 transition-transform" title="Play">
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button className="text-obsidian-400 hover:text-obsidian-100 transition-colors" title="Next">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          <button className="text-obsidian-400 hover:text-obsidian-100 transition-colors" title="Repeat">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xl flex items-center gap-2">
          <span className="text-xs text-obsidian-400 w-10 text-right">0:00</span>
          <div className="flex-1 h-1 bg-obsidian-700 rounded-full group cursor-pointer">
            <div className="h-full bg-obsidian-100 rounded-full relative" style={{ width: '0%' }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-xs text-obsidian-400 w-10">0:00</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-36">
        <button className="text-obsidian-400 hover:text-obsidian-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
          </svg>
        </button>
        <div className="flex-1 h-1 bg-obsidian-700 rounded-full cursor-pointer">
          <div className="h-full bg-obsidian-100 rounded-full" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  )
}
