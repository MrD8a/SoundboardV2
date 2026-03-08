import { spawn, execSync } from 'child_process'
import { app } from 'electron'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { importAudioFile } from './audio-manager'

const home = process.env.HOME || process.env.USERPROFILE || ''
const localBin = join(home, '.local', 'bin')

function getSpawnEnv(): NodeJS.ProcessEnv {
  const pathParts = (process.env.PATH || '').split(':')
  if (!pathParts.includes(localBin)) {
    pathParts.unshift(localBin)
  }
  return { ...process.env, PATH: pathParts.join(':') }
}

function getDownloadDir(): string {
  const dir = join(app.getPath('userData'), 'data', 'downloads')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function findExecutable(name: string, extraPaths: string[] = []): string | null {
  const candidates = [
    name,
    join(localBin, name),
    ...extraPaths
  ]
  for (const candidate of candidates) {
    try {
      const result = execSync(`"${candidate}" --version`, {
        timeout: 5000,
        stdio: 'pipe',
        env: getSpawnEnv()
      })
      if (result) return candidate
    } catch {
      // Try next candidate
    }
  }
  return null
}

function findYtDlp(): string {
  const extra = ['/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp']
  if (process.platform === 'win32') extra.push('yt-dlp.exe')

  const found = findExecutable('yt-dlp', extra)
  if (found) return found

  throw new Error(
    'yt-dlp not found. Please install yt-dlp: https://github.com/yt-dlp/yt-dlp#installation'
  )
}

function findFfmpegDir(): string | null {
  const found = findExecutable('ffmpeg', ['/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'])
  return found ? dirname(found) : null
}

export interface DownloadProgress {
  percent: number
  speed: string
  eta: string
  status: 'downloading' | 'converting' | 'done' | 'error'
}

export interface VideoInfo {
  title: string
  duration: number
  uploader: string
  thumbnail: string
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const ytdlp = findYtDlp()

  return new Promise((resolve, reject) => {
    const args = ['--dump-json', '--no-playlist', url]
    const ffmpegDir = findFfmpegDir()
    if (ffmpegDir) args.unshift('--ffmpeg-location', ffmpegDir)

    const proc = spawn(ytdlp, args, { env: getSpawnEnv() })
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp info failed: ${stderr}`))
        return
      }

      try {
        const info = JSON.parse(stdout)
        resolve({
          title: info.title || 'Unknown',
          duration: info.duration || 0,
          uploader: info.uploader || info.channel || '',
          thumbnail: info.thumbnail || ''
        })
      } catch {
        reject(new Error('Failed to parse yt-dlp output'))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to start yt-dlp: ${err.message}`))
    })
  })
}

export async function downloadAudio(
  url: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<{ trackId: string }> {
  const ytdlp = findYtDlp()
  const downloadDir = getDownloadDir()
  const outputId = uuidv4()
  const outputTemplate = join(downloadDir, `${outputId}.%(ext)s`)

  let videoInfo: VideoInfo | null = null
  try {
    videoInfo = await getVideoInfo(url)
  } catch {
    // Continue without metadata — fallback to filename
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-x',
      '--audio-format', 'opus',
      '--audio-quality', '0',
      '--no-playlist',
      '--newline',
      '-o', outputTemplate
    ]

    const ffmpegDir = findFfmpegDir()
    if (ffmpegDir) args.push('--ffmpeg-location', ffmpegDir)

    args.push(url)

    const proc = spawn(ytdlp, args, { env: getSpawnEnv() })
    let stderr = ''
    let finalFilePath = ''

    proc.stdout.on('data', (data) => {
      const line = data.toString().trim()

      const progressMatch = line.match(
        /\[download\]\s+(\d+\.?\d*)%\s+of\s+.*?\s+at\s+([\w./]+)\s+ETA\s+(\S+)/
      )
      if (progressMatch && onProgress) {
        onProgress({
          percent: parseFloat(progressMatch[1]),
          speed: progressMatch[2],
          eta: progressMatch[3],
          status: 'downloading'
        })
      }

      if (line.includes('[ExtractAudio]') || line.includes('Post-process')) {
        onProgress?.({ percent: 100, speed: '', eta: '', status: 'converting' })
      }

      const destMatch = line.match(/\[ExtractAudio\] Destination: (.+)/)
      if (destMatch) {
        finalFilePath = destMatch[1]
      }

      const alreadyMatch = line.match(/\[download\] (.+) has already been downloaded/)
      if (alreadyMatch) {
        finalFilePath = alreadyMatch[1]
      }
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', async (code) => {
      if (code !== 0) {
        onProgress?.({ percent: 0, speed: '', eta: '', status: 'error' })
        reject(new Error(`yt-dlp download failed: ${stderr}`))
        return
      }

      if (!finalFilePath) {
        const opusPath = join(downloadDir, `${outputId}.opus`)
        const mp3Path = join(downloadDir, `${outputId}.mp3`)
        if (existsSync(opusPath)) finalFilePath = opusPath
        else if (existsSync(mp3Path)) finalFilePath = mp3Path
      }

      if (!finalFilePath || !existsSync(finalFilePath)) {
        reject(new Error('Download completed but output file not found'))
        return
      }

      try {
        const track = await importAudioFile(finalFilePath, 'youtube', url, {
          title: videoInfo?.title,
          artist: videoInfo?.uploader,
          duration: videoInfo?.duration
        })
        onProgress?.({ percent: 100, speed: '', eta: '', status: 'done' })
        resolve({ trackId: track.id })
      } catch (err) {
        reject(err)
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to start yt-dlp: ${err.message}`))
    })
  })
}
