<template>
  <header class="account-section-header">
    <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
    <nav class="account-section-nav" :aria-label="t('account.sectionNavigation')">
      <NuxtLink :to="$localePath({ name: 'account' })" :aria-current="isCurrent('account') ? 'page' : undefined">{{ t('account.progressTab') }}</NuxtLink>
      <NuxtLink :to="$localePath({ name: 'account-settings' })" :aria-current="isCurrent('account-settings') ? 'page' : undefined">{{ t('settings.title') }}</NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const { $localePath, $t } = useI18n()
const t = (key: string): string => String($t(key as any) ?? '')

function isCurrent(name: 'account' | 'account-settings') {
  return route.path === $localePath({ name })
}
</script>

<style scoped>
.account-section-header {
  position: sticky;
  z-index: 20;
  top: 0;
  width: min(calc(100% - 2.4rem), 850px);
  margin: 0 auto;
  padding-top: 2rem;
  background: var(--paper);
}

.account-section-nav {
  display: flex;
  gap: 1.35rem;
  margin: .45rem 0 1.7rem;
  border-bottom: 1px solid var(--line-divider);
}

.account-section-nav a {
  display: inline-flex;
  min-height: 2.7rem;
  align-items: center;
  margin-bottom: -1px;
  border-bottom: 3px solid transparent;
  color: var(--muted);
  font-size: .88rem;
  font-weight: 750;
  text-decoration: none;
  transition: color .15s ease, border-color .15s ease;
}

.account-section-nav a:hover,
.account-section-nav a[aria-current="page"] {
  color: var(--ink);
}

.account-section-nav a[aria-current="page"] {
  border-color: var(--blue);
}

.account-section-nav a:focus-visible {
  outline: 3px solid var(--coral);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .account-section-header {
    width: calc(100% - 2.4rem);
  }
}
</style>
