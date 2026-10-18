<template>
  <main class="account-page">
    <section v-if="loggedIn" class="account-content">
      <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('account.kicker') }}</p>
      <div class="account-heading">
        <div>
          <h1>{{ t('account.title') }}</h1>
          <p class="auth-intro">{{ user?.email }}</p>
        </div>
        <button class="admin-secondary" type="button" :disabled="busy" @click="logout">{{ t('account.signOut') }}</button>
      </div>
      <p v-if="route.query.verified === '1'" class="auth-confirmation" role="status">{{ t('account.verified') }}</p>
      <p v-if="error" class="form-error" role="alert">{{ t('account.loadError') }}</p>
      <div v-else-if="stats" class="account-stats">
        <article class="account-stat"><strong>{{ stats.completedCount }}</strong><span>{{ t('account.puzzlesCompleted') }}</span></article>
        <article class="account-stat"><strong>{{ stats.currentStreak }}</strong><span>{{ t('account.dayStreak') }}</span></article>
        <article class="account-stat"><strong>{{ stats.bestMoves ?? '—' }}</strong><span>{{ t('account.bestMoves') }}</span></article>
      </div>
      <section v-if="stats" class="account-cumulative-stats" aria-labelledby="account-cumulative-stats-title">
        <h2 id="account-cumulative-stats-title">{{ t('account.cumulativeStats') }}</h2>
        <p>{{ t('account.verifiedStatsNote') }}</p>
        <div v-if="stats.verifiedStats.difficulties.length" class="metrics-table-wrap">
          <table class="metrics-table public-player-table">
            <thead>
              <tr>
                <th scope="col">{{ t('publicProfile.difficulty') }}</th>
                <th scope="col">{{ t('publicProfile.games') }}</th>
                <th scope="col">{{ t('publicProfile.average') }}</th>
                <th scope="col">{{ t('publicProfile.best') }}</th>
                <th scope="col">{{ t('publicProfile.highest') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="difficulty in stats.verifiedStats.difficulties" :key="`${difficulty.gridRows}x${difficulty.gridColumns}`">
                <th scope="row">{{ t('home.pieces', { count: difficulty.pieceCount }) }}</th>
                <td>{{ difficulty.completions }}</td>
                <td>{{ formatNumber(difficulty.averageMoves) }}</td>
                <td>{{ difficulty.bestMoves }}</td>
                <td>{{ difficulty.worstMoves }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="metrics-empty">{{ t('publicProfile.noScores') }}</p>
      </section>
      <section v-if="stats" class="account-public-profile" aria-labelledby="public-name-title">
        <h2 id="public-name-title">{{ t('account.publicNameTitle') }}</h2>
        <p>{{ t('account.publicNameHelp') }}</p>
        <form class="account-public-form" @submit.prevent="savePublicName">
          <label>{{ t('account.publicNameLabel') }}<input v-model="publicName" type="text" maxlength="24" autocomplete="nickname"></label>
          <p v-if="profileError" class="form-error" role="alert">{{ profileError }}</p>
          <p v-if="profileSaved" class="auth-confirmation" role="status">{{ profileSaved }}</p>
          <button class="admin-primary" type="submit" :disabled="profileBusy">{{ profileBusy ? t('account.savingPublicName') : t('account.savePublicName') }}</button>
        </form>
      </section>
      <section v-if="stats" class="account-public-profile account-public-sharing" aria-labelledby="public-profile-title">
        <h2 id="public-profile-title">{{ t('account.publicProfileTitle') }}</h2>
        <p>{{ t('account.publicProfileHelp') }}</p>
        <label class="account-public-toggle">
          <input v-model="publicProfileDraft" type="checkbox" :disabled="publicProfileBusy">
          <span>{{ t('account.publicProfileToggle') }}</span>
        </label>
        <p v-if="publicProfileDraft && !stats.publicName" class="account-public-hint">{{ t('account.publicProfileNeedsName') }}</p>
        <p v-if="publicProfileError" class="form-error" role="alert">{{ publicProfileError }}</p>
        <p v-if="publicProfileSaved" class="auth-confirmation" role="status">{{ publicProfileSaved }}</p>
        <div class="account-public-actions">
          <button
            class="admin-primary"
            type="button"
            :disabled="publicProfileBusy || publicProfileDraft === isPublicProfile || (publicProfileDraft && !stats.publicName)"
            @click="savePublicProfile"
          >
            {{ publicProfileBusy ? t('account.savingPublicProfile') : t(publicProfileActionLabel) }}
          </button>
          <NuxtLink
            v-if="isPublicProfile && stats.publicProfileToken"
            class="soft-link"
            :to="$localePath({ name: 'public-player-profile', params: { token: stats.publicProfileToken } })"
            target="_blank"
          >
            {{ t('account.viewPublicProfile') }} <span aria-hidden="true">↗</span>
          </NuxtLink>
        </div>
      </section>
      <section class="account-history">
        <h2>{{ t('account.history') }}</h2>
        <p v-if="stats?.completions.length === 0" class="auth-intro">{{ t('account.empty') }}</p>
        <ul v-else-if="stats" class="account-completions">
          <li v-for="completion in stats.completions" :key="completion.puzzleDate">
            <NuxtLink :to="$localePath({ name: 'play', params: { date: completion.puzzleDate } })">
              <span>{{ formatPuzzleDate(completion.puzzleDate, { dateStyle: 'medium' }, dateLocale) }}</span>
              <strong>{{ t(completion.moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: completion.moves }) }}</strong>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </section>
    <section v-else class="auth-sheet account-welcome">
      <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('account.kicker') }}</p>
      <h1>{{ t('account.title') }}</h1>
      <p class="auth-intro">{{ t('account.description') }}</p>
      <div class="account-actions">
        <NuxtLink class="admin-primary" :to="$localePath({ name: 'account-sign-in' })">{{ t('auth.login') }}</NuxtLink>
        <NuxtLink class="admin-secondary" :to="$localePath({ name: 'account-sign-up' })">{{ t('account.createAccount') }}</NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { formatPuzzleDate } from '#shared/types/puzzle'
interface AccountStats { publicName: string; publicProfileToken: string | null; completedCount: number; currentStreak: number; bestMoves: number | null; verifiedStats: { completedCount: number; difficulties: { gridRows: number; gridColumns: number; pieceCount: number; completions: number; averageMoves: number; bestMoves: number; worstMoves: number }[] }; completions: { puzzleDate: string; moves: number; completedAt: string }[] }
definePageMeta({ name: 'account' })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account' } })
const route = useRoute()
const { loggedIn, user, fetch } = useUserSession()
const { $localePath } = useNuxtApp()
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const formatNumber = (value: number) => new Intl.NumberFormat(dateLocale.value, { maximumFractionDigits: 1 }).format(value)
const { data: stats, error } = await useFetch<AccountStats>('/api/account/stats', { immediate: loggedIn.value })
const busy = ref(false)
const profileBusy = ref(false)
const publicName = ref('')
const profileError = ref('')
const profileSaved = ref('')
const publicProfileDraft = ref(false)
const publicProfileBusy = ref(false)
const publicProfileError = ref('')
const publicProfileSaved = ref('')
const isPublicProfile = computed(() => Boolean(stats.value?.publicProfileToken))
const publicProfileActionLabel = computed(() => publicProfileDraft.value === isPublicProfile.value
  ? isPublicProfile.value ? 'account.publicProfileOn' : 'account.publicProfileOff'
  : publicProfileDraft.value ? 'account.makeProfilePublic' : 'account.makeProfilePrivate')
watch(() => stats.value?.publicName, value => { publicName.value = value ?? '' }, { immediate: true })
watch(isPublicProfile, value => { publicProfileDraft.value = value }, { immediate: true })
async function savePublicName() {
  profileBusy.value = true
  profileError.value = ''
  profileSaved.value = ''
  try {
    const result = await $fetch<{ publicName: string }>('/api/account/profile', { method: 'POST', body: { publicName: publicName.value } })
    publicName.value = result.publicName
    if (stats.value) stats.value.publicName = result.publicName
    profileSaved.value = t('account.publicNameSaved')
  } catch (cause: any) {
    profileError.value = cause?.statusCode === 409 ? t('account.publicNameDisableProfileFirst') : cause?.data?.statusMessage || t('account.publicNameError')
  } finally {
    profileBusy.value = false
  }
}
async function savePublicProfile() {
  publicProfileBusy.value = true
  publicProfileError.value = ''
  publicProfileSaved.value = ''
  try {
    const result = await $fetch<{ enabled: boolean; token: string | null }>('/api/account/public-profile', {
      method: 'POST',
      body: { enabled: publicProfileDraft.value },
    })
    if (stats.value) stats.value.publicProfileToken = result.token
    publicProfileDraft.value = result.enabled
    publicProfileSaved.value = t(result.enabled ? 'account.publicProfileEnabledNotice' : 'account.publicProfileDisabledNotice')
  } catch (cause: any) {
    publicProfileError.value = cause?.statusCode === 409
      ? t('account.publicProfileNeedsName')
      : cause?.data?.statusMessage || t('account.publicProfileError')
  } finally {
    publicProfileBusy.value = false
  }
}
async function logout() {
  busy.value = true
  await $fetch('/api/auth/logout', { method: 'POST' })
  await fetch()
  await navigateTo(useNuxtApp().$localePath({ name: 'account-sign-in' }))
}
</script>
