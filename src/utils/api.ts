const DEV_API_BASE_URL = 'http://localhost:3000'

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')

  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  // Local browser development runs frontend and backend on the default ports.
  if (import.meta.env.DEV) {
    return DEV_API_BASE_URL
  }

  return ''
}
