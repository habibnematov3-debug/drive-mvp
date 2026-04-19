import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '../utils/api'
import { buildTelegramAuthHeaders } from '../utils/telegram'
import type { RideRequest } from '../types/drivee'

// API response types
interface ApiResponse<T> {
  success?: boolean
  error?: string
  data?: T
}

interface BookingsResponse {
  requests?: RideRequest[]
}

// Custom hook for API calls with Telegram auth
function useTelegramApi() {
  const queryClient = useQueryClient()

  const apiCall = async <T>(
    endpoint: string,
    options?: RequestInit & { telegramUserId?: string }
  ): Promise<T> => {
    const apiBaseUrl = getApiBaseUrl()
    if (!apiBaseUrl) {
      throw new Error('API base URL not configured')
    }

    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...buildTelegramAuthHeaders(options?.telegramUserId),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    const contentType = response.headers.get('content-type') || ''

    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, got ${contentType}`)
    }

    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error('Invalid JSON response')
    }
  }

  return { apiCall, queryClient }
}

// Hook for fetching ride requests
export function useRideRequests(telegramUserId?: string) {
  const { apiCall } = useTelegramApi()

  return useQuery({
    queryKey: ['ride-requests', telegramUserId],
    queryFn: () => apiCall<BookingsResponse>('/requests', { telegramUserId }),
    select: (data) => data.requests || [],
    enabled: !!telegramUserId,
    staleTime: 30_000, // 30 seconds
    retry: 2,
  })
}

// Hook for submitting booking requests
export function useSubmitBooking() {
  const { apiCall, queryClient } = useTelegramApi()

  return useMutation({
    mutationFn: async ({
      payload,
      telegramUserId,
    }: {
      payload: any
      telegramUserId?: string
    }) => {
      const response = await apiCall<ApiResponse<{ booking_id: string }>>('/bookings', {
        method: 'POST',
        telegramUserId,
        body: JSON.stringify(payload),
      })

      if (!response.success || !response.data?.booking_id) {
        throw new Error(response.error || 'Booking failed')
      }

      return response.data.booking_id
    },
    onSuccess: () => {
      // Invalidate ride requests cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['ride-requests'] })
    },
    onError: (error) => {
      console.error('Booking submission failed:', error)
    },
  })
}

// Hook for Telegram authentication
export function useTelegramAuth() {
  const { apiCall } = useTelegramApi()

  return useMutation({
    mutationFn: async (initData: string) => {
      const response = await apiCall<ApiResponse<{ user: any }>>('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ initData }),
      })

      if (!response.success || !response.data?.user) {
        throw new Error(response.error || 'Authentication failed')
      }

      return response.data.user
    },
    onError: (error) => {
      console.error('Telegram auth failed:', error)
    },
  })
}
