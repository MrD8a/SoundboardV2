import type { SoundboardAPI } from '../../preload/index'

declare global {
  interface Window {
    api: SoundboardAPI
  }
}
