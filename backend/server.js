require('dotenv').config()

const app = require('./app')
const { getBot, startBot } = require('./src/bot')

const PORT = process.env.PORT || 3000

function startKeepAlivePing() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[KeepAlive] Disabled (not in production)')
    return
  }

  const serviceUrl = process.env.SERVICE_URL || 'https://drive-mvp-1.onrender.com'
  const healthEndpoint = `${serviceUrl}/health`
  const pingIntervalMs = 10 * 60 * 1000 // 10 minutes

  console.log(`[KeepAlive] Starting ping every 10 minutes to ${healthEndpoint}`)

  setInterval(() => {
    fetch(healthEndpoint)
      .then((res) => {
        if (res.ok) {
          console.log('[KeepAlive] Pinged successfully')
        } else {
          console.warn(`[KeepAlive] Ping returned ${res.status}`)
        }
      })
      .catch((err) => {
        console.error('[KeepAlive] Ping failed:', err.message)
      })
  }, pingIntervalMs)
}

function start() {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server started on port ${PORT}`)
    })

    app.getStartupPromise().catch((error) => {
      console.error('[Startup] Background initialization failed:', error.message)
    })

    startBot().catch((error) => {
      console.error('[Bot] Launch failed:', error.message)
    })

    startKeepAlivePing()
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
