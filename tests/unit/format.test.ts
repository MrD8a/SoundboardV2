import { describe, it, expect } from 'vitest'
import { formatDuration, formatFileSize } from '../../src/renderer/lib/format'

describe('formatDuration', () => {
  it('should format 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('should format seconds less than a minute', () => {
    expect(formatDuration(45)).toBe('0:45')
  })

  it('should format exact minutes', () => {
    expect(formatDuration(120)).toBe('2:00')
  })

  it('should format minutes and seconds', () => {
    expect(formatDuration(185)).toBe('3:05')
  })

  it('should pad seconds with leading zero', () => {
    expect(formatDuration(63)).toBe('1:03')
  })

  it('should handle long durations', () => {
    expect(formatDuration(3661)).toBe('61:01')
  })

  it('should handle negative values', () => {
    expect(formatDuration(-5)).toBe('0:00')
  })

  it('should handle NaN/undefined', () => {
    expect(formatDuration(NaN)).toBe('0:00')
    expect(formatDuration(undefined as unknown as number)).toBe('0:00')
  })

  it('should floor fractional seconds', () => {
    expect(formatDuration(65.7)).toBe('1:05')
  })
})

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('should format bytes', () => {
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('should format megabytes', () => {
    expect(formatFileSize(5242880)).toBe('5.0 MB')
  })

  it('should format with decimal precision', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })
})
