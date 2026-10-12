import { getDatabase, getWorkerBindings } from '../../utils/cloudflare'
import { consumeRateLimit, createOpaqueToken, normalizeEmail, sha256Hex } from '../../utils/auth'

interface UserRow {
  id: string
  email: string
}

const genericResponse = {
  ok: true,
  message: 'Si un compte actif correspond à cette adresse, un lien de réinitialisation va être envoyé.',
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown }>(event)
  if (typeof body?.email !== 'string' || body.email.length > 254) return genericResponse
  const email = normalizeEmail(body.email)
  if (!email.includes('@') || !await consumeRateLimit(event, 'password-reset', email, 4)) return genericResponse

  const database = getDatabase(event)
  const user = await database.prepare("SELECT id, email FROM users WHERE email = ? AND disabled_at IS NULL")
    .bind(email)
    .first<UserRow>()
  if (!user) return genericResponse

  const token = createOpaqueToken()
  const tokenHash = await sha256Hex(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString()
  await database.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL')
    .bind(now.toISOString(), user.id)
    .run()
  await database.prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), user.id, tokenHash, expiresAt, now.toISOString())
    .run()

  const config = useRuntimeConfig(event)
  const baseUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const resetUrl = `${baseUrl}/admin/reinitialiser?token=${encodeURIComponent(token)}`
  const emailBinding = getWorkerBindings(event).EMAIL
  try {
    if (!emailBinding) throw new Error('The EMAIL binding is not configured.')
    await emailBinding.send({
      from: String(config.emailFrom),
      to: user.email,
      subject: 'Réinitialiser le mot de passe de Puzzle Zimablue',
      text: `Pour choisir un nouveau mot de passe, ouvre ce lien (valable 30 minutes) : ${resetUrl}\n\nSi tu n’as pas demandé cette réinitialisation, ignore ce message.`,
      html: `<p>Pour choisir un nouveau mot de passe, ouvre ce lien (valable 30 minutes) :</p><p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p><p>Si tu n’as pas demandé cette réinitialisation, ignore ce message.</p>`,
    })
  } catch (error) {
    // In local Wrangler development, the simulated Email binding logs the message without sending it.
    console.error('Password reset email could not be queued.', error)
  }
  return genericResponse
})
