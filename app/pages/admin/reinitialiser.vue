<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink to="/admin/connexion" class="auth-back">← Retour à la connexion</NuxtLink>
      <p class="section-kicker">Sécurité du compte</p>
      <h1>Nouveau mot de passe</h1>
      <form class="auth-form" @submit.prevent="resetPassword">
        <label>Nouveau mot de passe<input v-model="password" type="password" autocomplete="new-password" minlength="12" required></label>
        <label>Confirmer le mot de passe<input v-model="confirmation" type="password" autocomplete="new-password" minlength="12" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="done" class="auth-confirmation" role="status">Mot de passe modifié. Tu peux te connecter.</p>
        <button class="admin-primary" :disabled="busy || done">{{ busy ? 'Enregistrement…' : 'Enregistrer le mot de passe' }}</button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
const password = ref('')
const confirmation = ref('')
const error = ref('')
const done = ref(false)
const busy = ref(false)
async function resetPassword() {
  if (password.value !== confirmation.value) { error.value = 'Les deux mots de passe ne correspondent pas.'; return }
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { token: route.query.token, password: password.value } })
    done.value = true
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'Ce lien est invalide ou expiré.'
  } finally {
    busy.value = false
  }
}
</script>
