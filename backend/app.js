require('dotenv').config()

const cors = require('cors')
const express = require('express')
const authRouter = require('./src/authRouter')
const bookingsRouter = require('./src/bookingsRouter')
const { ensureHeader } = require('./src/sheets')

const REQUIRED_ENV_KEYS = [
  'BOT_TOKEN',
  'BOOKING_GROUP_ID',
  'GOOGLE_SHEET_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
]

const app = express()

let startupPromise = null

function validateEnvironment() {
  for (const key of REQUIRED_ENV_KEYS) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}

async function initializeApp() {
  validateEnvironment()
  await ensureHeader()
  console.log('[Sheets] Connected')
}

function getStartupPromise() {
  if (!startupPromise) {
    startupPromise = initializeApp()
  }

  return startupPromise
}

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', async (_req, res) => {
  try {
    await getStartupPromise()
    res.json({ status: 'ok', service: 'drivee-backend' })
  } catch (error) {
    console.error('[Health] Startup check failed:', error.message)
    res.status(500).json({
      status: 'error',
      service: 'drivee-backend',
      error: error.message || 'Startup failed',
    })
  }
})

app.use(async (_req, _res, next) => {
  try {
    await getStartupPromise()
    next()
  } catch (error) {
    next(error)
  }
})

app.use('/auth', authRouter)
app.use('/bookings', bookingsRouter)
app.use('/requests', bookingsRouter)

app.use((error, _req, res, _next) => {
  console.error('[Server] Unhandled error:', error.message)
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
  })
})

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

module.exports = app
module.exports.getStartupPromise = getStartupPromise
