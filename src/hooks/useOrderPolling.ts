import { useCallback, useEffect, useRef, useState } from 'react'
import type { RideRequest } from '../types/drivee'
import { getApiBaseUrl } from '../utils/api'
import { fetchWithRetry } from '../utils/network'
import { buildTelegramAuthHeaders } from '../utils/telegram'

interface UseOrderPollingOptions {
  enabled?: boolean
  pollIntervalMs?: number
  telegramUserId?: string
}

interface UseOrderPollingResult {
  orders: RideRequest[]
  isRefreshing: boolean
  refresh: (options?: { manual?: boolean; showIndicator?: boolean }) => Promise<void>
}

const INITIAL_BACKOFF_MS = 10_000
const MAX_BACKOFF_MS = 40_000
const BACKOFF_MULTIPLIER = 2

/**
 * Hook for polling booking orders with exponential backoff on errors
 * Automatically stops polling when not visible
 * Returns { orders, isRefreshing, refresh }
 */
export function useOrderPolling(
  options: UseOrderPollingOptions = {},
): UseOrderPollingResult {
  const {
    enabled = true,
    pollIntervalMs = 10_000,
    telegramUserId,
  } = options

  const [orders, setOrders] = useState<RideRequest[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  )

  const etagRef = useRef('')
  const refreshInFlightRef = useRef(false)
  const backoffRef = useRef(INITIAL_BACKOFF_MS)
  const nextPollTimeRef = useRef(0)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(
    async (options?: { manual?: boolean; showIndicator?: boolean }) => {
      const manual = options?.manual ?? false
      const showIndicator = options?.showIndicator ?? true

      if (refreshInFlightRef.current) {
        return
      }

      if (
        !manual &&
        typeof document !== 'undefined' &&
        document.visibilityState !== 'visible'
      ) {
        return
      }

      const apiBaseUrl = getApiBaseUrl()

      if (!apiBaseUrl) {
        return
      }

      refreshInFlightRef.current = true

      if (showIndicator) {
        setIsRefreshing(true)
      }

      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
          ...buildTelegramAuthHeaders(telegramUserId),
        }

        if (etagRef.current) {
          headers['If-None-Match'] = etagRef.current
        }

        const response = await fetchWithRetry(
          `${apiBaseUrl}/requests`,
          {
            method: 'GET',
            headers,
          },
          {
            retries: 1,
            timeoutMs: 12_000,
            initialDelayMs: 700,
          },
        )

        if (response.status === 304) {
          // No changes
          backoffRef.current = INITIAL_BACKOFF_MS
          return
        }

        const responseBody = await response.text()
        const contentType = response.headers.get('content-type') ?? ''

        if (!contentType.includes('application/json')) {
          throw new Error('Invalid response format')
        }

        const result = JSON.parse(responseBody) as {
          success?: boolean
          error?: string
          requests?: RideRequest[]
        }

        if (!response.ok || !result.success || !Array.isArray(result.requests)) {
          throw new Error(result.error || 'Failed to load orders')
        }

        const nextEtag = String(response.headers.get('etag') || '').trim()
        if (nextEtag) {
          etagRef.current = nextEtag
        }

        setOrders(result.requests)
        backoffRef.current = INITIAL_BACKOFF_MS
      } catch (error) {
        // Exponential backoff on error
        backoffRef.current = Math.min(
          backoffRef.current * BACKOFF_MULTIPLIER,
          MAX_BACKOFF_MS,
        )
        console.error('[useOrderPolling] Refresh failed:', error)
      } finally {
        refreshInFlightRef.current = false

        if (showIndicator) {
          setIsRefreshing(false)
        }
      }
    },
    [telegramUserId],
  )

  // Visibility change handler
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      setIsDocumentVisible(isVisible)

      if (isVisible) {
        // Refresh immediately when becoming visible
        void refresh({ manual: false, showIndicator: false })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh])

  // Auto-polling effect
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return
    }

    const schedulePoll = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }

      if (!isDocumentVisible) {
        // Don't poll when not visible, but schedule check
        pollTimeoutRef.current = setTimeout(() => schedulePoll(), pollIntervalMs)
        return
      }

      const now = Date.now()
      const delay = Math.max(0, nextPollTimeRef.current - now)

      pollTimeoutRef.current = setTimeout(async () => {
        nextPollTimeRef.current = Date.now() + backoffRef.current
        await refresh({ manual: false, showIndicator: false })
        schedulePoll()
      }, delay || backoffRef.current)
    }

    schedulePoll()

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [enabled, isDocumentVisible, pollIntervalMs, refresh])

  return {
    orders,
    isRefreshing,
    refresh,
  }
}
