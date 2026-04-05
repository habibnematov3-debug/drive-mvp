const ROUTE_LABELS_BY_ID = {
  'kokand-tashkent': 'Kokand → Tashkent',
  'tashkent-kokand': 'Tashkent → Kokand',
}

const VALID_ROUTE_IDS = Object.keys(ROUTE_LABELS_BY_ID)
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

function normalizeRouteId(routeId) {
  const normalized = normalizeString(routeId).toLowerCase()
  return VALID_ROUTE_IDS.includes(normalized) ? normalized : ''
}

function normalizeRouteLabel(route) {
  const normalized = normalizeString(route)
    .replace(/->/g, '→')
    .replace(/\s+/g, ' ')
    .trim()

  if (
    normalized.toLowerCase() === 'kokand → tashkent' ||
    normalized.toLowerCase() === 'kokand tashkent'
  ) {
    return ROUTE_LABELS_BY_ID['kokand-tashkent']
  }

  if (
    normalized.toLowerCase() === 'tashkent → kokand' ||
    normalized.toLowerCase() === 'tashkent kokand'
  ) {
    return ROUTE_LABELS_BY_ID['tashkent-kokand']
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
  const routeId = normalizeRouteId(
    pickFirst(body.route_id, body.routeId, body.yonalish_id),
  )

  return {
    route_id: routeId,
    route: routeId
      ? ROUTE_LABELS_BY_ID[routeId]
      : normalizeRouteLabel(body.route),
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
    has_bag: normalizeBoolean(pickFirst(body.has_bag, body.hasBag, body.bag)),
    passenger_gender: normalizeString(
      pickFirst(
        body.passenger_gender,
        body.passengerGender,
        body.gender,
        body.genderPreference,
      ),
    ) || 'any',
    comment: normalizeString(pickFirst(body.comment, body.izoh)),
  }
}

function validateBookingInput(body) {
  const value = normalizeBookingInput(body)

  if (!value.route_id || !VALID_ROUTE_IDS.includes(value.route_id)) {
    return {
      valid: false,
      error: `route_id must be one of: ${VALID_ROUTE_IDS.join(', ')}`,
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

  if (!value.passenger_phone) {
    return {
      valid: false,
      error: 'passenger_phone is required',
    }
  }

  if (!PHONE_REGEX.test(value.passenger_phone)) {
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
}

module.exports = { validateBookingInput }
