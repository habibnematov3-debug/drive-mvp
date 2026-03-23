const { Telegraf } = require('telegraf')

let bot = null

function getBot() {
  if (!bot) {
    bot = new Telegraf(process.env.BOT_TOKEN)
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

function buildGroupMessage(bookingId, data) {
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
  lines.push('Holat: yangi')

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

  await getBot().telegram.sendMessage(chatId, text)
}

async function confirmToUser(telegramUserId, bookingId, bookingData) {
  const text = buildUserConfirmation(bookingId, bookingData)
  await getBot().telegram.sendMessage(telegramUserId, text)
}

module.exports = { getBot, notifyBookingGroup, confirmToUser }
