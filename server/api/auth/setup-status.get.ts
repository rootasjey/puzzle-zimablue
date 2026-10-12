import { getDatabase } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  const setting = await getDatabase(event)
    .prepare("SELECT value FROM app_settings WHERE key = 'admin_bootstrap_complete'")
    .first<{ value: string }>()
  const admin = await getDatabase(event)
    .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    .first<{ id: string }>()
  return { available: setting?.value === '0' && !admin }
})
