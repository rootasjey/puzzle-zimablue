<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink to="/" class="auth-back">← Retour au jeu</NuxtLink>
      <p class="section-kicker">Première configuration</p>
      <h1>Créer le compte admin</h1>
      <p v-if="!available" class="auth-intro">La configuration initiale n’est plus disponible. Connecte-toi avec le compte administrateur.</p>
      <template v-else>
        <p class="auth-intro">Le compte autorisé est défini dans la configuration locale. Choisis un mot de passe d’au moins 12 caractères.</p>
        <form class="auth-form" @submit.prevent="setup">
          <label>Email du propriétaire<input v-model="email" type="email" autocomplete="username" required></label>
          <label>Clé de configuration<input v-model="setupKey" type="password" autocomplete="off" required></label>
          <label>Mot de passe<input v-model="password" type="password" autocomplete="new-password" minlength="12" required></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="admin-primary" :disabled="busy">{{ busy ? 'Création…' : 'Créer mon compte admin' }}</button>
        </form>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const email = ref('')
const setupKey = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const { data } = await useFetch<{ available: boolean }>('/api/auth/setup-status')
const available = computed(() => data.value?.available === true)

async function setup() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/setup', { method: 'POST', body: { email: email.value, setupKey: setupKey.value, password: password.value } })
    await navigateTo('/admin/calendrier')
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'La création du compte a échoué.'
  } finally {
    busy.value = false
  }
}
</script>
