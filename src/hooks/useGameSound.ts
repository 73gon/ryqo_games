import { useCallback, useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'

export function useGameSound(src: string = '') {
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const soundRef = useRef<Howl | null>(null)

  useEffect(() => {
    // In a real app, you would load actual sound files
    // For this demo, we'll just initialize Howler without a valid src if none provided
    // or use the provided src.
    if (src) {
      soundRef.current = new Howl({
        src: [src],
        volume: volume,
        mute: muted,
      })
    }

    return () => {
      soundRef.current?.unload()
    }
  }, [src])

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume)
    }
  }, [volume])

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.mute(muted)
    }
  }, [muted])

  const play = useCallback(() => {
    // If we had a real sound, we'd play it.
    // soundRef.current?.play()
    // For demo purposes, we can just log or do nothing if no asset
    if (soundRef.current) {
      soundRef.current.play()
    }
  }, [])

  return {
    play,
    muted,
    toggleMute: () => setMuted((prev) => !prev),
    volume,
    setVolume,
  }
}
