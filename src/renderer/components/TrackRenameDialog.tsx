import React, { useEffect, useState } from 'react'
import type { Track } from '../types'

interface TrackRenameDialogProps {
  track: Track
  onSave: (title: string) => Promise<void> | void
  onClose: () => void
}

export const TrackRenameDialog: React.FC<TrackRenameDialogProps> = ({
  track,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState(track.title)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(track.title)
    setError(null)
    setIsSaving(false)
  }, [track])

  const handleSubmit = async (): Promise<void> => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle || trimmedTitle === track.title) {
      onClose()
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await onSave(trimmedTitle)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename track')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-obsidian-700 bg-obsidian-900 p-4 shadow-2xl">
        <h3 className="text-sm font-medium text-obsidian-100">Rename track</h3>
        <p className="mt-1 text-xs text-obsidian-400">Choose a new title for this track.</p>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void handleSubmit()
            }
            if (e.key === 'Escape') {
              onClose()
            }
          }}
          className="input-field mt-4 w-full"
          autoFocus
        />

        {error && <p className="mt-2 text-xs text-dragon-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>
            Cancel
          </button>
          <button onClick={() => void handleSubmit()} className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
