import { requireAdmin } from '../../utils/auth'

interface ZimablueVariant {
  size: string
  pathname: string
}

interface ZimablueImage {
  name: string
  slug: string
  pathname: string
  description?: string
  variants: string | ZimablueVariant[]
}

interface ZimablueResponse {
  data: ZimablueImage[]
  pagination: { total: number; limit: number; offset: number }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 48))
  const offset = Math.max(0, Number(query.offset) || 0)
  const response = await $fetch<ZimablueResponse>('https://zimablue.cc/api/images', {
    query: { limit, offset, fields: 'name,slug,pathname,description,variants' },
  })
  const images = Array.isArray(response.data) ? response.data : []
  return {
    nextOffset: (response.pagination?.offset ?? offset) + (response.pagination?.limit ?? limit),
    items: images.flatMap((image) => {
      const pathname = pickVariantPath(image)
      const url = publicImageUrl(pathname)
      if (!url || !image.name || !image.slug) return []
      return [{ name: image.name, slug: image.slug, url, description: typeof image.description === 'string' ? image.description.slice(0, 2000) : '' }]
    }),
    total: response.pagination?.total ?? images.length,
  }
})

function pickVariantPath(image: ZimablueImage): string {
  let variants: ZimablueVariant[] = []
  try {
    variants = typeof image.variants === 'string' ? JSON.parse(image.variants) as ZimablueVariant[] : image.variants
  } catch {
    variants = []
  }
  return variants.find(variant => variant.size === 'md')?.pathname
    ?? variants.find(variant => variant.size === 'medium')?.pathname
    ?? `${image.pathname.replace(/^\/+/, '')}/md.jpeg`
}

function publicImageUrl(pathname: string): string | null {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  try {
    const url = new URL(normalized, 'https://zimablue.cc')
    return url.hostname === 'zimablue.cc' && url.pathname.startsWith('/images/') ? url.href : null
  } catch {
    return null
  }
}
