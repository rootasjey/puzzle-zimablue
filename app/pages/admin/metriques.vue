<template>
  <main class="admin-page admin-metrics-page">
    <header class="admin-topline">
      <div class="admin-metrics-heading">
        <NuxtLink class="auth-back" :to="$localePath({ name: 'admin-calendar' })">{{ t('admin.backToCalendar') }}</NuxtLink>
        <h1>{{ t('admin.metricsTitle') }}</h1>
        <p>{{ t('admin.metricsDescription', { count: metricsPeriodDays }) }}</p>
      </div>
      <NuxtLink class="admin-secondary admin-metrics-calendar-link" :to="$localePath({ name: 'admin-calendar' })">{{ t('admin.calendarTitle') }}</NuxtLink>
    </header>

    <div v-if="error" class="admin-alert" role="alert">{{ t('admin.metricsError') }}</div>
    <div v-else-if="pending" class="page-loading-state" aria-busy="true"><BrandLoader :label="t('admin.loading')" /></div>
    <template v-else-if="data">
      <section class="metrics-summary" :aria-label="t('admin.metricsSummary')">
        <article>
          <strong>{{ data.totals.activePlayers }}</strong>
          <span>{{ t('admin.metricsActivePlayers') }}</span>
        </article>
        <article>
          <strong>{{ data.totals.completions }}</strong>
          <span>{{ t('admin.metricsCompleted') }}</span>
        </article>
        <article>
          <strong>{{ data.totals.averageMoves === null ? '—' : formatNumber(data.totals.averageMoves) }}</strong>
          <span>{{ t('admin.metricsAverage') }}</span>
        </article>
      </section>

      <section class="metrics-section" aria-labelledby="metrics-chart-title">
        <div class="metrics-section-heading">
          <div>
            <h2 id="metrics-chart-title">{{ t('admin.metricsDailyTitle') }}</h2>
            <p>{{ formatDate(data.period.startDate) }} – {{ formatDate(data.period.endDate) }}</p>
          </div>
          <span>{{ t('admin.metricsCompletions') }}</span>
        </div>
        <div
          class="metrics-chart"
          role="img"
          :aria-label="t('admin.metricsChartAlt', { count: data.totals.completions, days: metricsPeriodDays })"
        >
          <div class="metrics-bars" aria-hidden="true">
            <span
              v-for="day in data.days"
              :key="day.date"
              class="metrics-bar-track"
              :title="t('admin.metricsBarTitle', { date: formatDate(day.date), count: day.completions })"
            >
              <span
                class="metrics-bar"
                :class="{ 'is-peak': day.completions > 0 && day.completions === maxCompletions }"
                :style="{ height: barHeight(day.completions) }"
              />
            </span>
          </div>
          <div class="metrics-chart-axis" aria-hidden="true">
            <span>{{ formatDate(data.period.startDate) }}</span>
            <span>{{ formatDate(data.period.endDate) }}</span>
          </div>
        </div>
      </section>

      <section class="metrics-section metrics-daily-section" aria-labelledby="metrics-days-title">
        <div class="metrics-section-heading">
          <h2 id="metrics-days-title">{{ t('admin.metricsDailyScores') }}</h2>
          <span>{{ t('admin.metricsVerifiedOnly') }}</span>
        </div>
        <p class="metrics-data-note">{{ t('admin.metricsDataNote') }}</p>
        <div v-if="activeDays.length" class="metrics-table-wrap">
          <table class="metrics-table">
            <thead>
              <tr>
                <th scope="col">{{ t('admin.metricsDate') }}</th>
                <th scope="col">{{ t('admin.metricsCompletedShort') }}</th>
                <th scope="col">{{ t('admin.metricsPlayersShort') }}</th>
                <th scope="col">{{ t('admin.metricsAverageShort') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in activeDays" :key="day.date">
                <th scope="row">{{ formatDate(day.date) }}</th>
                <td>{{ day.completions }}</td>
                <td>{{ day.players }}</td>
                <td>{{ day.averageMoves === null ? '—' : formatNumber(day.averageMoves) + ' / ' + day.bestMoves }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="metrics-empty">{{ t('admin.metricsEmpty') }}</p>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { formatPuzzleDate } from '#shared/types/puzzle'

interface MetricsPayload {
  period: { startDate: string; endDate: string; days: number }
  totals: { activePlayers: number; completions: number; verifiedScores: number; averageMoves: number | null }
  days: { date: string; completions: number; players: number; verifiedScores: number; averageMoves: number | null; bestMoves: number | null }[]
}

const metricsPeriodDays = 30
definePageMeta({ name: 'admin-metrics', middleware: 'admin' })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/metrics' } })
const { $getLocale, $localePath, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const locale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const { data, error, pending } = await useFetch<MetricsPayload>('/api/admin/metrics', { key: 'admin-metrics' })
const activeDays = computed(() => data.value?.days.filter(day => day.completions > 0) ?? [])
const maxCompletions = computed(() => Math.max(0, ...(data.value?.days.map(day => day.completions) ?? [])))
const formatDate = (date: string) => formatPuzzleDate(date, { day: 'numeric', month: 'short' }, locale.value)
const formatNumber = (value: number) => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value)
const barHeight = (count: number) => {
  if (!count || !maxCompletions.value) return '0%'
  return Math.max(8, count / maxCompletions.value * 100) + '%'
}
usePageSeo({ title: () => t('admin.metricsSeoTitle'), description: () => t('admin.metricsDescription', { count: metricsPeriodDays }) })
</script>

<style>
.admin-metrics-heading > p { margin: .7rem 0 0; color: var(--muted); font-size: .86rem; }
.admin-metrics-page > .admin-topline { align-items: center; }
.admin-metrics-calendar-link { color: var(--yellow-foreground); text-decoration: none; }
.admin-metrics-calendar-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.metrics-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 2rem 0 2.5rem; border-block: 2px solid var(--ink); }
.metrics-summary article { display: grid; min-width: 0; min-height: 112px; align-content: center; justify-items: start; gap: .45rem; padding: 1rem clamp(.75rem, 2vw, 1.5rem); }
.metrics-summary article + article { border-left: 2px solid var(--ink); }
.metrics-summary strong { color: var(--blue); font-size: clamp(1.7rem, 4vw, 2.5rem); font-weight: 900; line-height: 1; }
.metrics-summary span { color: var(--muted); font-size: .78rem; font-weight: 700; line-height: 1.4; }
.metrics-section { margin-top: 2rem; padding-top: 1.35rem; border-top: 2px solid var(--ink); }
.metrics-section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.metrics-section-heading h2 { font-size: clamp(1.15rem, 2.2vw, 1.5rem); font-weight: 850; letter-spacing: -.04em; }
.metrics-section-heading p, .metrics-section-heading > span { margin: .35rem 0 0; color: var(--muted); font-size: .75rem; font-weight: 700; }
.metrics-chart { padding: 1.15rem .8rem .7rem; border: 2px solid var(--ink); background: var(--white); box-shadow: 4px 4px 0 var(--ink); }
.metrics-bars { display: grid; height: 142px; grid-template-columns: repeat(30, minmax(0, 1fr)); align-items: end; gap: clamp(2px, .35vw, 5px); border-bottom: 1px solid var(--line-divider); }
.metrics-bar-track { display: flex; height: 100%; align-items: end; justify-content: center; background: color-mix(in srgb, var(--blue) 7%, var(--white)); }
.metrics-bar { display: block; width: 100%; max-width: 18px; background: var(--blue); }
.metrics-bar.is-peak { background: var(--yellow); }
.metrics-chart-axis { display: flex; justify-content: space-between; gap: 1rem; padding-top: .55rem; color: var(--muted); font-size: .7rem; font-weight: 700; }
.metrics-data-note { max-width: 80ch; margin: -.25rem 0 1rem; color: var(--muted); font-size: .77rem; line-height: 1.55; }
@media (max-width: 600px) {
  .admin-metrics-page > .admin-topline { align-items: stretch; }
  .admin-metrics-calendar-link { width: fit-content; }
  .metrics-summary article { min-height: 96px; padding-inline: .7rem; }
  .metrics-summary span { font-size: .69rem; }
  .metrics-section-heading { align-items: flex-start; flex-direction: column; gap: .25rem; } }
@media (max-width: 470px) {
  .metrics-summary strong { font-size: 1.5rem; }
  .metrics-summary span { font-size: .64rem; } }
</style>
