const express = require('express')
const { upsertTelegramUser } = require('./sheets')
const { verifyInitData } = require('./telegramAuth')

const router = express.Router()

router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body || {}
    const { user } = verifyInitData(initData)

    await upsertTelegramUser(user)

    return res.json({
      success: true,
      user,
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Telegram authentication failed',
    })
  }
})

module.exports = router
