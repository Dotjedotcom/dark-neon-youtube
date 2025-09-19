<template>
<main
  class="app-shell min-h-screen grid place-items-center p-6"
  :style="appStyleVars"
  @pointerdown="onStartScreenPointerDown"
>
    <div class="text-center space-y-8">
      <h1 class="text-4xl md:text-6xl font-black tracking-tight">
        <span class="text-white">Dark</span>
        <span class="mx-2 text-neon-600">Neon</span>
        <span class="text-white">Summoner</span>
      </h1>
      <p class="max-w-xl mx-auto text-neutral-400">
        Press the button... or not.... 
      </p>

      <NeonSkullButton
        :label="summonLabel"
        :highlight="buttonStage === 'confirm'"
        @press="handleSummonPress"
      />
    </div>
    <div class="absolute right-4 bottom-4 opacity-20 text-xs">Escape or the ✕ closes it.</div>

    <transition name="fade" mode="out-in">
      <FullscreenYouTube
        v-if="show"
        :video-id="currentVideoId"
        :start-seconds="currentStartSeconds"
        :auto-fullscreen="playerAutoFullscreen"
        :initial-playlist-id="currentPlaylistId"
        :initial-playlist-label="currentPlaylistLabel"
        :force-video-id="shouldForceVideoId"
        @close="handleClose"
      />
    </transition>

    <div v-if="flashVisible" class="flash-overlay"></div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import FullscreenYouTube from './components/FullscreenYouTube.vue'
import NeonSkullButton from './components/NeonSkullButton.vue'
import { ensureYouTubeIframeAPIReady } from './utils/youtube'
import hoverSoundUrl from './assets/whoosh.wav'
import backgroundImageUrl from './assets/bg.jpg'
import { defaultTracks, defaultPlaylists } from './data/media'

type MediaSelection = { type: 'video' | 'playlist'; id: string; label?: string; startSeconds?: number }
const DEFAULT_VIDEO_ID = 'B7mhQipwdb0'
const DEFAULT_START_SECONDS = 280
const show = ref(false)
const buttonStage = ref<'idle' | 'confirm'>('idle')
const playerAutoFullscreen = ref(true)
const summonAudio = ref<HTMLAudioElement | null>(null)
const flashVisible = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null
let flashHideTimer: ReturnType<typeof setTimeout> | null = null
const TRIPLE_CLICK_WINDOW_MS = 450
let recentPointerTimestamps: number[] = []
const initialMedia = ref<MediaSelection | null>(null)

const summonLabel = computed(() => (buttonStage.value === 'confirm' ? 'Really?' : 'Summon the Video'))
const appStyleVars = computed(() => ({ '--app-background-image': `url(${backgroundImageUrl})` }))
const currentVideoId = computed(() => (initialMedia.value?.type === 'video' ? initialMedia.value.id : DEFAULT_VIDEO_ID))
const currentStartSeconds = computed(() => {
  if (!initialMedia.value) return DEFAULT_START_SECONDS
  if (initialMedia.value.type === 'playlist') {
    return initialMedia.value.startSeconds ?? 0
  }
  return initialMedia.value.startSeconds ?? 0
})
const currentPlaylistId = computed(() => (initialMedia.value?.type === 'playlist' ? initialMedia.value.id : null))
const currentPlaylistLabel = computed(() => (initialMedia.value?.type === 'playlist' ? initialMedia.value.label ?? null : null))
const shouldForceVideoId = computed(() => initialMedia.value?.type === 'video' || false)

onMounted(() => {
  ensureYouTubeIframeAPIReady()
  scheduleFlash()
})

onBeforeUnmount(() => {
  clearFlashTimers()
})

function handleSummonPress() {
  if (buttonStage.value === 'idle') {
    buttonStage.value = 'confirm'
    playSummonSound()
    return
  }

  openPlayer(true, null)
  buttonStage.value = 'idle'
}

function playSummonSound() {
  if (!summonAudio.value) {
    summonAudio.value = new Audio(hoverSoundUrl)
    summonAudio.value.volume = 0.7
  }
  const audio = summonAudio.value
  if (!audio) return
  audio.currentTime = 0
  audio.play().catch(() => {})
}

function handleClose() {
  show.value = false
  buttonStage.value = 'idle'
  playerAutoFullscreen.value = true
  initialMedia.value = null
}

function scheduleFlash() {
  clearFlashTimers()
  const delay = 5000 + Math.random() * 8000
  flashTimer = setTimeout(() => {
    flashVisible.value = true
    flashHideTimer = setTimeout(() => {
      flashVisible.value = false
      scheduleFlash()
    }, 400)
  }, delay)
}

function clearFlashTimers() {
  if (flashTimer) {
    clearTimeout(flashTimer)
    flashTimer = null
  }
  if (flashHideTimer) {
    clearTimeout(flashHideTimer)
    flashHideTimer = null
  }
}

function onStartScreenPointerDown(event: PointerEvent) {
  if (show.value) {
    recentPointerTimestamps = []
    return
  }
  const path = event.composedPath()
  if (path.some(node => (node as HTMLElement | undefined)?.dataset?.summonButton === 'true')) {
    recentPointerTimestamps = []
    return
  }

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  recentPointerTimestamps = recentPointerTimestamps.filter(ts => now - ts <= TRIPLE_CLICK_WINDOW_MS)
  recentPointerTimestamps.push(now)

  if (recentPointerTimestamps.length >= 3) {
    recentPointerTimestamps = []
    const media = pickRandomMedia()
    openPlayer(false, media)
  }
}

function openPlayer(autoFullscreen: boolean, media: MediaSelection | null) {
  playerAutoFullscreen.value = autoFullscreen
  initialMedia.value = media
  show.value = true
  recentPointerTimestamps = []
}

function pickRandomMedia(): MediaSelection {
  const options: MediaSelection[] = [
    ...defaultTracks.map(track => ({
      type: 'video' as const,
      id: track.id,
      label: track.title,
      startSeconds: track.start,
    })),
    ...defaultPlaylists.map(list => ({
      type: 'playlist' as const,
      id: list.id,
      label: list.title,
      startSeconds: 0,
    })),
  ]
  if (!options.length) {
    return { type: 'video', id: DEFAULT_VIDEO_ID, startSeconds: DEFAULT_START_SECONDS }
  }
  const index = Math.floor(Math.random() * options.length)
  return options[index]
}
</script>

<style scoped>
.app-shell {
  position: relative;
  overflow: hidden;
  background-color: #050807;
  color: #f8f8f8;
}

.app-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: center / cover no-repeat var(--app-background-image, none);
  opacity: .3;
  pointer-events: none;
}

.app-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top, rgba(5, 8, 7, 0.3), rgba(5, 8, 7, 0.85));
  opacity: 0.1;
  pointer-events: none;
}

.flash-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(30deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.75) 45%, rgba(255, 255, 255, 0) 100%);
  mix-blend-mode: screen;
  opacity: 0;
  animation: flashSweep 0.4s ease-in-out forwards;
  background-size: 200% 200%;
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes flashSweep {
  0% {
    opacity: 0;
    background-position: -150% 0;
  }
  40% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    background-position: 150% 0;
  }
}

</style>
