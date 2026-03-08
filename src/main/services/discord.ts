import type { Client, Guild, VoiceBasedChannel } from 'discord.js'
import type { VoiceConnection, AudioPlayer, AudioResource } from '@discordjs/voice'
import { BrowserWindow } from 'electron'
import { createRequire } from 'node:module'
import { spawn, type ChildProcess } from 'node:child_process'
import { dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const _require = createRequire(import.meta.url)
const {
  Client: ClientClass,
  GatewayIntentBits,
  ChannelType
} = _require('discord.js') as typeof import('discord.js')
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} = _require('@discordjs/voice') as typeof import('@discordjs/voice')

let client: Client | null = null
let connection: VoiceConnection | null = null
let player: AudioPlayer | null = null
let currentResource: AudioResource | null = null
let currentFfmpegProc: ChildProcess | null = null

function sendStatus(status: string): void {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((w) => w.webContents.send('discord:status-change', status))
}

const home = process.env.HOME || process.env.USERPROFILE || ''
const localBin = home ? `${home}/.local/bin` : ''

function findFfmpeg(): string | null {
  const candidates = ['/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']
  if (localBin) candidates.unshift(`${localBin}/ffmpeg`)

  for (const p of candidates) {
    if (existsSync(p)) return p
  }

  try {
    const which = execSync('which ffmpeg', { encoding: 'utf-8' }).trim()
    if (which) return which
  } catch { /* not found */ }

  return null
}

function killCurrentFfmpeg(): void {
  if (currentFfmpegProc && !currentFfmpegProc.killed) {
    currentFfmpegProc.kill('SIGKILL')
    currentFfmpegProc = null
  }
}

function ensurePlayer(): void {
  if (!connection) throw new Error('Not connected to a voice channel')

  if (!player) {
    player = createAudioPlayer()
    connection.subscribe(player)

    player.on('error', (err) => {
      console.error('Audio player error:', err)
      sendStatus('player-error')
    })

    player.on(AudioPlayerStatus.Idle, () => {
      killCurrentFfmpeg()
      currentResource = null
      sendStatus('in-channel')
    })

    player.on(AudioPlayerStatus.Playing, () => {
      sendStatus('playing')
    })
  }
}

function createSeekableResource(
  filePath: string,
  seekSeconds: number,
  volume: number
): AudioResource {
  killCurrentFfmpeg()

  const ffmpegPath = findFfmpeg() || 'ffmpeg'
  const args = [
    '-hide_banner',
    '-loglevel', 'error',
    ...(seekSeconds > 0 ? ['-ss', String(seekSeconds)] : []),
    '-i', filePath,
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1'
  ]

  const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'ignore'] })
  currentFfmpegProc = proc

  proc.on('error', (err) => {
    console.error('FFmpeg spawn error:', err)
  })

  const resource = createAudioResource(proc.stdout!, {
    inputType: StreamType.Raw,
    inlineVolume: true
  })

  resource.volume?.setVolume(volume)
  return resource
}

// --- Public API ---

export async function connectBot(token: string): Promise<{ username: string }> {
  if (client) {
    await disconnectBot()
  }

  client = new ClientClass({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Bot login timed out after 15 seconds'))
      client?.destroy()
      client = null
    }, 15000)

    client!.once('clientReady', () => {
      clearTimeout(timeout)
      const username = client!.user?.tag || 'Unknown Bot'
      sendStatus('connected')
      resolve({ username })
    })

    client!.on('error', (err) => {
      sendStatus('error')
      console.error('Discord client error:', err)
    })

    client!.login(token).catch((err) => {
      clearTimeout(timeout)
      client = null
      reject(new Error(`Login failed: ${err.message}`))
    })
  })
}

export async function disconnectBot(): Promise<void> {
  streamStop()
  if (connection) {
    connection.destroy()
    connection = null
  }
  if (player) {
    player.stop(true)
    player = null
  }
  if (client) {
    await client.destroy()
    client = null
  }
  sendStatus('disconnected')
}

export function getGuilds(): Array<{ id: string; name: string; icon: string | null }> {
  if (!client) return []

  return client.guilds.cache.map((guild: Guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ size: 64 })
  }))
}

export function getVoiceChannels(
  guildId: string
): Array<{ id: string; name: string; memberCount: number }> {
  if (!client) return []

  const guild = client.guilds.cache.get(guildId)
  if (!guild) return []

  return guild.channels.cache
    .filter((ch): ch is VoiceBasedChannel => ch.type === ChannelType.GuildVoice)
    .map((ch) => ({
      id: ch.id,
      name: ch.name,
      memberCount: ch.members.size
    }))
}

export async function joinChannel(guildId: string, channelId: string): Promise<void> {
  if (!client) throw new Error('Bot not connected')

  const guild = client.guilds.cache.get(guildId)
  if (!guild) throw new Error('Guild not found')

  const channel = guild.channels.cache.get(channelId)
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    throw new Error('Voice channel not found')
  }

  if (connection) {
    connection.destroy()
  }

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  })

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000)
    sendStatus('in-channel')
  } catch {
    connection.destroy()
    connection = null
    throw new Error('Failed to join voice channel within 30 seconds')
  }
}

export function leaveChannel(): void {
  streamStop()
  if (connection) {
    connection.destroy()
    connection = null
  }
  if (player) {
    player.stop(true)
    player = null
  }
  sendStatus('connected')
}

// --- Synchronized streaming API ---

export function streamPlay(filePath: string, seekSeconds: number, volume: number): void {
  if (!connection) return
  ensurePlayer()
  currentResource = createSeekableResource(filePath, seekSeconds, volume)
  player!.play(currentResource)
}

export function streamSeek(filePath: string, seekSeconds: number): void {
  if (!connection || !player) return
  const vol = currentResource?.volume?.volume ?? 1
  currentResource = createSeekableResource(filePath, seekSeconds, vol)
  player.play(currentResource)
}

export function streamSetVolume(volume: number): void {
  if (currentResource?.volume) {
    currentResource.volume.setVolume(volume)
  }
}

export function streamPause(): void {
  player?.pause()
}

export function streamResume(): void {
  player?.unpause()
}

export function streamStop(): void {
  killCurrentFfmpeg()
  currentResource = null
  if (player) {
    player.stop(true)
  }
}

export function isConnected(): boolean {
  return client !== null && client.isReady()
}

export function isInChannel(): boolean {
  return connection !== null
}
