const express = require('express')
const { confirmToUser, notifyBookingGroup } = require('./bot')
const { appendBooking, listBookingsByTelegramUser } = require('./sheets')
const { validateBookingInput } = require('./validation')

const router = express.Router()

router.get('/', async (req, res) => {
  const telegramUserId = req.query.telegram_user_id || req.query.telegramUserId

  if (!telegramUserId) {
    return res.status(400).json({
      success: false,
      error: 'telegram_user_id query parameter is required',
    })
  }

  try {
    const requests = await listBookingsByTelegramUser(telegramUserId)

    return res.json({
      success: true,
      requests,
    })
  } catch (error) {
    console.error('[Booking] Error fetching bookings:', error.message)
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again.',
    })
  }
})

router.post('/', async (req, res) => {
  const validation = validateBookingInput(req.body)
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error })
  }

  const bookingData = validation.value

  try {
    const bookingId = await appendBooking(bookingData)
    await notifyBookingGroup(bookingId, bookingData)

    if (bookingData.telegram_user_id) {
      await confirmToUser(bookingData.telegram_user_id, bookingId, bookingData)
    }

    return res.status(201).json({
      success: true,
      booking_id: bookingId,
      buyurtma_id: bookingId,
      message: 'Arizangiz qabul qilindi',
    })
  } catch (error) {
    console.error('[Booking] Error processing booking:', error.message)
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again.',
    })
  }
})

module.exports = router
