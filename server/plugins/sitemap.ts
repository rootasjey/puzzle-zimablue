import { getPublishedPuzzles, isIsoDate } from '../utils/puzzles'

const baseUrl = 'https://puzzle.zimablue.cc'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('sitemap:sources', async ({ sources, event }) => {
    const puzzles = await getPublishedPuzzles(event)
    const urls = puzzles.filter(puzzle => isIsoDate(puzzle.date)).flatMap((puzzle) => {
      const frenchUrl = `${baseUrl}/jouer/${puzzle.date}`
      const englishUrl = `${baseUrl}/en/play/${puzzle.date}`
      const alternatives = [
        { hreflang: 'fr-FR', href: frenchUrl },
        { hreflang: 'en-US', href: englishUrl },
        { hreflang: 'x-default', href: frenchUrl },
      ]

      return [
        { loc: frenchUrl, alternatives },
        { loc: englishUrl, alternatives },
      ]
    })

    sources.push({ context: { name: 'published-puzzles' }, urls })
  })
})
