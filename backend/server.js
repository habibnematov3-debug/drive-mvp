require('dotenv').config()

const app = require('./app')
const { getBot } = require('./src/bot')

const PORT = Number(process.env.PORT || 3000)

async function start() {
  try {
    await app.getStartupPromise()

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
