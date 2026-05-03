const { Markup, Telegraf } = require('telegraf')
const {
  claimBooking,
  completeBooking,
  confirmPendingBooking,
  getAllUsers,
  getBookingById,
  getDriverByTelegramId,
  getDriverRating,
  registerDriver,
  resetPendingBooking,
  saveRating,
  storeBookingGroupMessage,
  upsertTelegramUser,
} = require('./sheets')

let bot = null
let botStarted = false
let botHandlersAttached = false
const driverRegistrationSessions = new Map()
const pendingPassengerConfirmations = new Map()
const PHONE_REGEX = /^\+998\d{9}$/
const PASSENGER_CONFIRMATION_TIMEOUT_MS = 5 * 60 * 1000
const BROADCAST_DELAY_MS = 50
const ADMIN_TELEGRAM_ID = '8581686582'

function getBot() {
  if (!bot) {
    bot = new Telegraf(process.env.BOT_TOKEN)
    attachBotHandlers(bot)
  }

  return bot
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
  const statusLabel = options.statusLabel || 'yangi'
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
  lines.push(`Holat: ${statusLabel}`)

  if (options.driver) {
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

function buildTakeBookingKeyboard(bookingId) {
  return Markup.inlineKeyboard([
    Markup.button.callback('✅ Olish', `take_booking:${bookingId}`),
  ])
}

function buildPassengerDecisionKeyboard(bookingId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Tasdiqlash', `passenger_confirm:${bookingId}`),
      Markup.button.callback('❌ Rad etish', `passenger_reject:${bookingId}`),
    ],
  ])
}

function buildTripCompletionKeyboard(bookingId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Sayohat tugadi', `driver_complete:${bookingId}`)],
  ])
}

function buildRatingKeyboard(bookingId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('⭐️1', `rate_trip:${bookingId}:1`),
      Markup.button.callback('⭐️2', `rate_trip:${bookingId}:2`),
      Markup.button.callback('⭐️3', `rate_trip:${bookingId}:3`),
      Markup.button.callback('⭐️4', `rate_trip:${bookingId}:4`),
      Markup.button.callback('⭐️5', `rate_trip:${bookingId}:5`),
    ],
  ])
}

function buildBookingPayloadFromRecord(booking) {
  return {
    route: booking.route,
    date: booking.date,
    time: booking.time,
    seats: booking.seats,
    full_car: booking.rowObject.full_car === 'true',
    passenger_gender: booking.rowObject.passenger_gender,
    passenger_name: booking.passengerName,
    passenger_phone: booking.passengerPhone,
    comment: booking.comment,
  }
}

async function notifyBookingGroup(bookingId, bookingData) {
  const chatId = process.env.BOOKING_GROUP_ID
  const text = buildGroupMessage(bookingId, bookingData)
  const message = await getBot().telegram.sendMessage(
    chatId,
    text,
    buildTakeBookingKeyboard(bookingId),
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

function formatDriverRatingLabel(ratingInfo) {
  if (!ratingInfo?.totalCount) {
    return '⭐️ Reyting: yangi haydovchi'
  }

  return `⭐️ Reyting: ${ratingInfo.averageRating.toFixed(1)} (${ratingInfo.totalCount} ta baho)`
}

function buildPassengerFoundMessage(driver, ratingInfo) {
  const lines = [
    '✅ Haydovchi topildi!',
    `Haydovchi: ${driver.name}`,
    `Tel: ${driver.phone}`,
  ]

  if (driver.carModel) {
    lines.push(`Mashina: ${driver.carModel}`)
  }

  lines.push(formatDriverRatingLabel(ratingInfo))
  lines.push('')
  lines.push("Agar haydovchi sizga mos bo'lsa, tasdiqlang.")

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

function buildTripCompletionRequestMessage() {
  return 'Sayohat tugadimi? Tasdiqlang 👇'
}

function buildRatingRequestMessage() {
  return "Sayohatingiz qanday o'tdi? Haydovchini baholang 👇"
}

function buildStartMessage() {
  return [
    '🚗 Haydovchi qidirib charchadingizmi?',
    '',
    "Telegram gruppalarda soatlab kutish,",
    "ko'p qo'ng'iroqlar va noaniq narxlar bezdirdimi?",
    '',
    'Drivee ilovasiga kiring va 1 daqiqada mashina toping. 👇',
  ].join('\n')
}

function buildStartKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('🚀 Ilovaga kirish', process.env.WEBAPP_URL)],
  ])
}

function parseRegisterStepMessage(step) {
  if (step === 'name') {
    return "Haydovchi ro'yxatdan o'tishi boshlandi.\n\nIltimos, ism va familiyangizni yuboring."
  }

  if (step === 'phone') {
    return 'Telefon raqamingizni +998901234567 formatida yuboring.'
  }

  return 'Mashina rusumi va modelini yuboring.\nMasalan: Cobalt 4.'
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getBroadcastText(rawText) {
  return String(rawText || '')
    .replace(/^\/broadcast(?:@\S+)?\s*/i, '')
    .trim()
}

function isAdmin(telegramId) {
  return String(telegramId || '') === ADMIN_TELEGRAM_ID
}

async function runBroadcast(ctx, payload) {
  const userIds = await getAllUsers()
  let sentCount = 0
  let errorCount = 0

  for (const userId of userIds) {
    try {
      if (payload.photoFileId) {
        await ctx.telegram.sendPhoto(userId, payload.photoFileId, {
          caption: payload.text,
        })
      } else {
        await ctx.telegram.sendMessage(userId, payload.text)
      }

      sentCount += 1
    } catch {
      errorCount += 1
    }

    await sleep(BROADCAST_DELAY_MS)
  }

  await ctx.reply(`✅ Yuborildi: ${sentCount} ta, ❌ Xato: ${errorCount} ta`)
}

async function handleDriverRegistrationText(ctx, session) {
  const text = String(ctx.message?.text || '').trim()

  if (!text) {
    await ctx.reply('Matn yuboring.')
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

function clearPendingConfirmation(bookingId) {
  const key = String(bookingId || '').trim()
  const existing = pendingPassengerConfirmations.get(key)

  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId)
  }

  pendingPassengerConfirmations.delete(key)
  return existing
}

async function editGroupMessageForStatus(bookingId, booking, options = {}) {
  if (!booking.groupChatId || !booking.groupMessageId) {
    return
  }

  const text = buildGroupMessage(
    bookingId,
    buildBookingPayloadFromRecord(booking),
    {
      statusLabel: options.statusLabel,
      driver: options.driver,
    },
  )

  const extra = options.restoreButton
    ? { reply_markup: buildTakeBookingKeyboard(bookingId).reply_markup }
    : undefined

  await getBot().telegram.editMessageText(
    booking.groupChatId,
    Number(booking.groupMessageId),
    undefined,
    text,
    extra,
  )
}

async function schedulePendingConfirmation(booking, driver) {
  clearPendingConfirmation(booking.bookingId)

  const timeoutId = setTimeout(async () => {
    try {
      const resetResult = await resetPendingBooking(booking.bookingId)

      if (!resetResult.ok) {
        return
      }

      const reopenedBooking = resetResult.booking

      await Promise.allSettled([
        getBot().telegram.sendMessage(
          driver.telegramId,
          "⌛ Yo'lovchi 5 daqiqa ichida javob bermadi. Ariza yana ochildi.",
        ),
        editGroupMessageForStatus(booking.bookingId, reopenedBooking, {
          statusLabel: 'yangi',
          restoreButton: true,
        }),
      ])
    } catch (error) {
      console.error('[Bot] Pending confirmation timeout failed:', error.message)
    } finally {
      pendingPassengerConfirmations.delete(booking.bookingId)
    }
  }, PASSENGER_CONFIRMATION_TIMEOUT_MS)

  pendingPassengerConfirmations.set(booking.bookingId, {
    timeoutId,
    driverTelegramId: String(driver.telegramId),
    passengerTelegramUserId: booking.passengerTelegramUserId,
  })
}

function attachBotHandlers(botInstance) {
  if (botHandlersAttached) {
    return
  }

  botHandlersAttached = true

  botInstance.command('start', async (ctx) => {
    if (ctx.from) {
      await upsertTelegramUser(ctx.from)
    }

    await ctx.reply(buildStartMessage(), buildStartKeyboard())
  })

  botInstance.command('register', async (ctx) => {
    const telegramId = String(ctx.from?.id || '')
    driverRegistrationSessions.set(telegramId, {
      step: 'name',
      startedAt: Date.now(),
    })

    await ctx.reply(parseRegisterStepMessage('name'))
  })

  botInstance.command('broadcast', async (ctx) => {
    const telegramId = String(ctx.from?.id || '')

    if (!isAdmin(telegramId)) {
      await ctx.reply('Bu buyruq faqat admin uchun.')
      return
    }

    const broadcastMessage = getBroadcastText(ctx.message?.text)

    if (!broadcastMessage) {
      await ctx.reply("Xabar matnini kiriting. Masalan: /broadcast Assalomu alaykum")
      return
    }

    await runBroadcast(ctx, { text: broadcastMessage })
  })

  botInstance.on('photo', async (ctx, next) => {
    const caption = String(ctx.message?.caption || '')

    if (!caption.trim().startsWith('/broadcast')) {
      return next()
    }

    const telegramId = String(ctx.from?.id || '')

    if (!isAdmin(telegramId)) {
      await ctx.reply('Bu buyruq faqat admin uchun.')
      return
    }

    const broadcastMessage = getBroadcastText(caption)
    const photoList = Array.isArray(ctx.message?.photo) ? ctx.message.photo : []
    const photoFileId = photoList[photoList.length - 1]?.file_id

    if (!broadcastMessage || !photoFileId) {
      await ctx.reply("Rasm bilan yuborish uchun caption yozing. Masalan: /broadcast Assalomu alaykum")
      return
    }

    await runBroadcast(ctx, {
      text: broadcastMessage,
      photoFileId,
    })
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

    try {
      await ctx.editMessageText(
        buildGroupMessage(booking.bookingId, buildBookingPayloadFromRecord(booking), {
          statusLabel: 'kutilmoqda',
          driver,
        }),
      )
    } catch (error) {
      console.error('[Bot] Failed to update group message:', error.message)
    }

    if (!booking.passengerTelegramUserId) {
      await resetPendingBooking(booking.bookingId)
      await editGroupMessageForStatus(booking.bookingId, booking, {
        statusLabel: 'yangi',
        restoreButton: true,
      }).catch((error) => {
        console.error('[Bot] Failed to restore group message:', error.message)
      })
      await ctx.answerCbQuery("Yo'lovchi bilan bog'lanib bo'lmadi.")
      return
    }

    let driverRating = null

    try {
      driverRating = await getDriverRating(driver.telegramId)
    } catch (error) {
      console.error('[Bot] Failed to load driver rating:', error.message)
    }

    try {
      await ctx.telegram.sendMessage(
        booking.passengerTelegramUserId,
        buildPassengerFoundMessage(driver, driverRating),
        buildPassengerDecisionKeyboard(booking.bookingId),
      )
    } catch (error) {
      console.error('[Bot] Failed to notify passenger:', error.message)
      const resetResult = await resetPendingBooking(booking.bookingId)
      if (resetResult.ok) {
        await editGroupMessageForStatus(booking.bookingId, resetResult.booking, {
          statusLabel: 'yangi',
          restoreButton: true,
        }).catch((groupError) => {
          console.error('[Bot] Failed to restore group message:', groupError.message)
        })
      }
      await ctx.telegram.sendMessage(
        telegramId,
        "Yo'lovchiga tasdiqlash xabari yuborilmadi. Ariza qayta ochildi.",
      ).catch((notifyError) => {
        console.error('[Bot] Failed to notify driver:', notifyError.message)
      })
      await ctx.answerCbQuery("Yo'lovchiga xabar yuborilmadi.")
      return
    }

    await schedulePendingConfirmation(booking, driver)
    await ctx.answerCbQuery("Yo'lovchi tasdig'i kutilmoqda.")
  })

  botInstance.action(/^passenger_confirm:(.+)$/, async (ctx) => {
    const bookingId = String(ctx.match?.[1] || '').trim()
    const telegramId = String(ctx.from?.id || '')

    if (!bookingId || !telegramId) {
      await ctx.answerCbQuery("Arizani aniqlab bo'lmadi.")
      return
    }

    const confirmResult = await confirmPendingBooking(bookingId, telegramId)

    if (!confirmResult.ok) {
      const message =
        confirmResult.reason === 'already_confirmed'
          ? 'Bu ariza allaqachon tasdiqlangan.'
          : confirmResult.reason === 'forbidden'
            ? "Bu tugma siz uchun emas."
            : "Bu ariza endi tasdiqlashni kutmayapti."

      await ctx.answerCbQuery(message, {
        show_alert: confirmResult.reason === 'forbidden',
      })
      return
    }

    const pending = clearPendingConfirmation(bookingId)
    const booking = confirmResult.booking

    try {
      await editGroupMessageForStatus(bookingId, booking, {
        statusLabel: 'jarayonda',
        driver: {
          name: booking.driverName,
          phone: booking.driverPhone,
          carModel: booking.driverCarModel,
        },
      })
    } catch (error) {
      console.error('[Bot] Failed to mark group message as confirmed:', error.message)
    }

    await ctx.editMessageText(
      [
        '✅ Haydovchi tasdiqlandi!',
        `Haydovchi: ${booking.driverName}`,
        `Tel: ${booking.driverPhone}`,
        booking.driverCarModel ? `Mashina: ${booking.driverCarModel}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )

    if (pending?.driverTelegramId) {
      try {
        await ctx.telegram.sendMessage(
          pending.driverTelegramId,
          "✅ Yo'lovchi tasdiqladi! Yo'lga chiqishingiz mumkin.",
        )
        await ctx.telegram.sendMessage(
          pending.driverTelegramId,
          buildDriverPassengerMessage(booking),
        )
        await ctx.telegram.sendMessage(
          pending.driverTelegramId,
          buildTripCompletionRequestMessage(),
          buildTripCompletionKeyboard(bookingId),
        )
      } catch (error) {
        console.error('[Bot] Failed to notify driver after confirmation:', error.message)
      }
    }

    await ctx.answerCbQuery('Tasdiqlandi.')
  })

  botInstance.action(/^driver_complete:(.+)$/, async (ctx) => {
    const bookingId = String(ctx.match?.[1] || '').trim()
    const telegramId = String(ctx.from?.id || '')

    if (!bookingId || !telegramId) {
      await ctx.answerCbQuery("Arizani aniqlab bo'lmadi.")
      return
    }

    const completeResult = await completeBooking(bookingId, telegramId)

    if (!completeResult.ok) {
      if (completeResult.reason === 'already_completed') {
        await ctx.answerCbQuery()
        return
      }

      const message =
        completeResult.reason === 'forbidden'
          ? "Bu tugma siz uchun emas."
          : completeResult.reason === 'not_in_progress'
            ? "Bu sayohatni hozir tugatib bo'lmaydi."
            : 'Ariza topilmadi.'

      await ctx.answerCbQuery(message, {
        show_alert: completeResult.reason === 'forbidden',
      })
      return
    }

    const booking = completeResult.booking

    try {
      await editGroupMessageForStatus(bookingId, booking, {
        statusLabel: 'tugallandi',
        driver: {
          name: booking.driverName,
          phone: booking.driverPhone,
          carModel: booking.driverCarModel,
        },
      })
    } catch (error) {
      console.error('[Bot] Failed to mark group message as completed:', error.message)
    }

    try {
      await ctx.editMessageText("✅ Sayohat tugagani tasdiqlandi.")
    } catch (error) {
      console.error('[Bot] Failed to update driver completion message:', error.message)
    }

    if (booking.passengerTelegramUserId) {
      try {
        await ctx.telegram.sendMessage(
          booking.passengerTelegramUserId,
          buildRatingRequestMessage(),
          buildRatingKeyboard(bookingId),
        )
      } catch (error) {
        console.error('[Bot] Failed to send rating request:', error.message)
      }
    }

    await ctx.answerCbQuery('Tasdiqlandi.')
  })

  botInstance.action(/^rate_trip:(.+):([1-5])$/, async (ctx) => {
    const bookingId = String(ctx.match?.[1] || '').trim()
    const rating = Number(ctx.match?.[2] || 0)
    const telegramId = String(ctx.from?.id || '')

    if (!bookingId || !telegramId || !Number.isInteger(rating)) {
      await ctx.answerCbQuery("Arizani aniqlab bo'lmadi.")
      return
    }

    const booking = await getBookingById(bookingId)

    if (!booking) {
      await ctx.answerCbQuery('Ariza topilmadi.')
      return
    }

    if (booking.passengerTelegramUserId !== telegramId) {
      await ctx.answerCbQuery("Bu tugma siz uchun emas.", {
        show_alert: true,
      })
      return
    }

    if (booking.status !== 'tugallandi') {
      await ctx.answerCbQuery("Bu sayohat hali tugallanmagan.")
      return
    }

    const saveResult = await saveRating(
      bookingId,
      booking.driverTelegramId,
      booking.passengerTelegramUserId,
      rating,
    )

    if (!saveResult.ok) {
      if (saveResult.reason === 'already_rated') {
        await ctx.answerCbQuery()
        return
      }

      await ctx.answerCbQuery("Bahoni saqlab bo'lmadi.")
      return
    }

    try {
      await ctx.editMessageText('Rahmat! Bahoyingiz qabul qilindi ✅')
    } catch (error) {
      console.error('[Bot] Failed to update rating message:', error.message)
    }

    if (booking.driverTelegramId) {
      try {
        await ctx.telegram.sendMessage(
          booking.driverTelegramId,
          `Yo'lovchi sizga ${rating} yulduz berdi ⭐️`,
        )
      } catch (error) {
        console.error('[Bot] Failed to notify driver about rating:', error.message)
      }
    }

    await ctx.answerCbQuery('Rahmat!')
  })

  botInstance.action(/^passenger_reject:(.+)$/, async (ctx) => {
    const bookingId = String(ctx.match?.[1] || '').trim()
    const telegramId = String(ctx.from?.id || '')

    if (!bookingId || !telegramId) {
      await ctx.answerCbQuery("Arizani aniqlab bo'lmadi.")
      return
    }

    const rejectResult = await resetPendingBooking(bookingId, {
      passengerTelegramUserId: telegramId,
    })

    if (!rejectResult.ok) {
      const message =
        rejectResult.reason === 'forbidden'
          ? "Bu tugma siz uchun emas."
          : rejectResult.reason === 'already_confirmed'
            ? 'Bu ariza allaqachon tasdiqlangan.'
            : "Bu ariza endi rad etishni kutmayapti."

      await ctx.answerCbQuery(message, {
        show_alert: rejectResult.reason === 'forbidden',
      })
      return
    }

    const pending = clearPendingConfirmation(bookingId)
    const booking = rejectResult.booking

    try {
      await editGroupMessageForStatus(bookingId, booking, {
        statusLabel: 'yangi',
        restoreButton: true,
      })
    } catch (error) {
      console.error('[Bot] Failed to restore group message:', error.message)
    }

    await ctx.editMessageText(
      "❌ Siz bu haydovchini rad etdingiz. Ariza boshqa haydovchilar uchun yana ochildi.",
    )

    if (pending?.driverTelegramId) {
      try {
        await ctx.telegram.sendMessage(
          pending.driverTelegramId,
          "❌ Yo'lovchi boshqa haydovchi tanladi.",
        )
      } catch (error) {
        console.error('[Bot] Failed to notify driver after rejection:', error.message)
      }
    }

    await ctx.answerCbQuery('Ariza qayta ochildi.')
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
