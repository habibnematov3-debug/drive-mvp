require('dotenv').config()

const app = require('./app')
const { getBot, startBot } = require('./src/bot')

const PORT = process.env.PORT || 3000

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
