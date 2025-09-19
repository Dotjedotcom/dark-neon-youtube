let youtubeReadyPromise: Promise<void> | null = null

export function ensureYouTubeIframeAPIReady(): Promise<void> {
  if (youtubeReadyPromise) return youtubeReadyPromise
  youtubeReadyPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }
    const w = window as any

    const resolveOnce = () => {
      if (youtubeReadyPromise) {
        resolve()
      }
    }

    if (w.YT && w.YT.Player) {
      resolveOnce()
      return
    }

    const existing = document.getElementById('yt-iframe-api') as HTMLScriptElement | null
    if (!existing) {
      const tag = document.createElement('script')
      tag.id = 'yt-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }

    const previous = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolveOnce()
    }

    const checkInterval = setInterval(() => {
      if (w.YT && w.YT.Player) {
        clearInterval(checkInterval)
        resolveOnce()
      }
    }, 50)
  })

  return youtubeReadyPromise
}
