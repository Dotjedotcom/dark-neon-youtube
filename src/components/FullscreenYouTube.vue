<template>
  <div ref="wrap" class="fixed inset-0 z-50 backdrop-blur-sm" :style="[wrapBackgroundStyle, playerStyle]">
    <button
      class="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10"
      aria-label="Close video"
      @click="close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
        <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
      </svg>
    </button>
    <div class="relative w-full h-full">
      <div
        ref="playerHost"
        class="w-full h-full transition-opacity duration-300 pointer-events-none"
        :style="playerStyle"
      ></div>

      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute bottom-4 left-4 flex flex-col gap-3 pointer-events-auto">
          <button
            class="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10 text-white text-2xl animate-pulse"
            aria-label="Toggle video controls"
            ref="controlsButton"
            @click="controlsOpen = !controlsOpen"
            @pointerenter="onHornsPointerEnter"
            @pointerleave="onHornsPointerLeave"
            @pointerdown="onHornsPointerDown"
            @pointerup="onHornsPointerUp"
            @pointercancel="onHornsPointerUp"
          >
            🤘
          </button>

          <transition name="fade">
            <div
              v-if="controlsOpen"
              class="w-72 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 p-4 text-white space-y-4"
            >
              <div class="space-y-2">
                <label class="text-xs uppercase tracking-wide text-neutral-300" for="media-id">Video / Playlist</label>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <input
                      id="media-id"
                      v-model="mediaInput"
                      type="text"
                      placeholder="YouTube ID or URL"
                      class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neon-500"
                      role="combobox"
                      aria-autocomplete="list"
                      :aria-expanded="showSuggestions"
                      :aria-controls="showSuggestions ? suggestionListId : undefined"
                      :aria-activedescendant="activeSuggestionId"
                      @focus="onMediaFocus"
                      @blur="onMediaBlur"
                      @input="onMediaInput"
                      @keydown.down.prevent="moveSelection(1)"
                      @keydown.up.prevent="moveSelection(-1)"
                      @keydown.enter.prevent="commitSelection()"
                      @keydown.home.prevent="highlightBoundary('first')"
                      @keydown.end.prevent="highlightBoundary('last')"
                      @keydown.esc.prevent="hideSuggestions"
                    />
                    <transition name="fade">
                      <ul
                        v-if="showSuggestions"
                        :id="suggestionListId"
                        class="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-white/10 bg-black/90 text-sm shadow-xl backdrop-blur"
                        role="listbox"
                      >
                        <li
                          v-for="(suggestion, index) in filteredSuggestions"
                          :id="`${suggestionListId}-option-${index}`"
                          :key="suggestion.id + suggestion.type"
                          :class="[
                            'flex cursor-pointer select-none items-center justify-between px-3 py-2 transition hover:bg-white/10',
                            index === highlightedSuggestion ? 'bg-white/15' : '',
                          ]"
                          role="option"
                          :aria-selected="index === highlightedSuggestion"
                          @mousedown.prevent="selectSuggestion(suggestion)"
                          @mouseenter="highlightedSuggestion = index"
                        >
                          <span class="truncate pr-3">{{ suggestion.title }}</span>
                          <span class="text-[11px] uppercase tracking-wide text-neutral-400">
                            {{ suggestion.type === 'playlist' ? 'Playlist' : 'Track' }}
                          </span>
                        </li>
                      </ul>
                    </transition>
                  </div>
                  <button
                    class="px-3 py-2 rounded-lg bg-neon-600 hover:bg-neon-500 text-sm text-black font-medium"
                    @click="commitSelection(true)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                      <path d="M4.5 5.653c0-1.501 1.621-2.43 2.927-1.7l10.387 5.847c1.333.75 1.333 2.65 0 3.4L7.427 19.047C6.121 19.777 4.5 18.848 4.5 17.347V5.653z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div v-if="nowPlayingLabel" class="text-xs text-neutral-300">
                Now Playing · <span class="text-white font-semibold">{{ nowPlayingLabel }}</span>
              </div>
              
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-300">
                  <span>Opacity</span>
                  <span>{{ Math.round(videoOpacity * 100) }}%</span>
                </div>
                <input
                  :value="videoOpacity"
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  class="w-full accent-neon-500"
                  @input="onOpacityInput"
                />
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-300">
                  <span>Volume</span>
                  <span>{{ Math.round(volume) }}%</span>
                </div>
                <input
                  :value="volume"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  class="w-full accent-neon-500"
                  @input="onVolumeInput"
                />
              </div>

              <div class="space-y-1">
                <div class="flex items-center justify-between text-[11px] uppercase tracking-wide text-neutral-400">
                  <span>{{ formattedCurrentTime }}</span>
                  <span>{{ formattedDuration }}</span>
                </div>
                <input
                  :value="currentTime"
                  :max="duration > 0 ? duration : 0"
                  min="0"
                  step="1"
                  type="range"
                  class="w-full accent-neon-500"
                  @input="onProgressInput"
                  @change="onProgressCommit"
                  @blur="onProgressBlur"
                />
              </div>

              <div class="grid grid-cols-5 gap-2">
                <button
                  class="control-button"
                  :disabled="!playerReady"
                  @click="playPrevious"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                    <path d="M5.25 5.25a.75.75 0 011.5 0v13.5a.75.75 0 01-1.5 0V5.25zM19.5 6.749a1.5 1.5 0 010 2.597l-5.875 3.45a1.5 1.5 0 000 2.597l5.875 3.45A1.5 1.5 0 0121 20.047V7.953a1.5 1.5 0 00-1.5-1.204z" />
                  </svg>
                </button>
                <button
                  class="control-button"
                  :disabled="!playerReady"
                  @click="togglePlayPause"
                >
                  <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                    <path d="M5.25 4.5A.75.75 0 016 3.75h3A.75.75 0 019.75 4.5v15a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-15zM14.25 4.5A.75.75 0 0115 3.75h3a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-15z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                    <path d="M4.5 5.653c0-1.501 1.621-2.43 2.927-1.7l10.387 5.847c1.333.75 1.333 2.65 0 3.4L7.427 19.047C6.121 19.777 4.5 18.848 4.5 17.347V5.653z" />
                  </svg>
                </button>
                <button
                  class="control-button"
                  :disabled="!playerReady"
                  @click="playNext"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                    <path d="M18.75 5.25a.75.75 0 00-1.5 0v13.5a.75.75 0 001.5 0V5.25zM4.5 6.749a1.5 1.5 0 010 2.597l5.875 3.45a1.5 1.5 0 000 2.597l-5.875 3.45A1.5 1.5 0 013 20.047V7.953A1.5 1.5 0 014.5 6.75z" />
                  </svg>
                </button>
                <button
                  class="control-button"
                  :disabled="!playerReady"
                  @click="playRandom()"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 6.75h2.25V9" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12h3.818a2.25 2.25 0 001.591-.659l2.823-2.823a2.25 2.25 0 011.591-.659H21.75" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.75 17.25H4.5V15" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 12h-3.818a2.25 2.25 0 00-1.591.659l-2.823 2.823a2.25 2.25 0 01-1.591.659H2.25" />
                  </svg>
                </button>
                <button
                  class="control-button"
                  :disabled="!playerReady"
                  @click="toggleFullscreen"
                >
                  <svg v-if="isFullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 8.25h-3.5a.75.75 0 01-.75-.75v-3.5M15.75 8.25h3.5a.75.75 0 00.75-.75v-3.5M8.25 15.75h-3.5a.75.75 0 00-.75.75v3.5M15.75 15.75h3.5a.75.75 0 01.75.75v3.5" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9V4.5A1.5 1.5 0 017.5 3H12" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9V4.5A1.5 1.5 0 0016.5 3H12" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 15v4.5A1.5 1.5 0 007.5 21H12" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 15v4.5A1.5 1.5 0 0116.5 21H12" />
                  </svg>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, watch, withDefaults } from 'vue'
import hoverSoundUrl from '../assets/whoosh.wav'
import backgroundImageUrl from '../assets/bg.jpg'
import { ensureYouTubeIframeAPIReady } from '../utils/youtube'
import type { Track, Playlist } from '../data/media'
import { defaultTracks, defaultPlaylists } from '../data/media'
type MediaSuggestion = { id: string; title: string; type: 'video' | 'playlist' }
type ParsedMedia =
  | { type: 'video'; id: string; label: string }
  | { type: 'playlist'; id: string; label: string }

const props = withDefaults(defineProps<{
  videoId: string
  startSeconds?: number
  autoFullscreen?: boolean
  initialPlaylistId?: string | null
  initialPlaylistLabel?: string | null
  forceVideoId?: boolean
}>(), {
  autoFullscreen: true,
  initialPlaylistId: null,
  initialPlaylistLabel: null,
  forceVideoId: false,
})
const emit = defineEmits<{ (e: 'close'): void }>()

const wrap = ref<HTMLDivElement | null>(null)
const playerHost = ref<HTMLDivElement | null>(null)
let player: any
const playerReady = ref(false)
const controlsOpen = ref(false)
const videoOpacity = ref(0.75)
const volume = ref(80)
const currentTime = ref(0)
const duration = ref(0)
const mediaInput = ref('')
const controlsButton = ref<HTMLButtonElement | null>(null)
const currentSource = ref<'track' | 'playlist'>('track')
const currentPlaylistLabel = ref<string | null>(null)
const inputFocused = ref(false)
const highlightedSuggestion = ref(0)
let blurTimeout: ReturnType<typeof setTimeout> | null = null
const suggestionListId = `media-suggestions-${Math.random().toString(36).slice(2)}`
const isSeeking = ref(false)
let progressTimer: ReturnType<typeof setInterval> | null = null

const STORAGE_KEYS = {
  tracks: 'dark-neon-user-tracks-v1',
  playlists: 'dark-neon-user-playlists-v1',
} as const

const userTracks = ref<Track[]>([])
const userPlaylists = ref<Playlist[]>([])
const tracks = ref<Track[]>([])
const currentTrackIndex = ref(0)

initializeMediaLibrary()
initializeInitialTrackSelection()

const currentTrack = computed(() => tracks.value[currentTrackIndex.value] ?? null)
const nowPlayingLabel = computed(() => {
  if (currentSource.value === 'playlist') {
    return currentPlaylistLabel.value ? `Playlist ${currentPlaylistLabel.value}` : null
  }
  return currentTrack.value?.title ?? null
})
const wrapBackgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(rgba(5, 8, 7, 0.72), rgba(5, 8, 7, 0.72)), url(${backgroundImageUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}))
const isPlaying = ref(false)
const playerStyle = computed(() => ({
  opacity: `${Math.min(Math.max(videoOpacity.value, 0), 1).toFixed(2)}`
}))
const isFullscreen = ref(false)
let hoverAudio: HTMLAudioElement | null = null
let hoverAudioUnlocked = false
let hoverAudioPendingStart = false
const MAX_GESTURE_CREDITS = 4
let gestureCredits = 0
const gestureQueue: Array<() => void> = []
const gestureQueueSet = new Set<() => void>()
const gesturePlaybackAction = () => {
  try { player?.playVideo?.() } catch {}
}

const allSuggestions = computed<MediaSuggestion[]>(() => {
  const suggestions = new Map<string, MediaSuggestion>()
  const addSuggestion = (suggestion: MediaSuggestion) => {
    if (!suggestion.id) return
    const key = `${suggestion.type}:${suggestion.id}`
    if (suggestions.has(key)) return
    suggestions.set(key, suggestion)
  }

  tracks.value.forEach(track => addSuggestion({ id: track.id, title: track.title, type: 'video' }))
  defaultPlaylists.forEach(list => addSuggestion({ id: list.id, title: list.title, type: 'playlist' }))
  userPlaylists.value.forEach(list => addSuggestion({ id: list.id, title: list.title, type: 'playlist' }))

  return Array.from(suggestions.values())
})

const filteredSuggestions = computed<MediaSuggestion[]>(() => {
  const query = mediaInput.value.trim()
  if (!query) return []
  const lowerQuery = query.toLowerCase()
  const scored = allSuggestions.value
    .map(suggestion => {
      const text = `${suggestion.title} ${suggestion.id}`.toLowerCase()
      const score = fuzzyScore(text, lowerQuery)
      return { suggestion, score }
    })
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => (a.score as number) - (b.score as number) || a.suggestion.title.localeCompare(b.suggestion.title))
    .slice(0, 8)
    .map(item => item.suggestion)

  return scored
})

const showSuggestions = computed(() => inputFocused.value && filteredSuggestions.value.length > 0)
const activeSuggestionId = computed(() => {
  if (!showSuggestions.value || !filteredSuggestions.value.length) return undefined
  return `${suggestionListId}-option-${highlightedSuggestion.value}`
})
const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

function initializeInitialTrackSelection() {
  if (props.initialPlaylistId) {
    currentSource.value = 'playlist'
    currentPlaylistLabel.value = props.initialPlaylistLabel ?? shortLabel(props.initialPlaylistId)
    return
  }

  if (props.forceVideoId) {
    setCurrentTrackById(props.videoId)
    currentSource.value = 'track'
    currentPlaylistLabel.value = null
    return
  }

  const subdomainTrack = pickTrackForSubdomain()
  if (subdomainTrack) {
    setCurrentTrackById(subdomainTrack.id)
    return
  }

  if (Math.random() < 0.9) {
    setCurrentTrackById(props.videoId)
    return
  }

  const alternatives = defaultTracks.filter(track => track.id !== props.videoId)
  if (!alternatives.length) {
    setCurrentTrackById(props.videoId)
    return
  }

  const randomPick = alternatives[Math.floor(Math.random() * alternatives.length)]
  setCurrentTrackById(randomPick.id)
}

function setCurrentTrackById(id: string) {
  const existingIndex = tracks.value.findIndex(track => track.id === id)
  if (existingIndex !== -1) {
    currentTrackIndex.value = existingIndex
    currentTime.value = tracks.value[existingIndex]?.start ?? 0
    currentSource.value = 'track'
    currentPlaylistLabel.value = null
    return
  }

  tracks.value.unshift({ id, title: readableLabel(id) })
  currentTrackIndex.value = 0
  currentTime.value = 0
  currentSource.value = 'track'
  currentPlaylistLabel.value = null
}

function pickTrackForSubdomain(): Track | null {
  if (typeof window === 'undefined') {
    return null
  }

  const host = window.location.hostname
  if (!host) return null

  const segments = host.toLowerCase().split('.')
  if (segments.length === 0) return null

  let candidate = ''
  const last = segments[segments.length - 1]

  if (last === 'localhost') {
    if (segments.length >= 2) {
      candidate = segments[0]
    }
  } else if (segments.length >= 3) {
    candidate = segments[0]
  } else if (segments.length === 2 && segments[0] !== 'www') {
    candidate = segments[0]
  }

  candidate = candidate.replace(/[^a-z0-9-_.]/g, '').trim()
  if (!candidate) return null

  const normalizedCandidate = normalizeForMatch(candidate)
  if (!normalizedCandidate) return null

  const matches = defaultTracks.filter(track => normalizeForMatch(track.title).includes(normalizedCandidate))
  if (!matches.length) return null

  return matches[Math.floor(Math.random() * matches.length)]
}

function normalizeForMatch(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function close() {
  try { player?.stopVideo?.() } catch {}
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  emit('close')
}

function requestFs(el: HTMLElement) {
  const anyEl = el as any
  const req = anyEl.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.msRequestFullscreen
  if (req) req.call(anyEl)
}

onMounted(async () => {
  prepareHoverAudio()
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  if (!playerHost.value || !wrap.value) return
  if (props.autoFullscreen) {
    requestFs(wrap.value)
  }
  await ensureYouTubeIframeAPIReady()
  const w = window as any
  player = new w.YT.Player(playerHost.value, {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      start: props.startSeconds ?? 0
    },
    videoId: currentTrack.value?.id ?? props.videoId,
    events: {
      onReady: () => {
        playerReady.value = true
        if (typeof player.setVolume === 'function') {
          player.setVolume(volume.value)
        }
        if (props.initialPlaylistId) {
          const startSeconds = props.startSeconds ?? 0
          currentSource.value = 'playlist'
          currentPlaylistLabel.value = props.initialPlaylistLabel ?? shortLabel(props.initialPlaylistId)
          currentTrackIndex.value = 0
          currentTime.value = startSeconds
          player.loadPlaylist?.({ listType: 'playlist', list: props.initialPlaylistId, index: 0, startSeconds })
          duration.value = player.getDuration?.() ?? duration.value
          ensureProgressTimer()
          ensurePlayback()
          isPlaying.value = true
          return
        }

        const desiredStart = props.startSeconds ?? currentTrack.value?.start ?? 0
        if (typeof player.seekTo === 'function') {
          player.seekTo(desiredStart, true)
        }
        currentTime.value = desiredStart
        duration.value = player.getDuration?.() ?? duration.value
        ensureProgressTimer()
        ensurePlayback()
        isPlaying.value = true
      },
      onStateChange: (e: any) => {
        if (e.data === w.YT.PlayerState.ENDED) handleTrackEnded()
        if (e.data === w.YT.PlayerState.PLAYING) {
          isPlaying.value = true
          ensureProgressTimer()
        }
        if (e.data === w.YT.PlayerState.PAUSED) isPlaying.value = false
      }
    }
  })

  document.addEventListener('keydown', onEsc)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  onFullscreenChange()
})

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onEsc)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  stopHoverSound()
  clearProgressTimer()
  try { player?.destroy?.() } catch {}
})

function playTrackByIndex(index: number) {
  if (!playerReady.value) return
  const next = tracks.value[index]
  if (!next) return
  currentTrackIndex.value = index
  currentSource.value = 'track'
  currentPlaylistLabel.value = null
  const startSeconds = next.start ?? 0
  currentTime.value = startSeconds
  player.loadVideoById({ videoId: next.id, startSeconds })
  ensurePlayback()
  isPlaying.value = true
  ensureProgressTimer()
}

function playNext() {
  if (!playerReady.value) return
  if (currentSource.value === 'playlist') {
    player.nextVideo?.()
    ensurePlayback()
    isPlaying.value = true
    return
  }
  const nextIndex = (currentTrackIndex.value + 1) % tracks.value.length
  playTrackByIndex(nextIndex)
}

function playPrevious() {
  if (!playerReady.value) return
  if (currentSource.value === 'playlist') {
    player.previousVideo?.()
    ensurePlayback()
    isPlaying.value = true
    return
  }
  const length = tracks.value.length
  const nextIndex = (currentTrackIndex.value - 1 + length) % length
  playTrackByIndex(nextIndex)
}

function playRandom(excludeId?: string) {
  if (!playerReady.value) return
  if (!tracks.value.length) return
  const pool = excludeId ? tracks.value.filter(track => track.id !== excludeId) : tracks.value
  const usable = pool.length ? pool : tracks.value
  const randomIndex = Math.floor(Math.random() * usable.length)
  const chosen = usable[randomIndex]
  const actualIndex = tracks.value.findIndex(track => track.id === chosen.id)
  if (actualIndex !== -1) playTrackByIndex(actualIndex)
}

function togglePlayPause() {
  if (!playerReady.value) return
  const state = player.getPlayerState?.()
  const w = window as any
  if (state === w.YT.PlayerState.PLAYING) {
    player.pauseVideo()
    isPlaying.value = false
  } else {
    ensurePlayback()
    isPlaying.value = true
  }
}

function ensurePlayback() {
  if (!player) return
  try {
    player.playVideo?.()
  } catch {}
  requestGesture(gesturePlaybackAction)
}

function handleMediaInput() {
  const raw = mediaInput.value.trim()
  if (!raw) return
  const parsed = parseMediaInput(raw)
  if (!parsed) return
  const started = playParsedMedia(parsed)
  if (started) {
    mediaInput.value = ''
  }
}

function clearBlurTimer() {
  if (blurTimeout) {
    clearTimeout(blurTimeout)
    blurTimeout = null
  }
}

function onMediaFocus() {
  clearBlurTimer()
  inputFocused.value = true
}

function onMediaBlur() {
  clearBlurTimer()
  blurTimeout = setTimeout(() => {
    inputFocused.value = false
  }, 120)
}

function onMediaInput() {
  inputFocused.value = true
}

function hideSuggestions() {
  clearBlurTimer()
  inputFocused.value = false
}

function moveSelection(direction: number) {
  if (!filteredSuggestions.value.length) return
  const length = filteredSuggestions.value.length
  highlightedSuggestion.value = (highlightedSuggestion.value + direction + length) % length
}

function highlightBoundary(position: 'first' | 'last') {
  if (!filteredSuggestions.value.length) return
  highlightedSuggestion.value = position === 'first' ? 0 : filteredSuggestions.value.length - 1
}

function ensureProgressTimer() {
  if (progressTimer) return
  updateProgressFromPlayer()
  progressTimer = setInterval(updateProgressFromPlayer, 500)
}

function clearProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

function updateProgressFromPlayer() {
  if (!playerReady.value || !player) return
  const total = player.getDuration?.()
  if (Number.isFinite(total) && total && total > 0) {
    duration.value = total
  }
  if (isSeeking.value) return
  const current = player.getCurrentTime?.()
  if (Number.isFinite(current)) {
    const effectiveTotal = Number.isFinite(total) && total ? total : undefined
    currentTime.value = effectiveTotal ? Math.min(current, effectiveTotal) : current
  }
}

function commitSelection(force = false) {
  const activeSuggestion = filteredSuggestions.value[highlightedSuggestion.value]
  if (!force && showSuggestions.value && activeSuggestion) {
    selectSuggestion(activeSuggestion)
    return
  }
  clearBlurTimer()
  inputFocused.value = false
  handleMediaInput()
}

function selectSuggestion(suggestion: MediaSuggestion) {
  clearBlurTimer()
  inputFocused.value = false
  highlightedSuggestion.value = 0
  const parsed: ParsedMedia = suggestion.type === 'playlist'
    ? { type: 'playlist', id: suggestion.id, label: suggestion.title }
    : { type: 'video', id: suggestion.id, label: suggestion.title }
  const started = playParsedMedia(parsed)
  mediaInput.value = started ? '' : suggestion.id
}

function playParsedMedia(parsed: ParsedMedia): boolean {
  if (!playerReady.value || !player) return false

  if (parsed.type === 'playlist') {
    const playlist: Playlist = { id: parsed.id, title: parsed.label }
    rememberPlaylist(playlist)
    currentSource.value = 'playlist'
    currentPlaylistLabel.value = parsed.label
    currentTrackIndex.value = 0
    currentTime.value = 0
    player.loadPlaylist?.({ listType: 'playlist', list: parsed.id, index: 0, startSeconds: 0 })
    ensurePlayback()
    isPlaying.value = true
    ensureProgressTimer()
    return true
  }

  const existingIndex = tracks.value.findIndex(track => track.id === parsed.id)
  if (existingIndex === -1) {
    const newTrack: Track = { id: parsed.id, title: parsed.label }
    tracks.value.unshift(newTrack)
    currentTrackIndex.value = 0
    rememberTrack(newTrack)
  } else {
    currentTrackIndex.value = existingIndex
  }

  currentSource.value = 'track'
  currentPlaylistLabel.value = null
  const current = tracks.value[currentTrackIndex.value]
  const startSeconds = current?.start ?? 0
  currentTime.value = startSeconds
  player.loadVideoById?.({ videoId: parsed.id, startSeconds })
  ensurePlayback()
  isPlaying.value = true
  ensureProgressTimer()
  return true
}

function rememberTrack(track: Track) {
  if (!track.id) return
  if (defaultTracks.some(defaultTrack => defaultTrack.id === track.id)) return
  if (userTracks.value.some(saved => saved.id === track.id)) return
  const stored: Track = { id: track.id, title: track.title, ...(track.start !== undefined ? { start: track.start } : {}) }
  userTracks.value.unshift(stored)
  if (userTracks.value.length > 100) {
    userTracks.value.length = 100
  }
  persistUserTracks()
}

function rememberPlaylist(list: Playlist) {
  if (!list.id) return
  if (defaultPlaylists.some(defaultList => defaultList.id === list.id)) return
  if (userPlaylists.value.some(saved => saved.id === list.id)) return
  const stored: Playlist = { id: list.id, title: list.title }
  userPlaylists.value.unshift(stored)
  if (userPlaylists.value.length > 100) {
    userPlaylists.value.length = 100
  }
  persistUserPlaylists()
}

function persistUserTracks() {
  if (typeof window === 'undefined') return
  try {
    const payload = userTracks.value.slice(0, 100).map(track => ({
      id: track.id,
      title: track.title,
      ...(track.start !== undefined ? { start: track.start } : {}),
    }))
    window.localStorage.setItem(STORAGE_KEYS.tracks, JSON.stringify(payload))
  } catch {
    // Ignore persistence errors
  }
}

function persistUserPlaylists() {
  if (typeof window === 'undefined') return
  try {
    const payload = userPlaylists.value.slice(0, 100).map(list => ({
      id: list.id,
      title: list.title,
    }))
    window.localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(payload))
  } catch {
    // Ignore persistence errors
  }
}

function initializeMediaLibrary() {
  if (typeof window !== 'undefined') {
    try {
      userTracks.value = readStoredTracks(window.localStorage.getItem(STORAGE_KEYS.tracks))
    } catch {
      userTracks.value = []
    }
    try {
      userPlaylists.value = readStoredPlaylists(window.localStorage.getItem(STORAGE_KEYS.playlists))
    } catch {
      userPlaylists.value = []
    }
  }

  if (userTracks.value.length > 100) {
    userTracks.value.length = 100
  }
  if (userPlaylists.value.length > 100) {
    userPlaylists.value.length = 100
  }

  tracks.value = mergeTrackCollections(userTracks.value, defaultTracks)
}

function readStoredTracks(serialized: string | null): Track[] {
  if (!serialized) return []
  try {
    const parsed = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(item => {
        if (!item || typeof item !== 'object') return null
        const id = typeof item.id === 'string' ? item.id : ''
        if (!id) return null
        const title = typeof (item as any).title === 'string' && (item as any).title.trim()
          ? (item as any).title
          : readableLabel(id)
        const startRaw = (item as any).start
        const start = typeof startRaw === 'number' && Number.isFinite(startRaw) ? startRaw : undefined
        return { id, title, ...(start !== undefined ? { start } : {}) }
      })
      .filter((entry): entry is Track => !!entry)
  } catch {
    return []
  }
}

function readStoredPlaylists(serialized: string | null): Playlist[] {
  if (!serialized) return []
  try {
    const parsed = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(item => {
        if (!item || typeof item !== 'object') return null
        const id = typeof item.id === 'string' ? item.id : ''
        if (!id) return null
        const title = typeof (item as any).title === 'string' && (item as any).title.trim()
          ? (item as any).title
          : shortLabel(id)
        return { id, title }
      })
      .filter((entry): entry is Playlist => !!entry)
  } catch {
    return []
  }
}

function mergeTrackCollections(primary: Track[], secondary: Track[]): Track[] {
  const seen = new Set<string>()
  const merged: Track[] = []
  const add = (track: Track) => {
    if (!track.id || seen.has(track.id)) return
    seen.add(track.id)
    merged.push({ id: track.id, title: track.title, ...(track.start !== undefined ? { start: track.start } : {}) })
  }
  primary.forEach(add)
  secondary.forEach(add)
  return merged
}

function handleTrackEnded() {
  isPlaying.value = false
  if (currentSource.value === 'playlist') {
    const playlistIds = player?.getPlaylist?.()
    const playlistIndex = player?.getPlaylistIndex?.()
    if (Array.isArray(playlistIds) && typeof playlistIndex === 'number') {
      if (!playlistIds.length || playlistIndex >= playlistIds.length - 1) {
        playRandom()
      }
      return
    }
    playRandom()
    return
  }

  const currentId = currentTrack.value?.id
  playRandom(currentId)
}

function onHornsPointerEnter(e: PointerEvent) {
  if (e.pointerType === 'mouse') startHoverSound()
}

function onHornsPointerLeave() {
  stopHoverSound()
}

function onHornsPointerDown() {
  startHoverSound()
}

function onHornsPointerUp() {
  stopHoverSound()
}

function startHoverSound() {
  prepareHoverAudio()
  if (!hoverAudio) return
  if (!hoverAudio.paused) return
  hoverAudio.currentTime = 0
  hoverAudio.play()
    .then(() => {
      hoverAudioUnlocked = true
      hoverAudioPendingStart = false
    })
    .catch(() => {
      hoverAudioPendingStart = true
      requestGesture(startHoverSound)
    })
}

function stopHoverSound() {
  hoverAudioPendingStart = false
  if (!hoverAudio) return
  hoverAudio.pause()
  hoverAudio.currentTime = 0
}

function onOpacityInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  if (Number.isFinite(value)) {
    videoOpacity.value = value
  }
}

function onVolumeInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (!Number.isFinite(value)) return
  const clamped = Math.min(100, Math.max(0, value))
  volume.value = clamped
  if (playerReady.value && typeof player?.setVolume === 'function') {
    player.setVolume(clamped)
  }
}

function onProgressInput(event: Event) {
  if (!playerReady.value) return
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (!Number.isFinite(value)) return
  isSeeking.value = true
  currentTime.value = value
}

function onProgressCommit(event: Event) {
  if (!playerReady.value) return
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (!Number.isFinite(value)) {
    isSeeking.value = false
    return
  }
  player.seekTo?.(value, true)
  currentTime.value = value
  isSeeking.value = false
}

function onProgressBlur() {
  isSeeking.value = false
}

function toggleFullscreen() {
  if (!wrap.value) return
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {})
  } else {
    requestFs(wrap.value)
  }
}

function onFullscreenChange() {
  const current = document.fullscreenElement
  isFullscreen.value = !!current && wrap.value ? current === wrap.value || wrap.value.contains(current) : false
}

function prepareHoverAudio() {
  if (hoverAudio || typeof window === 'undefined') return
  hoverAudio = new Audio(hoverSoundUrl)
  hoverAudio.preload = 'auto'
  hoverAudio.loop = true
  hoverAudio.volume = 0.6
  hoverAudio.load()
  hoverAudioUnlocked = false
  hoverAudioPendingStart = false
  requestGesture(unlockHoverAudio)
}

function unlockHoverAudio() {
  if (!hoverAudio) return
  hoverAudio.muted = true
  hoverAudio.play()
    .then(() => {
      hoverAudio?.pause()
      if (hoverAudio) {
        hoverAudio.currentTime = 0
        hoverAudio.muted = false
      }
      hoverAudioUnlocked = true
      if (hoverAudioPendingStart) {
        hoverAudioPendingStart = false
        startHoverSound()
      }
    })
    .catch(() => {
      requestGesture(unlockHoverAudio)
    })
}

function parseMediaInput(value: string): ParsedMedia | null {
  try {
    const url = new URL(value)
    const list = url.searchParams.get('list')
    if (list) return { type: 'playlist', id: list, label: shortLabel(list) }
    const id = url.searchParams.get('v') || url.pathname.split('/').pop() || ''
    if (id) return { type: 'video', id, label: readableLabel(id) }
  } catch {
    // Not a URL, handled below
  }

  if (value.startsWith('PL') || value.startsWith('RD') || value.length > 15) {
    return { type: 'playlist', id: value, label: shortLabel(value) }
  }

  if (value.length >= 5) {
    return { type: 'video', id: value, label: readableLabel(value) }
  }

  return null
}

function readableLabel(id: string) {
  return `Track ${id.slice(0, 6)}`
}

function shortLabel(id: string) {
  return id.slice(0, 10)
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00'
  const rounded = Math.floor(totalSeconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

function fuzzyScore(source: string, query: string) {
  if (!query) return Number.POSITIVE_INFINITY
  if (source.includes(query)) {
    return source.indexOf(query)
  }

  const tokens = query.split(/\s+/).filter(Boolean)
  if (!tokens.length) return Number.POSITIVE_INFINITY

  let score = 0
  for (const token of tokens) {
    const idx = source.indexOf(token)
    if (idx === -1) {
      return Number.POSITIVE_INFINITY
    }
    score += idx
  }

  return score + tokens.length * 5
}

function requestGesture(action: () => void): boolean {
  if (gestureCredits > 0) {
    gestureCredits -= 1
    gestureQueueSet.delete(action)
    runGestureAction(action)
    flushGestureQueue()
    return true
  }
  if (gestureQueueSet.has(action)) {
    return false
  }
  gestureQueue.push(action)
  gestureQueueSet.add(action)
  return false
}

function grantGestureCredit() {
  gestureCredits = Math.min(MAX_GESTURE_CREDITS, gestureCredits + 1)
  flushGestureQueue()
}

function flushGestureQueue() {
  while (gestureCredits > 0 && gestureQueue.length) {
    const action = gestureQueue.shift()
    if (!action) continue
    gestureQueueSet.delete(action)
    gestureCredits -= 1
    runGestureAction(action)
  }
}

function runGestureAction(action: () => void) {
  try {
    action()
  } catch (error) {
    console.error('Gesture action failed', error)
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (controlsButton.value && target && controlsButton.value.contains(target)) {
    return
  }
  grantGestureCredit()
}

watch(mediaInput, () => {
  highlightedSuggestion.value = 0
})

watch(filteredSuggestions, suggestions => {
  if (!suggestions.length) {
    highlightedSuggestion.value = 0
    return
  }
  if (highlightedSuggestion.value >= suggestions.length) {
    highlightedSuggestion.value = suggestions.length - 1
  }
})
</script>

<style scoped>
:deep(iframe) { width: 100%; height: 100%; }
.control-button {
  @apply h-10 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-white/5;
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.animate-pulse {
  animation: glowPulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 18px rgba(109, 247, 193, 0.5), 0 0 40px rgba(51, 240, 166, 0.4);
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(109, 247, 193, 0.4), 0 0 30px rgba(51, 240, 166, 0.25);
  }
  50% {
    box-shadow: 0 0 24px rgba(109, 247, 193, 0.7), 0 0 50px rgba(51, 240, 166, 0.5);
  }
}

</style>
