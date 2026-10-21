import { MAX_ATTEMPT_LENGTH } from '#shared/utils/puzzle-attempt'

export function useAccountAuthContext() {
  const route = useRoute()
  const { $localePath } = useNuxtApp()
  const returnToMaster = computed(() => route.query.returnTo === 'master')
  const puzzleDate = computed(() => typeof route.query.puzzleDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(route.query.puzzleDate) ? route.query.puzzleDate : '')
  const puzzleAttempt = computed(() => typeof route.query.attempt === 'string' && route.query.attempt.length <= MAX_ATTEMPT_LENGTH ? route.query.attempt : '')
  const accountQuery = computed(() => returnToMaster.value
    ? { returnTo: 'master' }
    : puzzleDate.value && puzzleAttempt.value ? { puzzleDate: puzzleDate.value, attempt: puzzleAttempt.value } : {})
  const gameReturnTo = computed(() => returnToMaster.value
    ? $localePath({ name: 'master' })
    : puzzleDate.value ? $localePath({ name: 'play', params: { date: puzzleDate.value } })
      : $localePath({ name: 'index' }))

  return { accountQuery, gameReturnTo, puzzleAttempt, puzzleDate, returnToMaster }
}
