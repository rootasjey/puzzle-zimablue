import { getDatabase, getWorkerBindings } from '../../utils/cloudflare'
import { consumeRateLimit, createOpaqueToken, normalizeEmail, sha256Hex } from '../../utils/auth'
import { createDailyPuzzleId, verifyPuzzleAttempt } from '#shared/utils/puzzle-attempt'

export default defineEventHandler(async (event) => {
  if (!useRuntimeConfig(event).public.registrationEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Inscription indisponible.' })
  }
  const body = await readBody<{ email?: unknown; password?: unknown; puzzleDate?: unknown; attempt?: unknown; moves?: unknown; locale?: unknown }>(event)
  if (typeof body?.email !== 'string' || body.email.length > 254 || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'Adresse ou mot de passe invalide.' })
  }

  const email = normalizeEmail(body.email)
  if (!email.includes('@') || !await consumeRateLimit(event, 'register', email, 4)) {
    throw createError({ statusCode: 429, statusMessage: 'Inscription temporairement indisponible. Réessaie plus tard.' })
  }
  if (await getUserSession(event).then(session => Boolean(session.user))) {
    throw createError({ statusCode: 409, statusMessage: 'Une session est déjà ouverte.' })
  }

  let puzzleDate: string | null = null
  let moves: number | null = null
  let scoreVerified = 0
  if (body.puzzleDate !== undefined || body.attempt !== undefined || body.moves !== undefined) {
    if (typeof body.puzzleDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.puzzleDate)) {
      throw createError({ statusCode: 400, statusMessage: 'Résultat de puzzle invalide.' })
    }
    puzzleDate = body.puzzleDate
  }

  const database = getDatabase(event)
  await database.prepare('DELETE FROM email_verification_tokens WHERE used_at IS NOT NULL OR expires_at <= ?').bind(new Date().toISOString()).run()
  if (puzzleDate) {
    const puzzle = await database.prepare("SELECT grid_rows, grid_columns FROM puzzles WHERE date = ? AND status = 'published'")
      .bind(puzzleDate)
      .first<{ grid_rows: number; grid_columns: number }>()
    if (!puzzle) throw createError({ statusCode: 400, statusMessage: 'Puzzle introuvable.' })
    moves = verifyPuzzleAttempt({ puzzleId: createDailyPuzzleId(puzzleDate), gridRows: puzzle.grid_rows, gridColumns: puzzle.grid_columns }, body.attempt)
    if (moves === null) throw createError({ statusCode: 400, statusMessage: 'Résultat de puzzle invalide.' })
    scoreVerified = 1
  }
  const existing = await database.prepare('SELECT email_verified_at FROM users WHERE email = ?').bind(email).first<{ email_verified_at: string | null }>()
  if (existing) {
    return { ok: true, message: 'Si cette adresse peut recevoir une vérification, un lien va lui être envoyé.' }
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const userId = crypto.randomUUID()
  const verificationToken = createOpaqueToken()
  const locale = body.locale === 'en' ? 'en' : 'fr'
  const passwordHash = await hashPassword(body.password)
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const result = await database.batch([
    database.prepare("INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, 'user', ?, ?)")
      .bind(userId, email, passwordHash, nowIso, nowIso),
    database.prepare('INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, pending_puzzle_date, pending_moves, pending_score_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), userId, await sha256Hex(verificationToken), expiresAt, puzzleDate, moves, scoreVerified, nowIso),
  ])
  if (result[0]?.meta.changes !== 1 || result[1]?.meta.changes !== 1) {
    throw createError({ statusCode: 409, statusMessage: 'Impossible de créer le compte.' })
  }

  const config = useRuntimeConfig(event)
  const verificationUrl = `${String(config.public.siteUrl).replace(/\/$/, '')}${locale === 'en' ? '/en/account/verify' : '/compte/verifier'}?token=${encodeURIComponent(verificationToken)}`
  const emailBinding = getWorkerBindings(event).EMAIL
  if (!emailBinding) {
    await database.batch([
      database.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').bind(userId),
      database.prepare('DELETE FROM users WHERE id = ? AND email_verified_at IS NULL').bind(userId),
    ])
    throw createError({ statusCode: 503, statusMessage: 'Le service email est temporairement indisponible.' })
  }
  try {
    await emailBinding.send({
      from: { email: String(config.emailFrom), name: 'Puzzle Zimablue' },
      to: email,
      subject: locale === 'en' ? 'Verify your Puzzle Zimablue account' : 'Confirme ton compte Puzzle Zimablue',
      text: locale === 'en'
        ? `Verify your email to save your puzzle progress across devices: ${verificationUrl}\n\nThis link expires in 24 hours.`
        : `Confirme ton adresse et retrouve ta progression sur tous tes appareils : ${verificationUrl}\n\nCe lien expire dans 24 heures.`,
      html: locale === 'en'
        ? `<p>Verify your email to save your puzzle progress across devices.</p><p><a href="${verificationUrl}">Verify my email</a></p><p>This link expires in 24 hours.</p>`
        : `<p>Confirme ton adresse et retrouve ta progression sur tous tes appareils.</p><p><a href="${verificationUrl}">Confirmer mon adresse</a></p><p>Ce lien expire dans 24 heures.</p>`,
    })
  } catch (error) {
    console.error('Account verification email could not be queued.', error)
    await database.batch([
      database.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').bind(userId),
      database.prepare('DELETE FROM users WHERE id = ? AND email_verified_at IS NULL').bind(userId),
    ])
    throw createError({ statusCode: 503, statusMessage: 'Le service email est temporairement indisponible.' })
  }

  return { ok: true, message: 'Vérifie ta boîte email pour confirmer ton adresse.' }
})
