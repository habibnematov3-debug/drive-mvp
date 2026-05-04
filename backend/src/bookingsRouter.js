const crypto = require('crypto')
const express = require('express')
const {
  confirmToUser,
  handleCancelledBooking,
  notifyBookingGroup,
} = require('./bot')
const {
  appendBooking,
  cancelBooking,
  listBookingsByTelegramUser,
} = require('./sheets')
const { requireTelegramUser } = require('./telegramAuth')
const { validateBookingInput } = require('./validation')

const router = express.Router()

router.get('/', requireTelegramUser, async (req, res) => {
  try {
    const telegramUserId = String(req.telegramUser.id)
    const requests = await listBookingsByTelegramUser(telegramUserId)
    const payload = {
      success: true,
      requests,
    }
    const etag = `"${crypto
      .createHash('sha1')
      .update(JSON.stringify(payload))
      .digest('hex')}"`

    res.set('Cache-Control', 'private, no-cache, max-age=0')
    res.set('Vary', 'X-Telegram-Init-Data, X-Drivee-Dev-User-Id')
    res.set('ETag', etag)

    if (req.get('if-none-match') === etag) {
      return res.status(304).end()
    }

    return res.json(payload)
  } catch (error) {
    console.error('[Booking] Error fetching bookings:', error.message)
    return res.status(500).json({
      success: false,
      error: "Arizalarni yuklab bo'lmadi. Qayta urinib ko'ring.",
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

router.delete('/:id', requireTelegramUser, async (req, res) => {
  const bookingId = String(req.params.id || '').trim()

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      error: "Ariza ID topilmadi",
    })
  }

  try {
    const cancelResult = await cancelBooking(bookingId, String(req.telegramUser.id))

    if (!cancelResult.ok) {
      if (cancelResult.reason === 'forbidden') {
        return res.status(403).json({
          success: false,
          error: "Bu ariza sizga tegishli emas",
        })
      }

      if (cancelResult.reason === 'already_confirmed') {
        return res.status(409).json({
          success: false,
          error: "Tasdiqlangan arizani bekor qilib bo'lmaydi",
        })
      }

      if (cancelResult.reason === 'already_completed') {
        return res.status(409).json({
          success: false,
          error: "Tugallangan arizani bekor qilib bo'lmaydi",
        })
      }

      if (cancelResult.reason === 'already_cancelled') {
        return res.status(409).json({
          success: false,
          error: "Bu ariza allaqachon bekor qilingan",
        })
      }

      if (cancelResult.reason === 'not_found') {
        return res.status(404).json({
          success: false,
          error: 'Ariza topilmadi',
        })
      }

      return res.status(409).json({
        success: false,
        error: "Bu arizani bekor qilib bo'lmaydi",
      })
    }

    const warnings = await handleCancelledBooking(cancelResult.booking)

    return res.json({
      success: true,
      booking_id: cancelResult.booking.bookingId,
      message: 'Ariza bekor qilindi',
      warnings,
    })
  } catch (error) {
    console.error('[Booking] Error cancelling booking:', error.message)
    return res.status(500).json({
      success: false,
      error: "Serverda xatolik yuz berdi. Qayta urinib ko'ring.",
    })
  }
})

module.exports = router
