import React, { createContext, useContext, useState } from 'react'
import type { Hotel, Tour, City, SessionSelection } from '../types'

interface HotelDates {
  checkIn: string
  checkOut: string
}

interface SessionContextValue {
  selections: SessionSelection[]
  toggleHotel: (hotel: Hotel, city: City) => void
  toggleTour: (tour: Tour, city: City) => void
  isSelected: (type: 'hotel' | 'tour', id: string) => boolean
  clearSession: () => void
  totalCount: number
  hotelDates: Record<string, HotelDates>
  setHotelDates: (hotelId: string, dates: HotelDates) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<SessionSelection[]>([])
  const [hotelDates, setHotelDatesMap] = useState<Record<string, HotelDates>>({})

  const toggleHotel = (hotel: Hotel, city: City) => {
    setSelections(prev => {
      const exists = prev.some(s => s.type === 'hotel' && s.id === hotel.id)
      if (exists) {
        return prev.filter(s => !(s.type === 'hotel' && s.id === hotel.id))
      }
      return [...prev, {
        type: 'hotel',
        id: hotel.id,
        name: hotel.name,
        cityName: city.name,
        details: hotel.room_types.join(', '),
      }]
    })
  }

  const toggleTour = (tour: Tour, city: City) => {
    setSelections(prev => {
      const exists = prev.some(s => s.type === 'tour' && s.id === tour.id)
      if (exists) {
        return prev.filter(s => !(s.type === 'tour' && s.id === tour.id))
      }
      return [...prev, {
        type: 'tour',
        id: tour.id,
        name: tour.name,
        cityName: city.name,
        details: tour.category,
      }]
    })
  }

  const isSelected = (type: 'hotel' | 'tour', id: string) => {
    return selections.some(s => s.type === type && s.id === id)
  }

  const setHotelDates = (hotelId: string, dates: HotelDates) => {
    setHotelDatesMap(prev => ({ ...prev, [hotelId]: dates }))
  }

  const clearSession = () => {
    setSelections([])
    setHotelDatesMap({})
  }

  return (
    <SessionContext.Provider value={{
      selections,
      toggleHotel,
      toggleTour,
      isSelected,
      clearSession,
      totalCount: selections.length,
      hotelDates,
      setHotelDates,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
