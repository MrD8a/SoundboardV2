# SoundboardV2

A cross-platform desktop soundboard and mixing app for DnD sessions. Play atmosphere music locally and stream it through Discord voice channels.

## Features

- **Audio Player** -- Full-featured player with play/pause, next/prev, seek, volume, repeat modes, shuffle, and queue management
- **Track Library** -- Import audio files (MP3, WAV, OGG, FLAC, M4A, Opus) via drag-and-drop or file picker, with automatic metadata extraction
- **YouTube Download** -- Download audio from YouTube (and other sites) using yt-dlp, with progress tracking
- **Playlist Management** -- Create, edit, reorder, and delete playlists with drag-and-drop track ordering
- **Discord Integration** -- Connect a Discord bot, join voice channels, and stream audio directly to your DnD session
- **Keyboard Shortcuts** -- Space to play/pause, media keys for transport controls

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (for YouTube downloads)
- A [Discord bot token](https://discord.com/developers/applications) (for Discord streaming)

## Setup

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Run tests
npm test
```

## Building

```bash
# Build for current platform
npm run dist

# Build for Linux specifically
npm run dist:linux

# Build for Windows specifically
npm run dist:win
```

Output goes to the `release/` directory.

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new Application, then go to the Bot tab
3. Enable **Message Content** and **Server Members** privileged intents
4. Generate an invite link with **Connect** and **Speak** permissions
5. Invite the bot to your server
6. Copy the bot token and paste it in the app's Discord panel

## Tech Stack

- **Electron** + **Vite** + **React** + **TypeScript**
- **Tailwind CSS** -- Dark DnD-themed UI
- **Howler.js** -- Local audio playback
- **discord.js** + **@discordjs/voice** -- Discord bot and voice streaming
- **better-sqlite3** -- Local database for tracks, playlists, and settings
- **yt-dlp** -- YouTube audio downloading
- **Zustand** -- State management
- **Vitest** -- Unit testing

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── index.ts       # App entry, window creation, shortcuts
│   └── services/      # Database, audio manager, downloader, Discord bot
├── preload/           # Context bridge (IPC API)
│   └── index.ts
└── renderer/          # React UI
    ├── components/    # Player, Library, Playlist, Download, Discord, Toast
    ├── stores/        # Zustand stores (player, library, playlist, discord)
    ├── lib/           # Utility functions
    ├── types/         # TypeScript type definitions
    └── styles/        # Tailwind CSS
```

## License

MIT
