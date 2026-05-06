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
  'haydovchi_telegram_id',
  'haydovchi_mashina',
  'group_chat_id',
  'group_message_id',
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
const DRIVERS_SHEET_NAME = 'drivers'
const DRIVERS_HEADERS = [
  'telegram_id',
  'name',
  'phone',
  'car_model',
  'registered_at',
]
const RATINGS_SHEET_NAME = 'Ratings'
const RATINGS_HEADERS = [
  'booking_id',
  'driver_telegram_id',
  'passenger_telegram_id',
  'rating',
  'created_at',
]
const BOOKING_STATUS_NEW = 'yangi'
const BOOKING_STATUS_PENDING = 'kutilmoqda'
const BOOKING_STATUS_IN_PROGRESS = 'jarayonda'
const BOOKING_STATUS_COMPLETED = 'tugallandi'
const BOOKING_STATUS_CANCELLED = 'bekor qilindi'

const ROUTE_LABELS_BY_ID = {
  'kokand-tashkent': 'Kokand -> Tashkent',
  'tashkent-kokand': 'Tashkent -> Kokand',
  'tashkent-samarkand': 'Tashkent -> Samarkand',
  'samarkand-tashkent': 'Samarkand -> Tashkent',
  'tashkent-namangan': 'Tashkent -> Namangan',
  'namangan-tashkent': 'Namangan -> Tashkent',
}

const ROUTE_ALIASES = {
  'kokand -> tashkent': 'kokand-tashkent',
  'kokand → tashkent': 'kokand-tashkent',
  'kokand в†’ tashkent': 'kokand-tashkent',
  'kokand to tashkent': 'kokand-tashkent',
  'kokand tashkent': 'kokand-tashkent',
  'qoqon -> toshkent': 'kokand-tashkent',
  "qo'qon -> toshkent": 'kokand-tashkent',
  'токанд -> ташкент': 'kokand-tashkent',
  'коканд -> ташкент': 'kokand-tashkent',

  'tashkent -> kokand': 'tashkent-kokand',
  'tashkent → kokand': 'tashkent-kokand',
  'tashkent в†’ kokand': 'tashkent-kokand',
  'tashkent to kokand': 'tashkent-kokand',
  'tashkent kokand': 'tashkent-kokand',
  'toshkent -> qoqon': 'tashkent-kokand',
  "toshkent -> qo'qon": 'tashkent-kokand',
  'ташкент -> коканд': 'tashkent-kokand',

  'tashkent -> samarkand': 'tashkent-samarkand',
  'tashkent → samarkand': 'tashkent-samarkand',
  'tashkent в†’ samarkand': 'tashkent-samarkand',
  'toshkent -> samarqand': 'tashkent-samarkand',
  'ташкент -> самарканд': 'tashkent-samarkand',

  'samarkand -> tashkent': 'samarkand-tashkent',
  'samarkand → tashkent': 'samarkand-tashkent',
  'samarkand в†’ tashkent': 'samarkand-tashkent',
  'samarqand -> toshkent': 'samarkand-tashkent',
  'самарканд -> ташкент': 'samarkand-tashkent',

  'tashkent -> namangan': 'tashkent-namangan',
  'tashkent → namangan': 'tashkent-namangan',
  'tashkent в†’ namangan': 'tashkent-namangan',
  'toshkent -> namangan': 'tashkent-namangan',
  'ташкент -> наманган': 'tashkent-namangan',

  'namangan -> tashkent': 'namangan-tashkent',
  'namangan → tashkent': 'namangan-tashkent',
  'namangan в†’ tashkent': 'namangan-tashkent',
  'namangan -> toshkent': 'namangan-tashkent',
  'наманган -> ташкент': 'namangan-tashkent',
}

let sheetsClient = null
const bookingLocks = new Map()

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
  const parts = [`To'liq mashina: ${bookingData.full_car ? 'ha' : "yo'q"}`]

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
  return `AR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
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
    telefon: formatPhone(bookingData.passenger_phone),
    joylar_soni: bookingData.seats,
    izoh: buildCommentCell(bookingData),
    holat: BOOKING_STATUS_NEW,
    haydovchi_ismi: '',
    haydovchi_telefon: '',
    narx: '',
    telegram_user_id: bookingData.telegram_user_id || '',
    full_car: bookingData.full_car ? 'true' : 'false',
    has_bag: bookingData.has_bag ? 'true' : 'false',
    passenger_gender: bookingData.passenger_gender || 'any',
    route_id: bookingData.route_id || '',
    haydovchi_telegram_id: '',
    haydovchi_mashina: '',
    group_chat_id: '',
    group_message_id: '',
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

function normalizeCellValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function formatPhone(phone) {
  if (!phone) return ''
  const cleaned = phone.toString().trim()
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
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

async function getAllUsers() {
  await ensureSheetExists(USERS_SHEET_NAME)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${USERS_SHEET_NAME}!A:H`,
  })

  const rows = res.data.values || []
  const dataRows = rows.slice(1)
  const uniqueTelegramUserIds = new Set()

  for (const row of dataRows) {
    const telegramUserId = normalizeCellValue(row[0])

    if (telegramUserId) {
      uniqueTelegramUserIds.add(telegramUserId)
    }
  }

  return Array.from(uniqueTelegramUserIds)
}

async function getRatingsRows() {
  await ensureSheetExists(RATINGS_SHEET_NAME)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${RATINGS_SHEET_NAME}!A:E`,
  })

  const rows = res.data.values || []
  return {
    sheets,
    spreadsheetId,
    rows,
    dataRows: rows.slice(1),
  }
}

async function saveRating(bookingId, driverTelegramId, passengerTelegramUserId, rating) {
  const normalizedBookingId = normalizeBookingId(bookingId)
  const normalizedDriverTelegramId = normalizeCellValue(driverTelegramId)
  const normalizedPassengerTelegramUserId = normalizeCellValue(passengerTelegramUserId)
  const normalizedRating = Number(rating)

  if (!normalizedBookingId || !normalizedDriverTelegramId || !normalizedPassengerTelegramUserId) {
    return { ok: false, reason: 'invalid_input' }
  }

  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    return { ok: false, reason: 'invalid_rating' }
  }

  const { sheets, spreadsheetId, dataRows } = await getRatingsRows()
  const createdAt = new Date().toISOString()
  const rowData = {
    booking_id: normalizedBookingId,
    driver_telegram_id: normalizedDriverTelegramId,
    passenger_telegram_id: normalizedPassengerTelegramUserId,
    rating: String(normalizedRating),
    created_at: createdAt,
  }
  const existingIndex = dataRows.findIndex(
    (row) => normalizeBookingId(row[0]) === normalizedBookingId,
  )

  if (existingIndex >= 0) {
    return {
      ok: false,
      reason: 'already_rated',
      rating: normalizedRating,
    }
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${RATINGS_SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [RATINGS_HEADERS.map((header) => rowData[header] ?? '')],
    },
  })

  return {
    ok: true,
    rating: normalizedRating,
    createdAt,
  }
}

async function getDriverRating(driverTelegramId) {
  const normalizedDriverTelegramId = normalizeCellValue(driverTelegramId)

  if (!normalizedDriverTelegramId) {
    return null
  }

  const { dataRows } = await getRatingsRows()
  const driverRatings = dataRows
    .filter((row) => normalizeCellValue(row[1]) === normalizedDriverTelegramId)
    .map((row) => Number(row[3]))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5)

  if (!driverRatings.length) {
    return null
  }

  const totalCount = driverRatings.length
  const averageRating =
    driverRatings.reduce((sum, value) => sum + value, 0) / totalCount

  return {
    averageRating,
    totalCount,
  }
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

  // Handle completed states (tugallandi, completed)
  if (normalized.includes('tugallandi') || normalized === 'completed') {
    return 'completed'
  }

  // Handle cancelled states (bekor, bekor qilindi, cancelled, canceled)
  if (
    normalized.includes('bekor') ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  ) {
    return 'cancelled'
  }

  // Handle matched/in-progress states (jarayonda, kutilmoqda, haydovchi topildi, matched, in_progress)
  if (
    normalized.includes('jarayonda') ||
    normalized.includes('kutilmoqda') ||
    normalized.includes('haydovchi topildi') ||
    normalized.includes('matched') ||
    normalized.includes('in_progress')
  ) {
    return 'matched'
  }

  // Default to submitted for new/yangi states
  return 'submitted'
}

function mapRouteId(routeLabel) {
  const normalized = String(routeLabel || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

  if (ROUTE_ALIASES[normalized]) {
    return ROUTE_ALIASES[normalized]
  }

  const normalizedArrow = normalized
    .replace(/→/g, '->')
    .replace(/в†’/g, '->')
    .replace(/\s*-\s*>/g, ' -> ')
    .replace(/\s+/g, ' ')
    .trim()

  if (ROUTE_ALIASES[normalizedArrow]) {
    return ROUTE_ALIASES[normalizedArrow]
  }

  const match = Object.entries(ROUTE_LABELS_BY_ID).find(([, label]) => {
    return label.toLowerCase() === normalizedArrow
  })

  return match?.[0] || null
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
      const routeId = row.route_id || mapRouteId(row.yonalish || '')
      const comment = row.izoh || ''
      const routeLabel = routeId ? ROUTE_LABELS_BY_ID[routeId] : row.yonalish || ''

      return {
        id: normalizeBookingId(row.buyurtma_id),
        routeId,
        routeLabel,
        dateISO: row.sana || '',
        time: row.vaqt || '',
        passengerPhone: formatPhone(row.telefon) || undefined,
        passengerCount: Number(row.joylar_soni || 1),
        fullCar: parseFullCar(row.full_car, comment),
        hasBag: parseBoolean(row.has_bag),
        passengerGender: parsePassengerGender(row.passenger_gender, comment),
        status: mapStatus(row.holat),
        comment: parseComment(comment) || undefined,
        createdAtISO: row.yaratilgan_vaqt || '',
        driver: row.haydovchi_ismi
          ? {
              telegramId: normalizeCellValue(row.haydovchi_telegram_id) || undefined,
              name: row.haydovchi_ismi,
              phone: formatPhone(row.haydovchi_telefon) || undefined,
              carModel: normalizeCellValue(row.haydovchi_mashina) || undefined,
            }
          : undefined,
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
  await ensureSheetHeader(DRIVERS_SHEET_NAME, DRIVERS_HEADERS)
  await ensureSheetHeader(RATINGS_SHEET_NAME, RATINGS_HEADERS)
}

function withBookingLock(bookingId, task) {
  const key = normalizeBookingId(bookingId)
  const previous = bookingLocks.get(key) || Promise.resolve()
  const current = previous.catch(() => undefined).then(task)
  bookingLocks.set(
    key,
    current.finally(() => {
      if (bookingLocks.get(key) === current) {
        bookingLocks.delete(key)
      }
    }),
  )
  return current
}

function buildBookingRecord(headers, row, rowNumber) {
  const rowObject = buildRowObject(headers, row)
  return {
    rowNumber,
    rowObject,
    bookingId: normalizeBookingId(rowObject.buyurtma_id),
    status: normalizeCellValue(rowObject.holat).toLowerCase(),
    passengerTelegramUserId: normalizeCellValue(rowObject.telegram_user_id),
    passengerName: normalizeCellValue(rowObject.mijoz_ismi),
    passengerPhone: formatPhone(rowObject.telefon),
    route: normalizeCellValue(rowObject.yonalish),
    routeId: normalizeCellValue(rowObject.route_id),
    date: normalizeCellValue(rowObject.sana),
    time: normalizeCellValue(rowObject.vaqt),
    seats: normalizeCellValue(rowObject.joylar_soni),
    comment: normalizeCellValue(rowObject.izoh),
    driverName: normalizeCellValue(rowObject.haydovchi_ismi),
    driverPhone: formatPhone(rowObject.haydovchi_telefon),
    driverTelegramId: normalizeCellValue(rowObject.haydovchi_telegram_id),
    driverCarModel: normalizeCellValue(rowObject.haydovchi_mashina),
    groupChatId: normalizeCellValue(rowObject.group_chat_id),
    groupMessageId: normalizeCellValue(rowObject.group_message_id),
    rowValues: BOOKINGS_HEADERS.map((header) => rowObject[header] ?? ''),
  }
}

async function getBookingRows() {
  await ensureSheetExists(BOOKINGS_SHEET_NAME)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${BOOKINGS_SHEET_NAME}!A:Z`,
  })

  const rows = res.data.values || []
  const [headers = [], ...dataRows] = rows
  return { sheets, spreadsheetId, headers, dataRows }
}

async function findBookingById(bookingId) {
  const normalizedId = normalizeBookingId(bookingId)
  const { sheets, spreadsheetId, headers, dataRows } = await getBookingRows()

  const rowIndex = dataRows.findIndex((row) => normalizeBookingId(row[0]) === normalizedId)

  if (rowIndex < 0) {
    return null
  }

  const rowNumber = rowIndex + 2
  return {
    sheets,
    spreadsheetId,
    headers,
    record: buildBookingRecord(headers, dataRows[rowIndex], rowNumber),
  }
}

async function getBookingById(bookingId) {
  const booking = await findBookingById(bookingId)
  return booking?.record || null
}

async function updateBookingRow(rowNumber, rowObject) {
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${BOOKINGS_SHEET_NAME}!A${rowNumber}:V${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [BOOKINGS_HEADERS.map((header) => rowObject[header] ?? '')],
    },
  })
}

function attachDriverToRow(rowObject, driver) {
  return {
    ...rowObject,
    haydovchi_ismi: driver.name,
    haydovchi_telefon: formatPhone(driver.phone),
    haydovchi_telegram_id: String(driver.telegramId),
    haydovchi_mashina: driver.carModel,
  }
}

function clearDriverFromRow(rowObject) {
  return {
    ...rowObject,
    haydovchi_ismi: '',
    haydovchi_telefon: '',
    haydovchi_telegram_id: '',
    haydovchi_mashina: '',
  }
}

async function storeBookingGroupMessage(bookingId, groupMeta) {
  const booking = await findBookingById(bookingId)

  if (!booking) {
    return null
  }

  const nextRow = {
    ...booking.record.rowObject,
    group_chat_id: String(groupMeta.chatId),
    group_message_id: String(groupMeta.messageId),
  }

  await updateBookingRow(booking.record.rowNumber, nextRow)

  return {
    ...booking.record,
    rowObject: nextRow,
    groupChatId: String(groupMeta.chatId),
    groupMessageId: String(groupMeta.messageId),
  }
}

async function getDriverByTelegramId(telegramId) {
  await ensureSheetExists(DRIVERS_SHEET_NAME)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const normalizedTelegramId = String(telegramId || '').trim()

  if (!normalizedTelegramId) {
    return null
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${DRIVERS_SHEET_NAME}!A:E`,
  })

  const rows = res.data.values || []
  const dataRows = rows.slice(1)
  const existingRow = dataRows.find(
    (row) => normalizeCellValue(row[0]) === normalizedTelegramId,
  )

  if (!existingRow) {
    return null
  }

  return {
    telegramId: normalizedTelegramId,
    name: normalizeCellValue(existingRow[1]),
    phone: formatPhone(existingRow[2]),
    carModel: normalizeCellValue(existingRow[3]),
    registeredAt: normalizeCellValue(existingRow[4]),
  }
}

async function registerDriver(driverInput) {
  await ensureSheetExists(DRIVERS_SHEET_NAME)
  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const telegramId = String(driverInput.telegramId || '').trim()
  const now = new Date().toISOString()

  const driverData = {
    telegram_id: telegramId,
    name: normalizeCellValue(driverInput.name),
    phone: formatPhone(driverInput.phone),
    car_model: normalizeCellValue(driverInput.carModel),
    registered_at: now,
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${DRIVERS_SHEET_NAME}!A:E`,
  })

  const rows = res.data.values || []
  const dataRows = rows.slice(1)
  const existingIndex = dataRows.findIndex(
    (row) => normalizeCellValue(row[0]) === telegramId,
  )

  if (existingIndex >= 0) {
    const existingRow = dataRows[existingIndex]
    driverData.registered_at = normalizeCellValue(existingRow[4]) || now

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${DRIVERS_SHEET_NAME}!A${existingIndex + 2}:E${existingIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [DRIVERS_HEADERS.map((header) => driverData[header] ?? '')],
      },
    })
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${DRIVERS_SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [DRIVERS_HEADERS.map((header) => driverData[header] ?? '')],
      },
    })
  }

  return {
    telegramId,
    name: driverData.name,
    phone: driverData.phone,
    carModel: driverData.car_model,
    registeredAt: driverData.registered_at,
  }
}

async function claimBooking(bookingId, driver) {
  return withBookingLock(bookingId, async () => {
    const booking = await findBookingById(bookingId)

    if (!booking) {
      return { ok: false, reason: 'not_found' }
    }

    if (booking.record.status !== BOOKING_STATUS_NEW) {
      return { ok: false, reason: 'already_taken', booking: booking.record }
    }

    const nextRow = attachDriverToRow(
      {
        ...booking.record.rowObject,
        holat: BOOKING_STATUS_PENDING,
      },
      driver,
    )

    await updateBookingRow(booking.record.rowNumber, nextRow)

    return {
      ok: true,
      booking: {
        ...booking.record,
        status: BOOKING_STATUS_PENDING,
        rowObject: nextRow,
        driverName: driver.name,
        driverPhone: driver.phone,
        driverTelegramId: String(driver.telegramId),
        driverCarModel: driver.carModel,
      },
    }
  })
}

async function confirmPendingBooking(bookingId, passengerTelegramUserId) {
  return withBookingLock(bookingId, async () => {
    const booking = await findBookingById(bookingId)

    if (!booking) {
      return { ok: false, reason: 'not_found' }
    }

    if (
      passengerTelegramUserId &&
      booking.record.passengerTelegramUserId !== String(passengerTelegramUserId)
    ) {
      return { ok: false, reason: 'forbidden', booking: booking.record }
    }

    if (booking.record.status === BOOKING_STATUS_IN_PROGRESS) {
      return { ok: false, reason: 'already_confirmed', booking: booking.record }
    }

    if (booking.record.status !== BOOKING_STATUS_PENDING) {
      return { ok: false, reason: 'not_pending', booking: booking.record }
    }

    const nextRow = {
      ...booking.record.rowObject,
      holat: BOOKING_STATUS_IN_PROGRESS,
    }

    await updateBookingRow(booking.record.rowNumber, nextRow)

    return {
      ok: true,
      booking: {
        ...booking.record,
        status: BOOKING_STATUS_IN_PROGRESS,
        rowObject: nextRow,
      },
    }
  })
}

async function completeBooking(bookingId, driverTelegramId) {
  return withBookingLock(bookingId, async () => {
    const booking = await findBookingById(bookingId)

    if (!booking) {
      return { ok: false, reason: 'not_found' }
    }

    if (
      driverTelegramId &&
      booking.record.driverTelegramId !== String(driverTelegramId)
    ) {
      return { ok: false, reason: 'forbidden', booking: booking.record }
    }

    if (booking.record.status === BOOKING_STATUS_COMPLETED) {
      return { ok: false, reason: 'already_completed', booking: booking.record }
    }

    if (booking.record.status !== BOOKING_STATUS_IN_PROGRESS) {
      return { ok: false, reason: 'not_in_progress', booking: booking.record }
    }

    const nextRow = {
      ...booking.record.rowObject,
      holat: BOOKING_STATUS_COMPLETED,
    }

    await updateBookingRow(booking.record.rowNumber, nextRow)

    return {
      ok: true,
      booking: {
        ...booking.record,
        status: BOOKING_STATUS_COMPLETED,
        rowObject: nextRow,
      },
    }
  })
}

async function cancelBooking(bookingId, telegramUserId) {
  return withBookingLock(bookingId, async () => {
    const booking = await findBookingById(bookingId)

    if (!booking) {
      return { ok: false, reason: 'not_found' }
    }

    if (
      telegramUserId &&
      booking.record.passengerTelegramUserId !== String(telegramUserId)
    ) {
      return { ok: false, reason: 'forbidden', booking: booking.record }
    }

    if (booking.record.status === BOOKING_STATUS_IN_PROGRESS) {
      return { ok: false, reason: 'already_confirmed', booking: booking.record }
    }

    if (booking.record.status === BOOKING_STATUS_COMPLETED) {
      return { ok: false, reason: 'already_completed', booking: booking.record }
    }

    if (booking.record.status === BOOKING_STATUS_CANCELLED) {
      return { ok: false, reason: 'already_cancelled', booking: booking.record }
    }

    if (
      booking.record.status !== BOOKING_STATUS_NEW &&
      booking.record.status !== BOOKING_STATUS_PENDING
    ) {
      return { ok: false, reason: 'not_cancellable', booking: booking.record }
    }

    const previousStatus = booking.record.status
    const nextRow = {
      ...booking.record.rowObject,
      holat: BOOKING_STATUS_CANCELLED,
    }

    await updateBookingRow(booking.record.rowNumber, nextRow)

    return {
      ok: true,
      booking: {
        ...booking.record,
        previousStatus,
        status: BOOKING_STATUS_CANCELLED,
        rowObject: nextRow,
      },
    }
  })
}

async function resetPendingBooking(bookingId, options = {}) {
  return withBookingLock(bookingId, async () => {
    const booking = await findBookingById(bookingId)

    if (!booking) {
      return { ok: false, reason: 'not_found' }
    }

    if (
      options.passengerTelegramUserId &&
      booking.record.passengerTelegramUserId !== String(options.passengerTelegramUserId)
    ) {
      return { ok: false, reason: 'forbidden', booking: booking.record }
    }

    if (booking.record.status === BOOKING_STATUS_NEW) {
      return { ok: false, reason: 'already_open', booking: booking.record }
    }

    if (booking.record.status === BOOKING_STATUS_IN_PROGRESS) {
      return { ok: false, reason: 'already_confirmed', booking: booking.record }
    }

    if (booking.record.status !== BOOKING_STATUS_PENDING) {
      return { ok: false, reason: 'not_pending', booking: booking.record }
    }

    const nextRow = clearDriverFromRow({
      ...booking.record.rowObject,
      holat: BOOKING_STATUS_NEW,
    })

    await updateBookingRow(booking.record.rowNumber, nextRow)

    return {
      ok: true,
      booking: {
        ...booking.record,
        status: BOOKING_STATUS_NEW,
        rowObject: nextRow,
        driverName: '',
        driverPhone: '',
        driverTelegramId: '',
        driverCarModel: '',
      },
    }
  })
}

module.exports = {
  appendBooking,
  cancelBooking,
  claimBooking,
  completeBooking,
  confirmPendingBooking,
  ensureHeader,
  getAllUsers,
  getBookingById,
  getDriverByTelegramId,
  getDriverRating,
  listBookingsByTelegramUser,
  registerDriver,
  resetPendingBooking,
  saveRating,
  storeBookingGroupMessage,
  upsertTelegramUser,
  HEADERS: BOOKINGS_HEADERS,
}
