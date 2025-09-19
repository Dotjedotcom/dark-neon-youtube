<template>
  <button
    :class="[
      'glowing group relative isolate overflow-hidden rounded-2xl px-8 py-4 font-medium tracking-wide text-black shadow-glow transition-transform duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.07] active:scale-[0.99]',
      props.highlight
        ? 'bg-neon-600 shadow-[0_0_45px_rgba(51,240,166,0.65)] ring ring-offset-2 ring-neon-600/70 ring-offset-transparent'
        : 'bg-neon-600/95 shadow-[0_0_28px_rgba(51,240,166,0.45)] ring ring-offset-2 ring-neon-600/40 ring-offset-transparent'
      ]"
    data-summon-button="true"
    @click="emit('press')"
  >
    <span class="pointer-events-none absolute inset-0 -z-10 opacity-60 blur-2xl transition-[opacity,transform] duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-90 group-hover:scale-[1.08]" style="background: radial-gradient(60% 60% at 50% 50%, rgba(51,240,166,0.45), transparent 60%);"></span>
    <span class="flex items-center gap-3">
      <span class="relative h-7 w-7 rounded-full bg-black/50 ring-1 ring-white/15 grid place-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4 text-neon-600">
          <path fill="currentColor" d="M12 2C7.58 2 4 5.13 4 9.25c0 2.21 1.14 4.18 2.93 5.44L7 17a2 2 0 0 0 2 2h1v1a1 1 0 1 0 2 0v-1h1v1a1 1 0 1 0 2 0v-1h1a2 2 0 0 0 2-2l.07-2.31C18.86 13.43 20 11.46 20 9.25 20 5.13 16.42 2 12 2Zm-3.5 8.5c-.83 0-1.5-.67-1.5-1.5S7.67 7.5 8.5 7.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5Zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5Z"/>
        </svg>
      </span>
      <span class="text-lg uppercase tracking-widest">{{ props.label }}</span>
    </span>

    <span class="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-[opacity,transform] duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100 group-hover:scale-105 animate-pulse-soft" aria-hidden>
      <span class="absolute -inset-[2px] rounded-2xl ring-2 ring-neon-600/60"></span>
      <span class="absolute -inset-[6px] rounded-3xl ring-1 ring-neon-600/30"></span>
    </span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ label?: string; highlight?: boolean }>(), {
  label: 'Summon the Video',
  highlight: false
})
const emit = defineEmits<{ (event: 'press'): void }>()
</script>

<style scoped>
.glowing {
  box-shadow: 0 0 20px #1c87c9, 0 0 40px #1c87c9;
  transition: box-shadow 0.3s ease;
  animation: glowing 5s infinite;
}
@keyframes glowing {
  0% { box-shadow: 0 0 5px #2ba805; }
  50% { box-shadow: 0 0 20px #49e819; }
  100% { box-shadow: 0 0 5px #2ba805; }
}
</style>
