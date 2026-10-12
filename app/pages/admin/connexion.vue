<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink to="/" class="auth-back">← Retour au jeu</NuxtLink>
      <p class="section-kicker">Espace privé</p>
      <h1>Connexion</h1>
      <p class="auth-intro">L’administration des puzzles est réservée au compte propriétaire.</p>
      <form class="auth-form" @submit.prevent="login">
        <label>Adresse email<input v-model="email" type="email" autocomplete="username" required></label>
        <label>Mot de passe<input v-model="password" type="password" autocomplete="current-password" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? 'Connexion…' : 'Se connecter' }}</button>
      </form>
      <NuxtLink class="auth-small-link" to="/admin/mot-de-passe-oublie">Mot de passe oublié ?</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const { fetch } = useUserSession()

async function login() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await fetch()
    await navigateTo('/admin/calendrier')
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'Connexion impossible. Vérifie tes identifiants.'
  } finally {
    busy.value = false
  }
}
</script>
