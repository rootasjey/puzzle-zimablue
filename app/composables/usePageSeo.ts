import type { MaybeRefOrGetter } from 'vue'

type PageSeoOptions = {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
}

export function usePageSeo(options: PageSeoOptions) {
  useSeoMeta({
    title: options.title,
    description: options.description,
  })
}
