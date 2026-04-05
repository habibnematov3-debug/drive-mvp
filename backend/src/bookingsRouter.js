const express = require('express')
const { confirmToUser, notifyBookingGroup } = require('./bot')
const { appendBooking, listBookingsByTelegramUser } = require('./sheets')
const { requireTelegramUser } = require('./telegramAuth')
const { validateBookingInput } = require('./validation')

const router = express.Router()

router.get('/', requireTelegramUser, async (req, res) => {
  try {
    const requests = await listBookingsByTelegramUser(String(req.telegramUser.id))

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

router.post('/', requireTelegramUser, async (req, res) => {
  const validation = validateBookingInput(req.body)
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error })
  }

  const bookingData = {
    ...validation.value,
    telegram_user_id: String(req.telegramUser.id),
  }

  try {
    const bookingId = await appendBooking(bookingData)
    const warnings = []

    try {
      await notifyBookingGroup(bookingId, bookingData)
    } catch (error) {
      console.error('[Booking] Group notification failed:', error.message)
      warnings.push('booking_group_notification_failed')
    }

    try {
      await confirmToUser(bookingData.telegram_user_id, bookingId, bookingData)
    } catch (error) {
      console.error('[Booking] User confirmation failed:', error.message)
      warnings.push('user_confirmation_failed')
    }

    return res.status(201).json({
      success: true,
      booking_id: bookingId,
      buyurtma_id: bookingId,
      message: 'Arizangiz qabul qilindi',
      warnings,
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
