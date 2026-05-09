import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { DriveeActions, DriveeState } from '../state/driveeStore'
import { createInitialState, reduceState } from '../state/driveeStore'

type DriveeContextValue = {
  state: DriveeState
  actions: DriveeActions
}

const DriveeContext = createContext<DriveeContextValue | undefined>(undefined)

export function DriveeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduceState, undefined, createInitialState)

  const actions: DriveeActions = useMemo(
    () => ({
      setRole: (role) => dispatch({ type: 'setRole', payload: role }),
      setIdentity: (identity) => dispatch({ type: 'setIdentity', payload: identity }),
      setLocation: (location) => dispatch({ type: 'setLocation', payload: location }),
      clearLocation: () => dispatch({ type: 'clearLocation' }),
      createPassengerRequest: (payload) => {
        dispatch({ type: 'createPassengerRequest', payload })
      },
      applyToRequestAsDriver: (requestId, payload) =>
        dispatch({ type: 'applyToRequestAsDriver', payload: { requestId, payload } }),
      selectDriverForRequest: (requestId, driverId) =>
        dispatch({ type: 'selectDriverForRequest', payload: { requestId, driverId } }),
      submitRating: (ratingId, rating) =>
        dispatch({ type: 'submitRating', payload: { ratingId, rating } }),
    }),
    [],
  )

  return <DriveeContext.Provider value={{ state, actions }}>{children}</DriveeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDrivee() {
  const ctx = useContext(DriveeContext)
  if (!ctx) throw new Error('useDrivee must be used within DriveeProvider')
  return ctx
}

