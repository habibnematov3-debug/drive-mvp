type FetchRetryOptions = {
  retries?: number
  timeoutMs?: number
  initialDelayMs?: number
  backoffMultiplier?: number
  retryStatuses?: number[]
}

const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504]

function isRetriableNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false
  if (error.name === 'TypeError') return true
  if (error.name === 'AbortError') return true

  const normalized = error.message.toLowerCase()
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network request failed') ||
    normalized.includes('load failed')
  )
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

async function waitWithAbort(ms: number, signal?: AbortSignal) {
  if (ms <= 0) return

  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timerId = window.setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const cleanup = () => {
      window.clearTimeout(timerId)
      signal?.removeEventListener('abort', onAbort)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchRetryOptions = {},
) {
  const {
    retries = 2,
    timeoutMs = 15_000,
    initialDelayMs = 1_200,
    backoffMultiplier = 1.7,
    retryStatuses = DEFAULT_RETRY_STATUSES,
  } = options

  let attempt = 0
  let delayMs = initialDelayMs
  let lastError: unknown = null

  while (attempt <= retries) {
    if (init.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const timeoutController = new AbortController()
    const timerId = window.setTimeout(() => {
      timeoutController.abort()
    }, timeoutMs)

    const requestController = new AbortController()
    const forwardAbort = () => requestController.abort()
    const forwardTimeoutAbort = () => requestController.abort()

    try {
      init.signal?.addEventListener('abort', forwardAbort, { once: true })
      timeoutController.signal.addEventListener('abort', forwardTimeoutAbort, {
        once: true,
      })

      const response = await fetch(input, {
        ...init,
        signal: requestController.signal,
      })

      if (!retryStatuses.includes(response.status) || attempt === retries) {
        return response
      }
    } catch (error) {
      if (init.signal?.aborted) {
        throw error
      }

      if (!isRetriableNetworkError(error) || attempt === retries) {
        throw error
      }

      lastError = error
    } finally {
      window.clearTimeout(timerId)
      init.signal?.removeEventListener('abort', forwardAbort)
      timeoutController.signal.removeEventListener('abort', forwardTimeoutAbort)
    }

    attempt += 1

    try {
      await waitWithAbort(delayMs, init.signal ?? undefined)
    } catch (waitError) {
      if (isAbortError(waitError)) {
        throw waitError
      }
    }
    delayMs = Math.round(delayMs * backoffMultiplier)
  }

  if (lastError) {
    throw lastError
  }

  throw new Error('Request failed after retries')
}
