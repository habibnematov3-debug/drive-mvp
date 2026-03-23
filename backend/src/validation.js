const VALID_ROUTES = ['Kokand → Tashkent', 'Tashkent → Kokand']
const VALID_GENDERS = ['any', 'male', 'female']
const PHONE_REGEX = /^\+998\d{9}$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^\d{2}:\d{2}$/

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeRoute(route) {
  const normalized = normalizeString(route)
    .replace(/->/g, '→')
    .replace(/\s+/g, ' ')
    .trim()

  if (
    normalized.toLowerCase() === 'kokand → tashkent' ||
    normalized.toLowerCase() === 'kokand tashkent'
  ) {
    return 'Kokand → Tashkent'
  }

  if (
    normalized.toLowerCase() === 'tashkent → kokand' ||
    normalized.toLowerCase() === 'tashkent kokand'
  ) {
    return 'Tashkent → Kokand'
  }

  return normalized
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['true', '1', 'yes', 'ha'].includes(normalized)
  }

  return false
}

function normalizeBookingInput(body = {}) {
  return {
    route: normalizeRoute(body.route),
    date: normalizeString(body.date),
    time: normalizeString(body.time),
    passenger_name: normalizeString(
      pickFirst(body.passenger_name, body.passengerName, body.mijoz_ismi),
    ),
    passenger_phone: normalizeString(
      pickFirst(body.passenger_phone, body.passengerPhone, body.telefon),
    ),
    seats: Number(
      pickFirst(body.seats, body.passenger_count, body.passengerCount, body.joylar_soni),
    ),
    full_car: normalizeBoolean(pickFirst(body.full_car, body.fullCar)),
    passenger_gender: normalizeString(
      pickFirst(
        body.passenger_gender,
        body.passengerGender,
        body.gender,
        body.genderPreference,
      ),
    ) || 'any',
    comment: normalizeString(pickFirst(body.comment, body.izoh)),
    telegram_user_id: pickFirst(body.telegram_user_id, body.telegramUserId),
  }
}

function validateBookingInput(body) {
  const value = normalizeBookingInput(body)

  if (!value.route || !VALID_ROUTES.includes(value.route)) {
    return {
      valid: false,
      error: `Invalid route. Must be one of: ${VALID_ROUTES.join(', ')}`,
    }
  }

  if (!value.date || !DATE_REGEX.test(value.date)) {
    return { valid: false, error: 'Invalid date. Expected format: YYYY-MM-DD' }
  }

  if (!value.time || !TIME_REGEX.test(value.time)) {
    return { valid: false, error: 'Invalid time. Expected format: HH:MM' }
  }

  if (!Number.isInteger(value.seats) || value.seats < 1 || value.seats > 4) {
    return { valid: false, error: 'seats must be an integer between 1 and 4' }
  }

  if (value.passenger_name && value.passenger_name.length < 2) {
    return {
      valid: false,
      error: 'passenger_name must be at least 2 characters when provided',
    }
  }

  if (value.passenger_phone && !PHONE_REGEX.test(value.passenger_phone)) {
    return {
      valid: false,
      error: 'Invalid phone. Expected format: +998XXXXXXXXX',
    }
  }

  if (!VALID_GENDERS.includes(value.passenger_gender)) {
    return {
      valid: false,
      error: `passenger_gender must be one of: ${VALID_GENDERS.join(', ')}`,
    }
  }

  if (value.comment.length > 1000) {
    return { valid: false, error: 'comment must be at most 1000 characters' }
  }

  return { valid: true, value }
  
  function normalizeRoute(route) {
  const normalized = normalizeString(route)
    .replace(/->/g, '→')
    .replace(/\s+/g, ' ')
    .trim()

  if (
    normalized.toLowerCase() === 'kokand → tashkent' ||
    normalized.toLowerCase() === 'kokand tashkent'
  ) {
    return 'Kokand → Tashkent'
  }

  if (
    normalized.toLowerCase() === 'tashkent → kokand' ||
    normalized.toLowerCase() === 'tashkent kokand'
  ) {
    return 'Tashkent → Kokand'
  }

  return normalized
}
}

module.exports = { validateBookingInput }
