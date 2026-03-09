import React from 'react'

export const PLAYLIST_ICON_OPTIONS = [
  { key: 'music', label: 'Music' },
  { key: 'fire', label: 'Fire' },
  { key: 'moon', label: 'Moon' },
  { key: 'skull', label: 'Skull' },
  { key: 'forest', label: 'Forest' },
  { key: 'castle', label: 'Castle' },
  { key: 'storm', label: 'Storm' },
  { key: 'sword', label: 'Sword' }
] as const

export type PlaylistIconKey = (typeof PLAYLIST_ICON_OPTIONS)[number]['key']

interface PlaylistIconGlyphProps {
  icon: string
  className?: string
}

export const PlaylistIconGlyph: React.FC<PlaylistIconGlyphProps> = ({
  icon,
  className = 'w-6 h-6'
}) => {
  switch (icon) {
    case 'fire':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c1.4 2.5 3.5 4.3 3.5 7.2A3.5 3.5 0 0112 13.7a3.5 3.5 0 01-3.5-3.5C8.5 7.6 10.2 5.8 12 3zm0 8.7c2 1.2 4.5 3.1 4.5 5.7A4.5 4.5 0 0112 22a4.5 4.5 0 01-4.5-4.6c0-2.2 1.6-4.3 4.5-5.7z" />
        </svg>
      )
    case 'moon':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12.8A8.8 8.8 0 1111.2 3 7 7 0 0021 12.8z" />
        </svg>
      )
    case 'skull':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 15v2m6-2v2M8 9.5h.01M16 9.5h.01M12 3a8 8 0 00-5 14.3V21h10v-3.7A8 8 0 0012 3z" />
        </svg>
      )
    case 'forest':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4l4 6h-3l3 5h-3l2 4H9l2-4H8l3-5H8l4-6zm0 15v2" />
        </svg>
      )
    case 'castle':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 21V7l4 2V5l4 2 4-2v4l4-2v14M9 21v-4h6v4" />
        </svg>
      )
    case 'storm':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 18a4 4 0 01-.6-8A5.5 5.5 0 0117 8.8 3.8 3.8 0 0117 18h-3l1 3-4-5h2l-1-3" />
        </svg>
      )
    case 'sword':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 5l5-1-1 5-8.5 8.5-4 1 1-4L14 5zm-6.5 9.5L4 18m6-10l4 4" />
        </svg>
      )
    case 'music':
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l11-2v11M9 19a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm11-4a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
  }
}
