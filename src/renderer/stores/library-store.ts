import { create } from 'zustand'
import type { Track } from '../types'

interface LibraryState {
  tracks: Track[]
  searchQuery: string
  sortBy: 'title' | 'artist' | 'duration' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  isLoading: boolean

  loadTracks: () => Promise<void>
  importFiles: () => Promise<void>
  importDroppedFiles: (paths: string[]) => Promise<void>
  deleteTrack: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: LibraryState['sortBy']) => void
  toggleSortOrder: () => void
  getFilteredTracks: () => Track[]
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  searchQuery: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isLoading: false,

  loadTracks: async () => {
    set({ isLoading: true })
    try {
      const tracks = await window.api.db.getTracks()
      set({ tracks: tracks as Track[] })
    } finally {
      set({ isLoading: false })
    }
  },

  importFiles: async () => {
    const imported = await window.api.audio.showImportDialog()
    if (imported && imported.length > 0) {
      await get().loadTracks()
    }
  },

  importDroppedFiles: async (paths: string[]) => {
    set({ isLoading: true })
    try {
      await window.api.audio.importDroppedFiles(paths)
      await get().loadTracks()
    } finally {
      set({ isLoading: false })
    }
  },

  deleteTrack: async (id: string) => {
    await window.api.db.deleteTrack(id)
    set((state) => ({ tracks: state.tracks.filter((t) => t.id !== id) }))
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setSortBy: (sortBy: LibraryState['sortBy']) => set({ sortBy }),

  toggleSortOrder: () =>
    set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),

  getFilteredTracks: () => {
    const { tracks, searchQuery, sortBy, sortOrder } = get()
    let filtered = tracks

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = tracks.filter(
        (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      )
    }

    filtered = [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'artist':
          cmp = a.artist.localeCompare(b.artist)
          break
        case 'duration':
          cmp = a.duration - b.duration
          break
        case 'createdAt':
          cmp = a.createdAt.localeCompare(b.createdAt)
          break
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return filtered
  }
}))
