import { getPuzzleByDate, isIsoDate } from '../../../utils/puzzles'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date') ?? ''
  if (!isIsoDate(date)) {
    throw createError({ statusCode: 404, statusMessage: 'Ce puzzle n’est pas disponible.' })
  }

  const puzzle = await getPuzzleByDate(event, date)
  if (!puzzle) {
    throw createError({ statusCode: 404, statusMessage: 'Ce puzzle n’est pas disponible.' })
  }

  let imageUrl: URL
  try {
    imageUrl = new URL(puzzle.imageUrl)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'L’illustration n’est pas disponible.' })
  }

  if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'zimablue.cc' || !imageUrl.pathname.startsWith('/images/')) {
    throw createError({ statusCode: 502, statusMessage: 'L’illustration n’est pas disponible.' })
  }

  let imageResponse: Response
  try {
    imageResponse = await fetch(imageUrl, { redirect: 'manual' })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Le téléchargement de l’illustration a échoué.' })
  }

  const contentType = imageResponse.headers.get('content-type')?.split(';')[0]?.trim()
  if (!imageResponse.ok || !contentType?.startsWith('image/') || !imageResponse.body) {
    throw createError({ statusCode: 502, statusMessage: 'Le téléchargement de l’illustration a échoué.' })
  }

  const slug = puzzle.imageSlug.replace(/[^a-z0-9_-]/gi, '-') || date
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  return new Response(imageResponse.body, {
    headers: {
      'content-type': contentType,
      'content-disposition': `attachment; filename="${slug}.${extension}"`,
      'cache-control': 'public, max-age=86400, s-maxage=86400',
      'x-content-type-options': 'nosniff',
    },
  })
})
