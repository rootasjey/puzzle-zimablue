<script setup lang="ts">
import type { GameplayHeaderDetail } from '~/composables/useGameplayHeader'

const props = defineProps<{ title: string; details: GameplayHeaderDetail[] }>()
const { $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const desktopOpen = ref(false)
const mobileOpen = ref(false)

watch(() => props.title, () => {
  desktopOpen.value = false
  mobileOpen.value = false
})
</script>

<template>
  <h1 class="gameplay-header-title">
    <NPopover v-model:open="desktopOpen" :modal="false" :_popover-content="{ class: 'gameplay-info-popover' }">
      <template #trigger>
        <button class="gameplay-title-trigger gameplay-title-trigger-desktop" type="button" :aria-label="t('play.openPuzzleDetails', { title })">
          <span class="gameplay-title-text">{{ title }}</span>
          <span class="i-lucide-chevron-down gameplay-title-chevron" aria-hidden="true" />
        </button>
      </template>
      <section class="gameplay-info-card" :aria-label="t('play.puzzleDetails')">
        <h2>{{ t('play.puzzleDetails') }}</h2>
        <dl>
          <div v-for="detail in details" :key="detail.label">
            <dt>{{ detail.label }}</dt>
            <dd>{{ detail.value }}</dd>
          </div>
        </dl>
      </section>
    </NPopover>

    <NDrawer
      v-model:open="mobileOpen"
      direction="bottom"
      :title="title"
      :description="t('play.puzzleDetails')"
      :_drawer-content="{ class: 'gameplay-info-drawer' }"
      :_drawer-header="{ class: 'gameplay-info-drawer-header' }"
      :_drawer-footer="{ class: 'gameplay-info-drawer-footer' }"
      :_drawer-overlay="{ class: 'gameplay-info-drawer-overlay' }"
    >
      <template #trigger>
        <button class="gameplay-title-trigger gameplay-title-trigger-mobile" type="button" :aria-label="t('play.openPuzzleDetails', { title })">
          <span class="gameplay-title-text">{{ title }}</span>
          <span class="i-lucide-chevron-down gameplay-title-chevron" aria-hidden="true" />
        </button>
      </template>
      <template #body>
        <dl class="gameplay-info-details">
          <div v-for="detail in details" :key="detail.label">
            <dt>{{ detail.label }}</dt>
            <dd>{{ detail.value }}</dd>
          </div>
        </dl>
      </template>
      <template #close>{{ t('play.closeDetails') }}</template>
    </NDrawer>
  </h1>
</template>

<style>
.gameplay-header-title { display: flex; min-width: 0; flex: 1 1 auto; align-items: center; margin: 0; }
.gameplay-title-trigger { display: flex; max-width: 100%; min-width: 0; align-items: center; gap: .35rem; border: 0; padding: .25rem 0; background: transparent; color: var(--ink); font: inherit; font-size: clamp(.92rem, 1.45vw, 1.18rem); font-weight: 850; text-align: left; cursor: pointer; }
.gameplay-title-trigger:hover { color: var(--blue); }
.gameplay-title-trigger:active { transform: translateY(1px); }
.gameplay-title-trigger:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.gameplay-title-trigger-desktop { width: min(100%, 32rem); }
.gameplay-title-trigger-mobile { display: none; }
.gameplay-title-text { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gameplay-title-chevron { display: block; width: .9rem; height: .9rem; flex: none; color: var(--blue); }
.gameplay-info-popover { z-index: 80; width: min(20rem, calc(100vw - 2rem)); padding: 0; border: 2px solid var(--ink); border-radius: 0; background: var(--paper); box-shadow: var(--shadow); color: var(--ink); }
.gameplay-info-card { padding: .85rem 1rem; }
.gameplay-info-card h2 { margin: 0 0 .65rem; color: var(--blue); font-size: .82rem; font-weight: 800; }
.gameplay-info-card dl,.gameplay-info-details { display: grid; gap: .5rem; margin: 0; }
.gameplay-info-card dl > div,.gameplay-info-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.gameplay-info-card dt,.gameplay-info-details dt { color: var(--muted); font-size: .75rem; }
.gameplay-info-card dd,.gameplay-info-details dd { margin: 0; color: var(--ink); font-size: .78rem; font-weight: 750; text-align: right; }
.gameplay-info-drawer { z-index: 100; max-height: min(60svh, 26rem); border: 2px solid var(--ink); border-bottom: 0; border-radius: 1rem 1rem 0 0; background: var(--paper); color: var(--ink); box-shadow: 0 -5px 0 var(--yellow); padding-bottom: max(.7rem, env(safe-area-inset-bottom)); }
.gameplay-info-drawer-header { gap: .25rem; padding: .75rem 1.1rem .55rem; }
.gameplay-info-drawer-header h2 { margin: 0; color: var(--ink); font-size: 1.05rem; font-weight: 850; }
.gameplay-info-drawer-header p { margin: 0; color: var(--blue); font-size: .75rem; font-weight: 750; }
.gameplay-info-drawer .drawer-handle { background: var(--line-divider); }
.gameplay-info-details { padding: .3rem 1.1rem 1rem; }
.gameplay-info-drawer-footer { padding: 0 1.1rem .35rem; }
.gameplay-info-drawer-footer button { min-height: 2.5rem; border: 2px solid var(--ink); background: var(--white); box-shadow: 2px 2px 0 var(--ink); color: var(--blue); font: inherit; font-size: .78rem; font-weight: 800; }
.gameplay-info-drawer-overlay { background: rgb(12 17 37 / 32%); }
@media (max-width: 760px) {
  .gameplay-title-trigger-desktop { display: none; }
  .gameplay-title-trigger-mobile { display: flex; width: 100%; font-size: .86rem; }
  .gameplay-title-chevron { width: .82rem; height: .82rem; }
  .gameplay-info-popover { display: none; }
}
</style>
