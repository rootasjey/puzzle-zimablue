<template>
  <PuzzleLeaderboard :date="today" :data="data" :error="error" :pending="pending" />
</template>

<script setup lang="ts">
import type { LeaderboardPayload } from '#shared/types/leaderboard'
definePageMeta({ name: 'leaderboard', pageTransition: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/leaderboard' } })
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const { data, error, pending } = await useFetch<LeaderboardPayload>('/api/leaderboard/today', { key: 'daily-leaderboard' })
</script>
