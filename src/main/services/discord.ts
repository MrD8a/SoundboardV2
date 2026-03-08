import {
  Client,
  GatewayIntentBits,
  ChannelType,
  type Guild,
  type VoiceBasedChannel
} from 'discord.js'
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  type VoiceConnection,
  type AudioPlayer
} from '@discordjs/voice'
import { BrowserWindow } from 'electron'

let client: Client | null = null
let connection: VoiceConnection | null = null
let player: AudioPlayer | null = null

function sendStatus(status: string): void {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((w) => w.webContents.send('discord:status-change', status))
}

export async function connectBot(token: string): Promise<{ username: string }> {
  if (client) {
    await disconnectBot()
  }

  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Bot login timed out after 15 seconds'))
      client?.destroy()
      client = null
    }, 15000)

    client!.once('ready', () => {
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

export async function joinChannel(
  guildId: string,
  channelId: string
): Promise<void> {
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
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000)
    sendStatus('in-channel')
  } catch {
    connection.destroy()
    connection = null
    throw new Error('Failed to join voice channel within 10 seconds')
  }
}

export function leaveChannel(): void {
  if (player) {
    player.stop(true)
    player = null
  }
  if (connection) {
    connection.destroy()
    connection = null
  }
  sendStatus('connected')
}

export function playTrackInChannel(filePath: string): void {
  if (!connection) throw new Error('Not connected to a voice channel')

  if (!player) {
    player = createAudioPlayer()
    connection.subscribe(player)

    player.on('error', (err) => {
      console.error('Audio player error:', err)
      sendStatus('player-error')
    })

    player.on(AudioPlayerStatus.Idle, () => {
      sendStatus('in-channel')
    })

    player.on(AudioPlayerStatus.Playing, () => {
      sendStatus('playing')
    })
  }

  const resource = createAudioResource(filePath)
  player.play(resource)
}

export function stopTrackInChannel(): void {
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
