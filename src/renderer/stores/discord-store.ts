import { create } from 'zustand'
import type { Guild, VoiceChannel } from '../types'

interface DiscordState {
  isConnected: boolean
  botUsername: string | null
  guilds: Guild[]
  voiceChannels: VoiceChannel[]
  selectedGuildId: string | null
  selectedChannelId: string | null
  isInChannel: boolean
  status: string
  error: string | null
  isLoading: boolean

  connect: (token: string) => Promise<void>
  disconnect: () => Promise<void>
  loadGuilds: () => Promise<void>
  selectGuild: (guildId: string) => Promise<void>
  joinChannel: (channelId: string) => Promise<void>
  leaveChannel: () => Promise<void>
  playTrack: (filePath: string) => Promise<void>
  stopTrack: () => Promise<void>
  setStatus: (status: string) => void
  clearError: () => void
}

export const useDiscordStore = create<DiscordState>((set, get) => ({
  isConnected: false,
  botUsername: null,
  guilds: [],
  voiceChannels: [],
  selectedGuildId: null,
  selectedChannelId: null,
  isInChannel: false,
  status: 'disconnected',
  error: null,
  isLoading: false,

  connect: async (token: string) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.discord.connect(token)
      set({
        isConnected: true,
        botUsername: (result as { username: string }).username,
        status: 'connected'
      })
      await get().loadGuilds()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Connection failed' })
    } finally {
      set({ isLoading: false })
    }
  },

  disconnect: async () => {
    try {
      await window.api.discord.disconnect()
    } finally {
      set({
        isConnected: false,
        botUsername: null,
        guilds: [],
        voiceChannels: [],
        selectedGuildId: null,
        selectedChannelId: null,
        isInChannel: false,
        status: 'disconnected'
      })
    }
  },

  loadGuilds: async () => {
    const guilds = await window.api.discord.getGuilds()
    set({ guilds: guilds as Guild[] })
  },

  selectGuild: async (guildId: string) => {
    set({ selectedGuildId: guildId, selectedChannelId: null })
    const channels = await window.api.discord.getVoiceChannels(guildId)
    set({ voiceChannels: channels as VoiceChannel[] })
  },

  joinChannel: async (channelId: string) => {
    const { selectedGuildId } = get()
    if (!selectedGuildId) return

    set({ isLoading: true, error: null })
    try {
      await window.api.discord.joinChannel(selectedGuildId, channelId)
      set({ selectedChannelId: channelId, isInChannel: true, status: 'in-channel' })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to join channel' })
    } finally {
      set({ isLoading: false })
    }
  },

  leaveChannel: async () => {
    try {
      await window.api.discord.leaveChannel()
    } finally {
      set({ selectedChannelId: null, isInChannel: false, status: 'connected' })
    }
  },

  playTrack: async (filePath: string) => {
    try {
      await window.api.discord.playTrack(filePath)
      set({ status: 'playing' })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Playback failed' })
    }
  },

  stopTrack: async () => {
    try {
      await window.api.discord.stopTrack()
      set({ status: 'in-channel' })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Stop failed' })
    }
  },

  setStatus: (status: string) => set({ status }),
  clearError: () => set({ error: null })
}))
