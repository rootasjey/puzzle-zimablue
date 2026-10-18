<template>
  <PuzzleLeaderboard :date="date" historical :data="data" :error="error" :pending="pending" />
</template>

<script setup lang="ts">
import type { LeaderboardPayload } from '#shared/types/leaderboard'
definePageMeta({ name: 'leaderboard-puzzle', pageTransition: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { fr: '/classement/[date]', en: '/leaderboard/[date]' } })
const route = useRoute()
const date = computed(() => String(route.params.date))
const requestUrl = computed(() => `/api/leaderboard/history?date=${encodeURIComponent(date.value)}`)
const requestKey = computed(() => `puzzle-leaderboard-history-${date.value}`)
const { data, error, pending } = await useFetch<LeaderboardPayload>(requestUrl, { key: requestKey })
</script>
