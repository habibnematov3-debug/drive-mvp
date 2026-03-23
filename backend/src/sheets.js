const { google } = require('googleapis')

const SHEET_NAME = 'bookings'
const HEADERS = [
  'buyurtma_id',
  'yaratilgan_vaqt',
  'yonalish',
  'sana',
  'vaqt',
  'mijoz_ismi',
  'telefon',
  'joylar_soni',
  'izoh',
  'holat',
  'haydovchi_ismi',
  'haydovchi_telefon',
  'narx',
  'telegram_user_id',
  'full_car',
  'passenger_gender',
]

let sheetsClient = null

function formatGenderLabel(passengerGender) {
  if (passengerGender === 'male') return 'Erkak'
  if (passengerGender === 'female') return 'Ayol'
  return "Farqi yo'q"
}

function buildCommentCell(bookingData) {
  const parts = [
    `To'liq mashina: ${bookingData.full_car ? 'ha' : "yo'q"}`,
  ]

  if (bookingData.passenger_gender && bookingData.passenger_gender !== 'any') {
    parts.push(`Mijoz jinsi: ${formatGenderLabel(bookingData.passenger_gender)}`)
  }

  if (bookingData.comment) {
    parts.push(bookingData.comment)
  }

  return parts.join('\n')
}

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  sheetsClient = google.sheets({ version: 'v4', auth })
  return sheetsClient
}

async function getNextBookingId(sheets, spreadsheetId) {
  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:A`,
  })

  const existingRows = readRes.data.values || []
  return existingRows.length
}

async function appendBooking(bookingData) {
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const bookingId = await getNextBookingId(sheets, spreadsheetId)
  const createdAt = new Date().toISOString()

  const rowData = {
    buyurtma_id: bookingId,
    yaratilgan_vaqt: createdAt,
    yonalish: bookingData.route,
    sana: bookingData.date,
    vaqt: bookingData.time,
    mijoz_ismi: bookingData.passenger_name || '',
    telefon: bookingData.passenger_phone || '',
    joylar_soni: bookingData.seats,
    izoh: buildCommentCell(bookingData),
    holat: 'yangi',
    haydovchi_ismi: '',
    haydovchi_telefon: '',
    narx: '',
    telegram_user_id: bookingData.telegram_user_id || '',
    full_car: bookingData.full_car ? 'true' : 'false',
    passenger_gender: bookingData.passenger_gender || 'any',
  }

  const row = HEADERS.map((header) => rowData[header] ?? '')

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  })

  return bookingId
}

function parseBoolean(value) {
  if (typeof value !== 'string') return false
  return ['true', '1', 'yes', 'ha'].includes(value.trim().toLowerCase())
}

function parsePassengerGender(value, comment) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''

  if (normalized === 'male' || normalized === 'female' || normalized === 'any') {
    return normalized
  }

  if (comment.includes('Mijoz jinsi: Erkak')) return 'male'
  if (comment.includes('Mijoz jinsi: Ayol')) return 'female'

  return 'any'
}

function parseFullCar(value, comment) {
  if (parseBoolean(value)) return true
  return comment.includes("To'liq mashina: ha")
}

function parseComment(comment) {
  return comment
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !line.startsWith("To'liq mashina:") && !line.startsWith('Mijoz jinsi:'),
    )
    .join('\n')
}

function mapStatus(status) {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : ''

  if (
    normalized.includes('bekor') ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  ) {
    return 'cancelled'
  }

  if (
    normalized.includes('haydovchi topildi') ||
    normalized.includes('matched')
  ) {
    return 'matched'
  }

  return 'submitted'
}

function mapRouteId(routeLabel) {
  if (routeLabel === 'Kokand → Tashkent') return 'kokand-tashkent'
  if (routeLabel === 'Tashkent → Kokand') return 'tashkent-kokand'
  return null
}

function buildRowObject(headers, row) {
  return headers.reduce((acc, header, index) => {
    acc[header] = row[index] ?? ''
    return acc
  }, {})
}

async function listBookingsByTelegramUser(telegramUserId) {
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:Z`,
  })

  const rows = res.data.values || []
  const [headers = [], ...dataRows] = rows

  return dataRows
    .map((row) => buildRowObject(headers, row))
    .filter((row) => String(row.telegram_user_id || '').trim() === String(telegramUserId))
    .map((row) => {
      const routeLabel = row.yonalish || ''
      const comment = row.izoh || ''

      return {
        id: `AR-${row.buyurtma_id}`,
        routeId: mapRouteId(routeLabel),
        routeLabel,
        dateISO: row.sana || '',
        time: row.vaqt || '',
        passengerCount: Number(row.joylar_soni || 1),
        fullCar: parseFullCar(row.full_car, comment),
        passengerGender: parsePassengerGender(row.passenger_gender, comment),
        status: mapStatus(row.holat),
        comment: parseComment(comment) || undefined,
        createdAtISO: row.yaratilgan_vaqt || '',
      }
    })
    .filter(
      (booking) =>
        booking.routeId &&
        booking.dateISO &&
        booking.time &&
        Number.isFinite(booking.passengerCount),
    )
    .reverse()
}

async function ensureHeader() {
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!1:1`,
  })

  const firstRow = res.data.values?.[0] || []
  const isSameHeader =
    firstRow.length === HEADERS.length &&
    HEADERS.every((header, index) => firstRow[index] === header)

  if (!isSameHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADERS] },
    })
    console.log('[Sheets] Header row synced')
  }
}

module.exports = { appendBooking, ensureHeader, listBookingsByTelegramUser, HEADERS }
