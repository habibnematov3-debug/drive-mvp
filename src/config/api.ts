const LOCAL_API_BASE_URL = 'http://localhost:3000'

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl)
  }

  if (import.meta.env.DEV) {
    return LOCAL_API_BASE_URL
  }

  throw new Error(
    'VITE_API_BASE_URL is not configured. Set it in your deployment environment and redeploy.',
  )
}

export function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath
}
