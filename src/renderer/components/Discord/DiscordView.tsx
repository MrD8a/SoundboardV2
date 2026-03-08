import React, { useState, useCallback, useEffect } from 'react'
import { useDiscordStore } from '../../stores/discord-store'

export const DiscordView: React.FC = () => {
  const {
    isConnected,
    botUsername,
    guilds,
    voiceChannels,
    selectedGuildId,
    selectedChannelId,
    isInChannel,
    status,
    error,
    isLoading,
    connect,
    disconnect,
    selectGuild,
    joinChannel,
    leaveChannel,
    setStatus,
    clearError
  } = useDiscordStore()

  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    const cleanup = window.api.discord.onStatusChange((newStatus: string) => {
      setStatus(newStatus)
    })
    return cleanup
  }, [setStatus])

  const handleConnect = useCallback(async () => {
    if (!token.trim()) return
    await connect(token.trim())
  }, [token, connect])

  const statusColor: Record<string, string> = {
    disconnected: 'text-obsidian-400',
    connected: 'text-green-400',
    'in-channel': 'text-arcane-400',
    playing: 'text-parchment-400',
    error: 'text-dragon-400',
    'player-error': 'text-dragon-400'
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Connection status */}
      <div className="bg-obsidian-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-obsidian-500'
              }`}
            />
            <div>
              <p className="text-sm font-medium text-obsidian-100">
                {isConnected ? `Connected as ${botUsername}` : 'Not connected'}
              </p>
              <p className={`text-xs capitalize ${statusColor[status] || 'text-obsidian-400'}`}>
                {status.replace('-', ' ')}
              </p>
            </div>
          </div>

          {isConnected && (
            <button onClick={disconnect} className="btn-danger text-xs">
              Disconnect
            </button>
          )}
        </div>

        {!isConnected && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-obsidian-400 mb-1">Bot Token</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="Paste your Discord bot token..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConnect()
                    }}
                    className="input-field w-full pr-10"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-200 text-xs"
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={!token.trim() || isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-dragon-600/20 border border-dragon-600/40 rounded-lg text-sm text-dragon-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-xs text-obsidian-400 hover:text-obsidian-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Server & channel selection */}
      {isConnected && (
        <div className="bg-obsidian-800 rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-xs text-obsidian-400 mb-2">Server</label>
            <div className="grid grid-cols-2 gap-2">
              {guilds.length === 0 ? (
                <p className="text-xs text-obsidian-500 col-span-2">
                  Bot is not in any servers.
                </p>
              ) : (
                guilds.map((guild) => (
                  <button
                    key={guild.id}
                    onClick={() => selectGuild(guild.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                      selectedGuildId === guild.id
                        ? 'bg-arcane-600/20 text-arcane-400 border border-arcane-600/40'
                        : 'bg-obsidian-700 text-obsidian-200 hover:bg-obsidian-600'
                    }`}
                  >
                    {guild.icon ? (
                      <img src={guild.icon} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-obsidian-500 flex items-center justify-center text-xs">
                        {guild.name[0]}
                      </div>
                    )}
                    <span className="truncate">{guild.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedGuildId && (
            <div>
              <label className="block text-xs text-obsidian-400 mb-2">Voice Channel</label>
              <div className="space-y-1">
                {voiceChannels.length === 0 ? (
                  <p className="text-xs text-obsidian-500">No voice channels found.</p>
                ) : (
                  voiceChannels.map((ch) => (
                    <div
                      key={ch.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                        selectedChannelId === ch.id
                          ? 'bg-arcane-600/20 border border-arcane-600/40'
                          : 'bg-obsidian-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-obsidian-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                        </svg>
                        <span className="text-obsidian-200">{ch.name}</span>
                        <span className="text-xs text-obsidian-500">
                          ({ch.memberCount} member{ch.memberCount !== 1 ? 's' : ''})
                        </span>
                      </div>

                      {selectedChannelId === ch.id ? (
                        <button onClick={leaveChannel} className="btn-danger text-xs py-1">
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => joinChannel(ch.id)}
                          disabled={isLoading}
                          className="btn-secondary text-xs py-1"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-stream indicator */}
      {isInChannel && (
        <div className="bg-obsidian-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-arcane-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-obsidian-200">Auto-streaming active</p>
              <p className="text-xs text-obsidian-400">
                Playback, volume, and seek are synced to the voice channel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Setup help */}
      <div className="p-4 bg-obsidian-800/50 rounded-xl text-xs text-obsidian-400 space-y-1">
        <p className="font-medium text-obsidian-300">Setup Guide:</p>
        <p>1. Create a bot at discord.com/developers/applications</p>
        <p>2. Enable the &quot;MESSAGE CONTENT&quot; and &quot;SERVER MEMBERS&quot; privileged intents</p>
        <p>3. Generate an invite link with &quot;Connect&quot; and &quot;Speak&quot; permissions</p>
        <p>4. Invite the bot to your server, then paste the token above</p>
      </div>
    </div>
  )
}
