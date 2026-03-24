const crypto = require('crypto')

const MAX_AUTH_AGE_SECONDS = 60 * 60 * 24

function buildDataCheckString(params) {
  return Array.from(params.entries())
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

function verifyInitData(initData) {
  if (typeof initData !== 'string' || !initData.trim()) {
    throw new Error('initData is required')
  }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')

  if (!hash) {
    throw new Error('initData hash is missing')
  }

  const dataCheckString = buildDataCheckString(params)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN)
    .digest()

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  if (computedHash !== hash) {
    throw new Error('initData signature is invalid')
  }

  const authDate = Number(params.get('auth_date'))

  if (!Number.isFinite(authDate)) {
    throw new Error('auth_date is missing')
  }

  const now = Math.floor(Date.now() / 1000)

  if (now - authDate > MAX_AUTH_AGE_SECONDS) {
    throw new Error('initData is expired')
  }

  const userRaw = params.get('user')

  if (!userRaw) {
    throw new Error('Telegram user is missing')
  }

  let user

  try {
    user = JSON.parse(userRaw)
  } catch {
    throw new Error('Telegram user payload is invalid')
  }

  if (!user?.id) {
    throw new Error('Telegram user id is missing')
  }

  return {
    authDate,
    user,
  }
}

module.exports = { verifyInitData }
