<template>
  <main class="page-wrap about-page">
    <NuxtLink class="soft-link back-link" :to="$localePath({ name: 'index' })">{{ t('about.back') }}</NuxtLink>
    <header class="about-intro">
      <p class="section-kicker">{{ t('about.kicker') }}</p>
      <h1>{{ t('about.title') }}</h1>
      <p class="about-lede">{{ t('about.intro') }}</p>
    </header>

    <div class="about-content">
      <div class="about-story">
        <section class="about-section">
          <h2>{{ t('about.originTitle') }}</h2>
          <p>{{ t('about.origin') }}</p>
          <p class="about-thanks">{{ t('about.thanks') }}</p>
        </section>
        <section class="about-section">
          <h2>{{ t('about.feedbackTitle') }}</h2>
          <p>{{ t('about.feedback') }}</p>
          <div class="about-contact-links">
            <a :href="issuesUrl" target="_blank" rel="noopener noreferrer">{{ t('about.openIssue') }} <span aria-hidden="true">↗</span></a>
            <a href="mailto:puzzle@zimablue.cc">{{ t('about.email') }}</a>
          </div>
        </section>
        <section class="about-section">
          <h2>{{ t('about.rightsTitle') }}</h2>
          <p>
            {{ t('about.codeLicense') }}
            <a :href="licenseUrl" target="_blank" rel="noopener noreferrer">{{ t('about.readLicense') }} <span aria-hidden="true">↗</span></a>
          </p>
          <p>{{ t('about.artRights') }}</p>
        </section>
      </div>

      <aside class="about-socials" aria-labelledby="about-socials-title">
        <h2 id="about-socials-title">{{ t('about.socialsTitle') }}</h2>
        <ul>
          <li v-for="social in socialLinks" :key="social.label">
            <a :href="social.href" target="_blank" rel="noopener noreferrer">
              <span>{{ social.label }}</span>
              <strong>{{ social.handle }}</strong>
              <span class="about-social-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        </ul>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ name: 'about' })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/about' } })
const { $localePath, $t } = useI18n()
const t = (key: string): string => String($t(key as any) ?? '')
const issuesUrl = 'https://github.com/rootasjey/puzzle-zimablue/issues/new'
const licenseUrl = 'https://github.com/rootasjey/puzzle-zimablue/blob/main/LICENSE'
const socialLinks = [
  { label: 'GitHub', handle: 'rootasjey', href: 'https://github.com/rootasjey' },
  { label: 'Bluesky', handle: '@corpinot.bsky.social', href: 'https://bsky.app/profile/corpinot.bsky.social' },
  { label: 'Threads', handle: '@rootasjey', href: 'https://www.threads.com/@rootasjey' },
  { label: 'Instagram', handle: '@rootasjey', href: 'https://www.instagram.com/rootasjey/' },
  { label: 'LinkedIn', handle: 'Jérémie Corpinot', href: 'https://www.linkedin.com/in/jeremiecorpinot' },
]
usePageSeo({ title: () => t('about.seoTitle'), description: () => t('about.description') })
</script>

<style>
.about-page { flex: 1; padding-top: clamp(2rem, 5vw, 3.7rem); padding-bottom: 5rem; }
.about-intro { max-width: 760px; margin-bottom: clamp(2.5rem, 6vw, 4.5rem); }
.about-intro .section-kicker { margin-bottom: .45rem; }
.about-intro h1 { max-width: 13ch; font-size: clamp(2.7rem, 6vw, 4.5rem); font-weight: 850; line-height: 1.03; }
.about-lede { max-width: 47ch; margin: 1.1rem 0 0; color: var(--muted); font-size: clamp(1.05rem, 2vw, 1.2rem); line-height: 1.65; }
.about-content { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(230px, .65fr); align-items: start; gap: clamp(2rem, 7vw, 6rem); }
.about-story { max-width: 660px; }
.about-section + .about-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line-divider); }
.about-section h2, .about-socials h2 { margin: 0 0 .65rem; font-size: clamp(1.15rem, 2vw, 1.4rem); font-weight: 850; letter-spacing: -.04em; }
.about-section p { max-width: 65ch; margin: .55rem 0 0; color: var(--muted); font-size: .92rem; line-height: 1.75; }
.about-section a { color: var(--blue); font-weight: 750; text-underline-offset: .2rem; }
.about-thanks { margin-top: 1.15rem !important; padding: .85rem 1rem; border-left: 4px solid var(--yellow); background: color-mix(in srgb, var(--yellow) 22%, var(--white)); color: var(--ink) !important; font-weight: 750; }
.about-contact-links { display: flex; flex-wrap: wrap; gap: .6rem 1.4rem; margin-top: .9rem; font-size: .84rem; }
.about-socials { padding-left: clamp(1.2rem, 3vw, 2.2rem); border-left: 2px solid var(--ink); }
.about-socials ul { display: grid; margin: 0; padding: 0; list-style: none; }
.about-socials li { border-bottom: 1px solid var(--line); }
.about-socials li:first-child { border-top: 1px solid var(--line); }
.about-socials a { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .2rem .7rem; min-height: 3.4rem; padding: .55rem .1rem; color: var(--ink); text-decoration: none; }
.about-socials a > span:first-child { color: var(--muted); font-size: .72rem; font-weight: 700; }
.about-socials a strong { grid-column: 1; font-size: .84rem; font-weight: 800; overflow-wrap: anywhere; }
.about-social-arrow { grid-column: 2; grid-row: 1 / span 2; color: var(--blue); font-weight: 800; }
.about-socials a:hover strong { color: var(--blue); }
.about-socials a:focus-visible, .about-contact-links a:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
@media (max-width: 760px) {
  .about-content { grid-template-columns: 1fr; gap: 2.5rem; }
  .about-socials { padding: 1.4rem 0 0; border-top: 2px solid var(--ink); border-left: 0; } }
</style>
