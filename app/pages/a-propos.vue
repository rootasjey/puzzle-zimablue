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
