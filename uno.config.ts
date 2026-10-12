import { presetAttributify, presetIcons, presetWind3 } from 'unocss'
import presetUna from '@una-ui/preset'
import prefixes from '@una-ui/preset/prefixes'
import extratorUna from '@una-ui/extractor-vue-script'

export default {
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({ extraProperties: { display: 'inline-block', 'vertical-align': 'middle' } }),
    presetUna(),
  ],
  extractors: [extratorUna({ prefixes })],
  shortcuts: {
    'page-wrap': 'mx-auto w-full max-w-6xl px-5 sm:px-8',
    'soft-link': 'text-slate-600 transition-colors hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700',
  },
}
