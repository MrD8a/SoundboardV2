export interface Track {
  id: string
  title: string
  artist: string
  duration: number
  filePath: string
  fileSize: number
  format: string
  source: 'youtube' | 'import'
  sourceUrl: string
  thumbnailPath: string
  createdAt: string
}

export interface Playlist {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[]
}

export type RepeatMode = 'none' | 'one' | 'all'

export interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  repeatMode: RepeatMode
  shuffle: boolean
}

export interface DiscordStatus {
  connected: boolean
  botUsername: string | null
  currentGuildId: string | null
  currentChannelId: string | null
}

export interface Guild {
  id: string
  name: string
  icon: string | null
}

export interface VoiceChannel {
  id: string
  name: string
  memberCount: number
}
