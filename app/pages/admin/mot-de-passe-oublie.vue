<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink to="/admin/connexion" class="auth-back">← Retour à la connexion</NuxtLink>
      <p class="section-kicker">Récupération du compte</p>
      <h1>Mot de passe oublié</h1>
      <p class="auth-intro">Nous t’enverrons un lien valable 30 minutes si cette adresse correspond au compte.</p>
      <form v-if="!sent" class="auth-form" @submit.prevent="requestReset">
        <label>Adresse email<input v-model="email" type="email" autocomplete="email" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? 'Envoi…' : 'Envoyer le lien' }}</button>
      </form>
      <p v-else class="auth-confirmation" role="status">Si un compte actif correspond à cette adresse, un lien de réinitialisation va être envoyé.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const email = ref('')
const sent = ref(false)
const error = ref('')
const busy = ref(false)
async function requestReset() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: email.value } })
    sent.value = true
  } catch {
    error.value = 'Le service de récupération est momentanément indisponible.'
  } finally {
    busy.value = false
  }
}
</script>
