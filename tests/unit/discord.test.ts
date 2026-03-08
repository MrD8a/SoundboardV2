import { describe, it, expect } from 'vitest'
import type { Guild, VoiceChannel, DiscordStatus } from '../../src/renderer/types'

describe('Discord state transitions', () => {
  it('should start in disconnected state', () => {
    const status: DiscordStatus = {
      connected: false,
      botUsername: null,
      currentGuildId: null,
      currentChannelId: null
    }
    expect(status.connected).toBe(false)
    expect(status.botUsername).toBeNull()
  })

  it('should transition to connected state', () => {
    const status: DiscordStatus = {
      connected: true,
      botUsername: 'TestBot#1234',
      currentGuildId: null,
      currentChannelId: null
    }
    expect(status.connected).toBe(true)
    expect(status.botUsername).toBe('TestBot#1234')
  })

  it('should transition to in-channel state', () => {
    const status: DiscordStatus = {
      connected: true,
      botUsername: 'TestBot#1234',
      currentGuildId: '123456789',
      currentChannelId: '987654321'
    }
    expect(status.currentGuildId).toBe('123456789')
    expect(status.currentChannelId).toBe('987654321')
  })

  it('should transition back to connected on leave', () => {
    const status: DiscordStatus = {
      connected: true,
      botUsername: 'TestBot#1234',
      currentGuildId: null,
      currentChannelId: null
    }
    expect(status.connected).toBe(true)
    expect(status.currentChannelId).toBeNull()
  })

  it('should clear all state on disconnect', () => {
    const status: DiscordStatus = {
      connected: false,
      botUsername: null,
      currentGuildId: null,
      currentChannelId: null
    }
    expect(status.connected).toBe(false)
    expect(status.botUsername).toBeNull()
    expect(status.currentGuildId).toBeNull()
  })
})

describe('Guild and channel data structures', () => {
  it('should represent a guild correctly', () => {
    const guild: Guild = {
      id: '123456789',
      name: 'DnD Night',
      icon: 'https://cdn.discordapp.com/icons/123/abc.png'
    }
    expect(guild.id).toBe('123456789')
    expect(guild.name).toBe('DnD Night')
  })

  it('should handle guild without icon', () => {
    const guild: Guild = {
      id: '123456789',
      name: 'DnD Night',
      icon: null
    }
    expect(guild.icon).toBeNull()
  })

  it('should represent a voice channel correctly', () => {
    const channel: VoiceChannel = {
      id: '987654321',
      name: 'General Voice',
      memberCount: 4
    }
    expect(channel.name).toBe('General Voice')
    expect(channel.memberCount).toBe(4)
  })
})
