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

  const receivedHashBuffer = Buffer.from(hash, 'hex')
  const computedHashBuffer = Buffer.from(computedHash, 'hex')

  if (
    receivedHashBuffer.length !== computedHashBuffer.length ||
    !crypto.timingSafeEqual(receivedHashBuffer, computedHashBuffer)
  ) {
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

function getInitDataFromRequest(req) {
  const headerValue = req.get('x-telegram-init-data')
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim()
  }

  const bodyValue = req.body?.initData
  if (typeof bodyValue === 'string' && bodyValue.trim()) {
    return bodyValue.trim()
  }

  return ''
}

function getDevUser(req) {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const devUserId = req.get('x-drivee-dev-user-id')
  if (!devUserId) {
    return null
  }

  return {
    id: String(devUserId).trim(),
    first_name: 'Local',
    last_name: 'Test User',
    username: 'drivee_dev',
  }
}

function requireTelegramUser(req, res, next) {
  try {
    const devUser = getDevUser(req)

    if (devUser) {
      req.telegramUser = devUser
      return next()
    }

    const { user } = verifyInitData(getInitDataFromRequest(req))
    req.telegramUser = user
    return next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Telegram authentication failed',
    })
  }
}

module.exports = { verifyInitData, requireTelegramUser }
