import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useLibraryStore } from '../../stores/library-store'
import { formatDuration } from '../../lib/format'

interface VideoInfo {
  title: string
  duration: number
  uploader: string
  thumbnail: string
}

interface DownloadProgress {
  percent: number
  speed: string
  eta: string
  status: 'downloading' | 'converting' | 'done' | 'error'
}

export const DownloadView: React.FC = () => {
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const loadTracks = useLibraryStore((s) => s.loadTracks)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  const handleFetchInfo = useCallback(async () => {
    if (!url.trim()) return

    setError(null)
    setVideoInfo(null)
    setIsFetchingInfo(true)

    try {
      const info = await window.api.download.getInfo(url.trim())
      setVideoInfo(info as VideoInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video info')
    } finally {
      setIsFetchingInfo(false)
    }
  }, [url])

  const handleDownload = useCallback(async () => {
    if (!url.trim()) return

    setError(null)
    setProgress({ percent: 0, speed: '', eta: '', status: 'downloading' })
    setIsDownloading(true)

    cleanupRef.current = window.api.download.onProgress((p) => {
      setProgress(p as DownloadProgress)
    })

    try {
      await window.api.download.fromUrl(url.trim())
      setProgress({ percent: 100, speed: '', eta: '', status: 'done' })
      await loadTracks()
      setUrl('')
      setVideoInfo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
      setProgress(null)
    } finally {
      setIsDownloading(false)
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [url, loadTracks])

  return (
    <div className="max-w-2xl space-y-6">
      {/* URL input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-obsidian-200">
          YouTube URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFetchInfo()
            }}
            disabled={isDownloading}
            className="input-field flex-1"
          />
          <button
            onClick={handleFetchInfo}
            disabled={!url.trim() || isFetchingInfo || isDownloading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isFetchingInfo ? 'Fetching...' : 'Get Info'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!url.trim() || isDownloading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-dragon-600/20 border border-dragon-600/40 rounded-lg text-sm text-dragon-400">
          {error}
        </div>
      )}

      {/* Video info */}
      {videoInfo && (
        <div className="bg-obsidian-800 rounded-xl p-4 flex gap-4">
          {videoInfo.thumbnail && (
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-obsidian-100 truncate">{videoInfo.title}</p>
            <p className="text-xs text-obsidian-400 mt-1">{videoInfo.uploader}</p>
            <p className="text-xs text-obsidian-400 mt-0.5">
              Duration: {formatDuration(videoInfo.duration)}
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="bg-obsidian-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-obsidian-200 capitalize">{progress.status}</span>
            <span className="text-obsidian-400 tabular-nums">
              {progress.percent.toFixed(1)}%
              {progress.speed && ` - ${progress.speed}`}
              {progress.eta && ` - ETA: ${progress.eta}`}
            </span>
          </div>
          <div className="w-full h-2 bg-obsidian-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.status === 'done'
                  ? 'bg-green-500'
                  : progress.status === 'error'
                    ? 'bg-dragon-500'
                    : 'bg-arcane-500'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {progress.status === 'done' && (
            <p className="text-sm text-green-400">
              Download complete! Track added to your library.
            </p>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="p-4 bg-obsidian-800/50 rounded-xl text-xs text-obsidian-400 space-y-1">
        <p className="font-medium text-obsidian-300">Supported URLs:</p>
        <p>- YouTube video URLs (youtube.com/watch?v=... or youtu.be/...)</p>
        <p>- Most sites supported by yt-dlp</p>
        <p className="mt-2 text-obsidian-500">
          Requires yt-dlp installed on your system. Install from:{' '}
          <span className="text-arcane-400">github.com/yt-dlp/yt-dlp</span>
        </p>
      </div>
    </div>
  )
}
