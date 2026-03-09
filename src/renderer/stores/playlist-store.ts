import { create } from 'zustand'
import type { Playlist, Track } from '../types'

interface PlaylistState {
  playlists: Playlist[]
  selectedPlaylistId: string | null
  selectedPlaylistTracks: Track[]
  isLoading: boolean

  loadPlaylists: () => Promise<void>
  createPlaylist: (name: string, description?: string, icon?: string) => Promise<Playlist>
  updatePlaylist: (id: string, name: string, description?: string, icon?: string) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  selectPlaylist: (id: string | null) => Promise<void>
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
  reorderTracks: (playlistId: string, trackIds: string[]) => Promise<void>
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  selectedPlaylistId: null,
  selectedPlaylistTracks: [],
  isLoading: false,

  loadPlaylists: async () => {
    set({ isLoading: true })
    try {
      const playlists = await window.api.db.getPlaylists()
      set({ playlists: playlists as Playlist[] })
    } finally {
      set({ isLoading: false })
    }
  },

  createPlaylist: async (name: string, description?: string, icon?: string) => {
    const playlist = await window.api.db.createPlaylist(name, description, icon)
    await get().loadPlaylists()
    return playlist as Playlist
  },

  updatePlaylist: async (id: string, name: string, description?: string, icon?: string) => {
    await window.api.db.updatePlaylist(id, name, description, icon)
    await get().loadPlaylists()
    if (get().selectedPlaylistId === id) {
      await get().selectPlaylist(id)
    }
  },

  deletePlaylist: async (id: string) => {
    await window.api.db.deletePlaylist(id)
    if (get().selectedPlaylistId === id) {
      set({ selectedPlaylistId: null, selectedPlaylistTracks: [] })
    }
    await get().loadPlaylists()
  },

  selectPlaylist: async (id: string | null) => {
    if (!id) {
      set({ selectedPlaylistId: null, selectedPlaylistTracks: [] })
      return
    }

    set({ selectedPlaylistId: id, isLoading: true })
    try {
      const tracks = await window.api.db.getPlaylistTracks(id)
      set({ selectedPlaylistTracks: tracks as Track[] })
    } finally {
      set({ isLoading: false })
    }
  },

  addTrackToPlaylist: async (playlistId: string, trackId: string) => {
    await window.api.db.addTrackToPlaylist(playlistId, trackId)
    if (get().selectedPlaylistId === playlistId) {
      await get().selectPlaylist(playlistId)
    }
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
    await window.api.db.removeTrackFromPlaylist(playlistId, trackId)
    if (get().selectedPlaylistId === playlistId) {
      await get().selectPlaylist(playlistId)
    }
  },

  reorderTracks: async (playlistId: string, trackIds: string[]) => {
    await window.api.db.reorderPlaylistTracks(playlistId, trackIds)
    if (get().selectedPlaylistId === playlistId) {
      await get().selectPlaylist(playlistId)
    }
  }
}))
