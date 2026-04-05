const crypto = require('crypto')
const { google } = require('googleapis')

const BOOKINGS_SHEET_NAME = 'bookings'
const BOOKINGS_HEADERS = [
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
  'has_bag',
  'passenger_gender',
  'route_id',
]
const USERS_SHEET_NAME = 'users'
const USERS_HEADERS = [
  'telegram_user_id',
  'first_name',
  'last_name',
  'username',
  'language_code',
  'photo_url',
  'registered_at',
  'last_seen_at',
]

let sheetsClient = null

async function ensureSheetExists(sheetName) {
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
  const existingTitles =
    spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) || []

  if (existingTitles.includes(sheetName)) {
    return
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    },
  })
}

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

function createBookingId() {
  return `AR-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`
}

async function appendBooking(bookingData) {
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const bookingId = createBookingId()
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
    has_bag: bookingData.has_bag ? 'true' : 'false',
    passenger_gender: bookingData.passenger_gender || 'any',
    route_id: bookingData.route_id || '',
  }

  const row = BOOKINGS_HEADERS.map((header) => rowData[header] ?? '')

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${BOOKINGS_SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  })

  return bookingId
}

async function ensureSheetHeader(sheetName, headers) {
  await ensureSheetExists(sheetName)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  })

  const firstRow = res.data.values?.[0] || []
  const isSameHeader =
    firstRow.length === headers.length &&
    headers.every((header, index) => firstRow[index] === header)

  if (!isSameHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    })
    console.log(`[Sheets] Header row synced for ${sheetName}`)
  }
}

function normalizeUserField(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function upsertTelegramUser(user) {
  await ensureSheetExists(USERS_SHEET_NAME)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const telegramUserId = String(user.id)
  const now = new Date().toISOString()

  const rowData = {
    telegram_user_id: telegramUserId,
    first_name: normalizeUserField(user.first_name),
    last_name: normalizeUserField(user.last_name),
    username: normalizeUserField(user.username),
    language_code: normalizeUserField(user.language_code),
    photo_url: normalizeUserField(user.photo_url),
    registered_at: now,
    last_seen_at: now,
  }

  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${USERS_SHEET_NAME}!A:H`,
  })

  const rows = readRes.data.values || []
  const dataRows = rows.slice(1)
  const existingIndex = dataRows.findIndex(
    (row) => String(row[0] || '').trim() === telegramUserId,
  )

  if (existingIndex >= 0) {
    const existingRow = dataRows[existingIndex]
    rowData.registered_at = existingRow[6] || now

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A${existingIndex + 2}:H${existingIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [USERS_HEADERS.map((header) => rowData[header] ?? '')],
      },
    })

    return
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${USERS_SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [USERS_HEADERS.map((header) => rowData[header] ?? '')],
    },
  })
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

function normalizeBookingId(value) {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('AR-')) return normalized
  return `AR-${normalized}`
}

function buildRowObject(headers, row) {
  return headers.reduce((acc, header, index) => {
    acc[header] = row[index] ?? ''
    return acc
  }, {})
}

async function listBookingsByTelegramUser(telegramUserId) {
  await ensureSheetExists(BOOKINGS_SHEET_NAME)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${BOOKINGS_SHEET_NAME}!A:Z`,
  })

  const rows = res.data.values || []
  const [headers = [], ...dataRows] = rows

  return dataRows
    .map((row) => buildRowObject(headers, row))
    .filter((row) => String(row.telegram_user_id || '').trim() === String(telegramUserId))
    .map((row) => {
      const routeLabel = row.yonalish || ''
      const comment = row.izoh || ''

      const routeId = row.route_id || mapRouteId(routeLabel)

      return {
        id: normalizeBookingId(row.buyurtma_id),
        routeId,
        routeLabel,
        dateISO: row.sana || '',
        time: row.vaqt || '',
        passengerCount: Number(row.joylar_soni || 1),
        fullCar: parseFullCar(row.full_car, comment),
        hasBag: parseBoolean(row.has_bag),
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
  await ensureSheetHeader(BOOKINGS_SHEET_NAME, BOOKINGS_HEADERS)
  await ensureSheetHeader(USERS_SHEET_NAME, USERS_HEADERS)
}

module.exports = {
  appendBooking,
  ensureHeader,
  listBookingsByTelegramUser,
  upsertTelegramUser,
  HEADERS: BOOKINGS_HEADERS,
}
