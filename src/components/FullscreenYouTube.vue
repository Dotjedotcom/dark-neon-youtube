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
                          @mousedown.prevent="applySuggestion(suggestion)"
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
import { onMounted, onBeforeUnmount, ref, computed, nextTick, watch } from 'vue'
import hoverSoundUrl from '../assets/whoosh.wav'
import backgroundImageUrl from '../assets/bg.jpg'
import { ensureYouTubeIframeAPIReady } from '../utils/youtube'

type Track = { id: string; title: string; start?: number }
type Playlist = { id: string; title: string }
type MediaSuggestion = { id: string; title: string; type: 'video' | 'playlist' }

const props = defineProps<{ videoId: string; startSeconds?: number }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const wrap = ref<HTMLDivElement | null>(null)
const playerHost = ref<HTMLDivElement | null>(null)
let player: any
const playerReady = ref(false)
const controlsOpen = ref(false)
const videoOpacity = ref(0.75)
const volume = ref(80)
const mediaInput = ref('')
const currentSource = ref<'track' | 'playlist'>('track')
const currentPlaylistLabel = ref<string | null>(null)
const inputFocused = ref(false)
const highlightedSuggestion = ref(0)
let blurTimeout: ReturnType<typeof setTimeout> | null = null
const suggestionListId = `media-suggestions-${Math.random().toString(36).slice(2)}`

const defaultTracks: Track[] = [
  { id: 'ZhiV-gAOT1g', start: 24, title: '10 Styles of Metal' },
  { id: 'WG2RMlUK2So', start: 13, title: 'Lokust - Guiltless' },
  { id: 'B7mhQipwdb0', start: 280, title: 'Infant Annihilator - Blasphemian' },
  { id: 'LPHJLB1ZeAc', start: 51, title: 'Body Count - Raining in Blood / Postmortem 2017' },
  { id: 'WfKUWvVCwvE', start: 0, title: 'Slayer - Bloodline' },
  { id: 'SImHi16cwqc', start: 13, title: 'Infant Annihilator - Cuntcrusher Drum Playthrough' },
  { id: 'Eq2PQm6FqVY', start: 0, title: 'Iniquity - Growl Karaoke' },
  { id: 'Osqf4oIK0E8', start: 0, title: 'Igorrr - Very Noise' },
  { id: 'UZzYxGZ7Hmc', start: 0, title: 'Igorrr - Cheval' },
  { id: 'RoBw0Fz8mu4', start: 0, title: 'Public Enemy - Chanel Zero' },
  { id: 'f8HLrh1U-z8', start: 0, title: 'S.O.D. - Kill Yourself' },
  { id: 'yiyYqOdUaWU', start: 0, title: 'S.O.D. - March of the S.O.D. / Sargent D / Speak English Or Die' },
  { id: 'eAgITc08XGk', start: 0, title: 'The Monolith Deathcult - Commanders Encircled With Foes' },
  { id: 'IJkMrl4AG8w', start: 0, title: 'Deicide - Homage to Satan' },
  { id: 'Bd4bM0Pp8NU', start: 0, title: 'Slayer - God Hates Us All' },
  { id: 'qyYmS_iBcy4', start: 0, title: 'Lorna Shore - To the Hellfire' },
  { id: 'X4bgXH3sJ2Q', start: 0, title: 'Iron Maiden - The Trooper' },
  { id: 'AkFqg5wAuFk', start: 0, title: 'Pantera - Walk' },
  { id: 'DuSHgiZFVuI', start: 0, title: 'Napalm Death - The World Keeps Turning' },
  { id: 'npa8qUNEIFY', start: 0, title: 'Napalm Death - On the Brink of Extinction' },
  { id: 'pgWVjSZGMos', start: 0, title: 'Napalm Death - Unchallenged Hate' },
  { id: 'c4zxrYUOXLo', start: 0, title: 'Pestilence - Out of the Body' },
  { id: '6qEzTzv4w6E', start: 0, title: 'Gorefest - Confessions of a Serial Killer' },
  { id: 'g1YH7PFy3no', start: 0, title: 'Gorefest - For the Masses' },
  { id: 'oX4KTg3W3Bc', start: 20, title: 'Entombed - Left Hand Path' },
  { id: 'nxcJW6bs5os', start: 0, title: "Suicidal Tendencies - You Can't Bring Me Down" },
  { id: 'nCtjAmtIGf0', start: 0, title: 'At the Gates - Blinded by Fear' },
  { id: 'AG-menlRlAg', start: 0, title: 'Dismember - Left Hand Path' },
  { id: 'FRnh-e9Kmp0', start: 0, title: 'Terrorizer - Storm of Stress' },
  { id: 'F5nGo7yUtlE', start: 0, title: 'Carcass - Corporal Jigsore Quandary' },
  { id: 'ZpbpOgUybBM', start: 0, title: 'Carcass - Heartwork' },
  { id: '6BOHpjIZyx0', start: 0, title: 'Sepultura - Arise' },
  { id: 'HsKP30C4D7s', start: 0, title: 'Morbid Angel - Chapel of Ghouls' },
  { id: '6ODNxy3YOPU', start: 0, title: 'Sepultura - Refuse/Resist' },
  { id: '9J_z_kjGaVs', start: 0, title: 'Igorrr - Infestis' },
  { id: '_s1qY29Z-go', start: 0, title: 'Reaper - Coach' },
  { id: 'N0OBF83rL-8', start: 12, title: 'Igorrr - Headbutt' },
  { id: 'dGice3BmnmM', start: 0, title: 'Current Value - Dark Rain' },
  { id: 'tVZw7vQGR30', start: 0, title: 'Improver - Feel the future' },
  { id: 'rBmMzabdEKQ', start: 6, title: 'DubFX - No rest for the wicked' },
  { id: 'Q3oItpVa9fs', start: 0, title: 'Nigel Stanford - Cymatics: Science vs Music' },
  { id: 'rULmvm48_o', start: 0, title: 'Black Sun Empire & Noisia - Feed the Machine' },
  { id: 'DRIC6Mb6xzg', start: 0, title: 'Rawtekk - Snowflakes (neuropop VIP)' },
  { id: 'Q1xR3Xidq84', start: 0, title: 'Southpark - Trump' },
  { id: 'xlu1xTH3Iqc', start: 0, title: 'Southpark - I\'m Master Debating, Mom' },
  { id: 'pdiiEW8XWqw', start: 0, title: 'Southpark - Funny clips' },
  { id: 'V6LggtNzt3o', start: 0, title: 'MMA - KO\'s' },
  { id: '8sBPkR9lbeo', start: 0, title: 'UFC - Crocop' },
  { id: 'iuhoXouDN-Y', start: 0, title: 'UFC - Aerts' },
  { id: 'M9vjD48xJ6o', start: 0, title: 'Pancrase - Rutten' },
  { id: 'puTWqS1__CI', start: 0, title: 'KOTS - KO\'s' },
  { id: 'IwLSrNu1ppI', start: 0, title: 'J-Cut & Kolt Siewerts - The Flute Tune (Soulpride Remix)' },
  { id: 'pZNpxhPuU-g', start: 0, title: 'RAY VOLPE & TYNAN - DANGER (Official Visualizer)' },
  { id: '9uhl6XRtipg', start: 0, title: 'A.M.C. - Eject' },
  { id: 'h_kHOvqjDhI', start: 0, title: 'Noisia - Dead limit' },
  { id: 'xtppf3xkby4', start: 0, title: 'Noisia - Stigma' },
  { id: 'bAhabqiaL50', start: 0, title: 'Black Sun Empire feat. Foreign Beggars - Dawn of a Dark Day' },
  { id: 'geGdGoRXv5s', start: 0, title: 'Audio - Topic - Collision' },
  { id: '21bsSdIyKbo', start: 0, title: 'Drum and Bass Mix #132' },
  { id: 'TZ827lkktYs', start: 0, title: 'Aphex Twin - Come to daddy' },
  { id: 'pvt3l2LI_sA', start: 0, title: 'Prins Fatty - Black Rabbit' },
  { id: 'JGMPri-Yttk', start: 0, title: 'A.M.C. - BASS' },
  { id: 'Y-Xg8pWhicY', start: 0, title: 'Reaper - The Power' },
  { id: 'KKJprZqU_oU', start: 0, title: 'Southpark - Respect my authority' },
]
const defaultPlaylists: Playlist[] = [
  { id: 'PLd4QZO8a_HsEn6EEaFfWIa49NKMTqkYt5', title: 'Dark Neon Drum & Bass' },
  { id: 'PLC3b0k8F4pv7F-SEmiY7-ZdGg0G8hlt2y', title: 'Cyberpunk Visual Synthwave' },
  { id: 'PLkLimRXN6NKyIFzONVd1Rv0O5jXv0mI0B', title: 'Metal Meets Orchestra' },
]
const tracks = ref<Track[]>([...defaultTracks])
const currentTrackIndex = ref(0)

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
let removeHoverUnlock: (() => void) | null = null

const allSuggestions = computed<MediaSuggestion[]>(() => [
  ...defaultTracks.map(track => ({ id: track.id, title: track.title, type: 'video' as const })),
  ...defaultPlaylists.map(list => ({ id: list.id, title: list.title, type: 'playlist' as const })),
])

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

function initializeInitialTrackSelection() {
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
    return
  }

  tracks.value.unshift({ id, title: readableLabel(id) })
  currentTrackIndex.value = 0
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
  if (!playerHost.value || !wrap.value) return
  requestFs(wrap.value)
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
        if (currentTrack.value && currentTrack.value.start !== undefined) {
          player.seekTo(currentTrack.value.start, true)
        }
        if (typeof player.setVolume === 'function') {
          player.setVolume(volume.value)
        }
        player.playVideo()
      },
      onStateChange: (e: any) => {
        if (e.data === w.YT.PlayerState.ENDED) handleTrackEnded()
        if (e.data === w.YT.PlayerState.PLAYING) isPlaying.value = true
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
  stopHoverSound()
  removeHoverUnlock?.()
  removeHoverUnlock = null
  try { player?.destroy?.() } catch {}
})

function playTrackByIndex(index: number) {
  if (!playerReady.value) return
  const next = tracks.value[index]
  if (!next) return
  currentTrackIndex.value = index
  currentSource.value = 'track'
  currentPlaylistLabel.value = null
  player.loadVideoById({ videoId: next.id, startSeconds: next.start ?? 0 })
  player.playVideo()
  isPlaying.value = true
}

function playNext() {
  if (!playerReady.value) return
  if (currentSource.value === 'playlist') {
    player.nextVideo?.()
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
    player.playVideo()
    isPlaying.value = true
  }
}

function handleMediaInput() {
  if (!mediaInput.value.trim() || !playerReady.value) return
  const parsed = parseMediaInput(mediaInput.value.trim())
  if (!parsed) return

  if (parsed.type === 'playlist') {
    player.loadPlaylist({ list: parsed.id })
    isPlaying.value = true
    currentSource.value = 'playlist'
    currentPlaylistLabel.value = parsed.label
    currentTrackIndex.value = 0
  } else {
    const existingIndex = tracks.value.findIndex(track => track.id === parsed.id)
    if (existingIndex === -1) {
      tracks.value.unshift({ id: parsed.id, title: parsed.label })
      currentTrackIndex.value = 0
    } else {
      currentTrackIndex.value = existingIndex
    }
    currentSource.value = 'track'
    currentPlaylistLabel.value = null
    player.loadVideoById({ videoId: parsed.id, startSeconds: 0 })
    player.playVideo()
    isPlaying.value = true
  }

  mediaInput.value = ''
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

function commitSelection(force = false) {
  const activeSuggestion = filteredSuggestions.value[highlightedSuggestion.value]
  if (!force && showSuggestions.value && activeSuggestion) {
    applySuggestion(activeSuggestion)
    return
  }
  clearBlurTimer()
  inputFocused.value = false
  handleMediaInput()
}

function applySuggestion(suggestion: MediaSuggestion) {
  clearBlurTimer()
  mediaInput.value = suggestion.id
  inputFocused.value = false
  highlightedSuggestion.value = 0
  nextTick(() => {
    handleMediaInput()
  })
}

function handleTrackEnded() {
  isPlaying.value = false
  if (currentSource.value === 'playlist') {
    return
  }
  const currentId = currentTrack.value?.id
  if (!currentId) return
  if (Math.random() < 0.9) {
    const start = currentTrack.value?.start ?? 0
    if (player && typeof player.seekTo === 'function') {
      player.seekTo(start, true)
    }
    if (player && typeof player.playVideo === 'function') {
      player.playVideo()
    }
    isPlaying.value = true
    return
  }
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
  if (hoverAudioPendingStart && !hoverAudioUnlocked) return
  if (!hoverAudio.paused) return
  hoverAudio.currentTime = 0
  hoverAudio.play()
    .then(() => {
      hoverAudioUnlocked = true
      hoverAudioPendingStart = false
    })
    .catch(() => {
      hoverAudioPendingStart = true
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

  const unlock = () => {
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
        window.removeEventListener('pointerdown', unlock)
        removeHoverUnlock = null
      })
      .catch(() => {
        // keep listener for next pointer down if blocked
      })
  }

  window.addEventListener('pointerdown', unlock)
  removeHoverUnlock = () => window.removeEventListener('pointerdown', unlock)
}

function parseMediaInput(value: string): { type: 'video'; id: string; label: string } | { type: 'playlist'; id: string; label: string } | null {
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
