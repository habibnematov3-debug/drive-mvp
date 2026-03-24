require('dotenv').config()

const cors = require('cors')
const express = require('express')
const authRouter = require('./src/authRouter')
const bookingsRouter = require('./src/bookingsRouter')
const { getBot } = require('./src/bot')
const { ensureHeader } = require('./src/sheets')

const app = express()
const PORT = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'drivee-backend' })
})

app.use('/auth', authRouter)
app.use('/bookings', bookingsRouter)
app.use('/requests', bookingsRouter)

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

async function start() {
  try {
    const required = [
      'BOT_TOKEN',
      'BOOKING_GROUP_ID',
      'GOOGLE_SHEET_ID',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
    ]

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`)
      }
    }

    await ensureHeader()
    console.log('[Sheets] Connected')

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`)
    })
  } catch (error) {
    console.error('[Startup] Fatal error:', error.message)
    process.exit(1)
  }
}

process.once('SIGINT', () => {
  try {
    getBot().stop('SIGINT')
  } finally {
    process.exit(0)
  }
})

process.once('SIGTERM', () => {
  try {
    getBot().stop('SIGTERM')
  } finally {
    process.exit(0)
  }
})

start()
