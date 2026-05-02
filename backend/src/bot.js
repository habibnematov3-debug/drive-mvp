const { Markup, Telegraf } = require('telegraf')
const {
  claimBooking,
  getDriverByTelegramId,
  registerDriver,
  storeBookingGroupMessage,
} = require('./sheets')

let bot = null
let botStarted = false
let botHandlersAttached = false
const driverRegistrationSessions = new Map()
const PHONE_REGEX = /^\+998\d{9}$/

function getBot() {
  if (!bot) {
    bot = new Telegraf(process.env.BOT_TOKEN)
    attachBotHandlers(bot)
  }

  return bot
}

function getDriverDisplayName(user) {
  if (!user) return 'Haydovchi'
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return fullName || user.username || 'Haydovchi'
}

function formatDate(isoDate) {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${isoDate}T00:00:00`))
  } catch {
    return isoDate
  }
}

function formatGenderLabel(passengerGender) {
  if (passengerGender === 'male') return 'Erkak'
  if (passengerGender === 'female') return 'Ayol'
  return "Farqi yo'q"
}

function buildGroupMessage(bookingId, data, options = {}) {
  const lines = [
    `Yangi ariza #${bookingId}`,
    '',
    `Yo'nalish: ${data.route}`,
    `Sana: ${formatDate(data.date)}`,
    `Vaqt: ${data.time}`,
    `Joylar soni: ${data.seats}`,
    `To'liq mashina: ${data.full_car ? 'ha' : "yo'q"}`,
  ]

  if (data.passenger_gender && data.passenger_gender !== 'any') {
    lines.push(`Mijoz jinsi: ${formatGenderLabel(data.passenger_gender)}`)
  }

  if (data.passenger_name) {
    lines.push(`Mijoz ismi: ${data.passenger_name}`)
  }

  if (data.passenger_phone) {
    lines.push(`Telefon: ${data.passenger_phone}`)
  }

  lines.push(`Izoh: ${data.comment || '-'}`)
  lines.push(`Holat: ${options.taken ? '🚗 Olindi' : 'yangi'}`)

  if (options.taken && options.driver) {
    lines.push(`Haydovchi: ${options.driver.name}`)
    lines.push(`Telefon: ${options.driver.phone}`)

    if (options.driver.carModel) {
      lines.push(`Mashina: ${options.driver.carModel}`)
    }
  }

  return lines.join('\n')
}

function buildUserConfirmation(bookingId, data) {
  const lines = [
    'Arizangiz qabul qilindi',
    '',
    `Yo'nalish: ${data.route}`,
    `Sana: ${formatDate(data.date)}`,
    `Vaqt: ${data.time}`,
    '',
    'Tez orada sizga mos haydovchini topib, tasdiqlaymiz.',
    `Ariza ID: #${bookingId}`,
  ]

  return lines.join('\n')
}

async function notifyBookingGroup(bookingId, bookingData) {
  const chatId = process.env.BOOKING_GROUP_ID
  const text = buildGroupMessage(bookingId, bookingData)
  const message = await getBot().telegram.sendMessage(
    chatId,
    text,
    Markup.inlineKeyboard([
      Markup.button.callback('✅ Olish', `take_booking:${bookingId}`),
    ]),
  )

  await storeBookingGroupMessage(bookingId, {
    chatId,
    messageId: message.message_id,
  })
}

async function confirmToUser(telegramUserId, bookingId, bookingData) {
  const text = buildUserConfirmation(bookingId, bookingData)
  await getBot().telegram.sendMessage(telegramUserId, text)
}

function buildPassengerFoundMessage(driver) {
  const lines = [
    '✅ Haydovchi topildi!',
    `Haydovchi: ${driver.name}`,
    `Tel: ${driver.phone}`,
  ]

  if (driver.carModel) {
    lines.push(`Mashina: ${driver.carModel}`)
  }

  return lines.join('\n')
}

function buildDriverPassengerMessage(booking) {
  return [
    "✅ Yo'lovchi ma'lumoti:",
    `Ism: ${booking.passengerName || '-'}`,
    `Tel: ${booking.passengerPhone || '-'}`,
    `Yo'nalish: ${booking.route || '-'}`,
    `Vaqt: ${booking.time || '-'}`,
  ].join('\n')
}

function parseRegisterStepMessage(step) {
  if (step === 'name') {
    return "Haydovchi ro'yxatdan o'tishi boshlandi.\n\nIltimos, ism va familiyangizni yuboring."
  }

  if (step === 'phone') {
    return "Telefon raqamingizni +998901234567 formatida yuboring."
  }

  return "Mashina rusumi va modelini yuboring.\nMasalan: Cobalt 4."
}

async function handleDriverRegistrationText(ctx, session) {
  const text = String(ctx.message?.text || '').trim()

  if (!text) {
    await ctx.reply("Matn yuboring.")
    return true
  }

  if (session.step === 'name') {
    if (text.length < 3) {
      await ctx.reply("Ism va familiya kamida 3 ta belgidan iborat bo'lishi kerak.")
      return true
    }

    session.name = text
    session.step = 'phone'
    await ctx.reply(parseRegisterStepMessage('phone'))
    return true
  }

  if (session.step === 'phone') {
    if (!PHONE_REGEX.test(text)) {
      await ctx.reply("Telefon noto'g'ri. +998901234567 formatida yuboring.")
      return true
    }

    session.phone = text
    session.step = 'car_model'
    await ctx.reply(parseRegisterStepMessage('car_model'))
    return true
  }

  if (text.length < 2) {
    await ctx.reply("Mashina modeli kamida 2 ta belgidan iborat bo'lishi kerak.")
    return true
  }

  const driver = await registerDriver({
    telegramId: String(ctx.from.id),
    name: session.name,
    phone: session.phone,
    carModel: text,
  })

  driverRegistrationSessions.delete(String(ctx.from.id))

  await ctx.reply(
    [
      "✅ Ro'yxatdan o'tdingiz.",
      `Ism: ${driver.name}`,
      `Tel: ${driver.phone}`,
      `Mashina: ${driver.carModel}`,
      "Endi guruhdagi '✅ Olish' tugmasi orqali arizalarni olishingiz mumkin.",
    ].join('\n'),
  )

  return true
}

function attachBotHandlers(botInstance) {
  if (botHandlersAttached) {
    return
  }

  botHandlersAttached = true

  botInstance.command('register', async (ctx) => {
    const telegramId = String(ctx.from?.id || '')
    driverRegistrationSessions.set(telegramId, {
      step: 'name',
      startedAt: Date.now(),
    })

    await ctx.reply(parseRegisterStepMessage('name'))
  })

  botInstance.on('text', async (ctx, next) => {
    const telegramId = String(ctx.from?.id || '')
    const session = driverRegistrationSessions.get(telegramId)

    if (!session) {
      return next()
    }

    if (String(ctx.message?.text || '').trim().startsWith('/')) {
      await ctx.reply(
        "Ro'yxatdan o'tishni davom ettirish uchun so'ralgan ma'lumotni yuboring yoki /register ni qaytadan bosing.",
      )
      return
    }

    await handleDriverRegistrationText(ctx, session)
  })

  botInstance.action(/^take_booking:(.+)$/, async (ctx) => {
    const bookingId = String(ctx.match?.[1] || '').trim()
    const telegramId = String(ctx.from?.id || '')

    if (!bookingId || !telegramId) {
      await ctx.answerCbQuery("Arizani aniqlab bo'lmadi.")
      return
    }

    const driver = await getDriverByTelegramId(telegramId)

    if (!driver) {
      await ctx.answerCbQuery("Avval ro'yxatdan o'ting.", { show_alert: true })
      try {
        await ctx.telegram.sendMessage(
          telegramId,
          "Iltimos avval ro'yxatdan o'ting: /register",
        )
      } catch (error) {
        console.error('[Bot] Failed to prompt unregistered driver:', error.message)
      }
      return
    }

    const claimResult = await claimBooking(bookingId, driver)

    if (!claimResult.ok) {
      const message =
        claimResult.reason === 'not_found'
          ? 'Ariza topilmadi.'
          : 'Bu ariza allaqachon olindi.'

      await ctx.answerCbQuery(message, {
        show_alert: claimResult.reason !== 'not_found',
      })
      return
    }

    const { booking } = claimResult
    const nextText = buildGroupMessage(
      booking.bookingId,
      {
        route: booking.route,
        date: booking.date,
        time: booking.time,
        seats: booking.seats,
        full_car: booking.rowObject.full_car === 'true',
        passenger_gender: booking.rowObject.passenger_gender,
        passenger_name: booking.passengerName,
        passenger_phone: booking.passengerPhone,
        comment: booking.comment,
      },
      {
        taken: true,
        driver,
      },
    )

    try {
      await ctx.editMessageText(nextText)
    } catch (error) {
      console.error('[Bot] Failed to update group message:', error.message)
    }

    const notifications = []

    if (booking.passengerTelegramUserId) {
      notifications.push(
        ctx.telegram.sendMessage(
          booking.passengerTelegramUserId,
          buildPassengerFoundMessage(driver),
        ),
      )
    }

    notifications.push(
      ctx.telegram.sendMessage(telegramId, buildDriverPassengerMessage(booking)),
    )

    const results = await Promise.allSettled(notifications)
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('[Bot] Notification failed:', result.reason?.message || result.reason)
      }
    })

    await ctx.answerCbQuery('Ariza sizga biriktirildi.')
  })
}

async function startBot() {
  if (botStarted) {
    return getBot()
  }

  const botInstance = getBot()
  await botInstance.launch()
  botStarted = true
  console.log('[Bot] Started')
  return botInstance
}

module.exports = { getBot, notifyBookingGroup, confirmToUser, startBot }
