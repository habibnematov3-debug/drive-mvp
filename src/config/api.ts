const LOCAL_API_BASE_URL = 'http://localhost:3000'

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl)
  }

  return import.meta.env.DEV ? LOCAL_API_BASE_URL : ''
}

export function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath
}
