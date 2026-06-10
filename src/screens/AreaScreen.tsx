import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSession } from '../context/SessionContext'
import HotelCard from '../components/HotelCard'
import TourCard from '../components/TourCard'
import type { City, Hotel, Tour } from '../types'

const TOUR_CATEGORIES = ['All', 'Romantic', 'Adventure', 'Cultural', 'Nature', 'Water', 'Nightlife', 'Beach Club'] as const

export default function AreaScreen() {
  const { cityId } = useParams<{ cityId: string }>()
  const navigate = useNavigate()
  const { totalCount } = useSession()
  const [tourCategory, setTourCategory] = useState<string>('All')

  const { data: city, isLoading: loadingCity } = useQuery<City | null>({
    queryKey: ['city', cityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('id', cityId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!cityId,
  })

  const { data: hotels, isLoading: loadingHotels } = useQuery<Hotel[]>({
    queryKey: ['hotels', cityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorer_hotels')
        .select('*')
        .eq('city_id', cityId!)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
    enabled: !!cityId && !!city?.has_hotels,
  })

  const { data: tours, isLoading: loadingTours } = useQuery<Tour[]>({
    queryKey: ['tours', cityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_cities')
        .select('tour_id')
        .eq('city_id', cityId!)
      if (error) throw error
      const tourIds = (data ?? []).map(tc => tc.tour_id)
      if (tourIds.length === 0) return []
      const { data: tourData, error: tourError } = await supabase
        .from('explorer_tours')
        .select('*')
        .in('id', tourIds)
        .order('sort_order')
      if (tourError) throw tourError
      return tourData ?? []
    },
    enabled: !!cityId,
  })

  const filteredTours = tours?.filter(
    t => tourCategory === 'All' || t.category === tourCategory
  ) ?? []

  if (loadingCity) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <p className="font-display italic text-xl text-terracotta-400">Loading area...</p>
      </div>
    )
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-gray-500 mb-4">Area not found.</p>
          <button onClick={() => navigate('/bali')} className="text-terracotta-500 underline">Back to Bali</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Header bar */}
      <div className="bg-white border-b border-ivory-300 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/bali')}
            className="flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-body text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Bali
          </button>
          {totalCount > 0 && (
            <button
              onClick={() => navigate('/summary')}
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-1.5 rounded-full text-sm font-body font-medium shadow transition-colors"
            >
              {totalCount} selected
            </button>
          )}
        </div>
      </div>

      {/* Area heading */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-6">
        <h1 className="font-display text-5xl text-terracotta-800">{city.name}</h1>
        {city.vibe_tagline && (
          <p className="font-display italic text-lg text-gray-400 mt-2">{city.vibe_tagline}</p>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-12">
        {/* Hotels section */}
        {city.has_hotels && (
          <section>
            <h2 className="font-display text-3xl text-terracotta-700 mb-6 pb-2 border-b border-ivory-300">
              Hotels & Villas
            </h2>
            {loadingHotels ? (
              <p className="font-body text-gray-400 italic">Loading hotels...</p>
            ) : !hotels || hotels.length === 0 ? (
              <p className="font-body text-gray-400 italic">No hotels listed yet for this area.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotels.map(hotel => (
                  <HotelCard key={hotel.id} hotel={hotel} city={city} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tours section */}
        <section>
          <h2 className="font-display text-3xl text-terracotta-700 mb-4 pb-2 border-b border-ivory-300">
            Tours & Experiences
          </h2>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TOUR_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setTourCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-body font-medium border transition-colors ${
                  tourCategory === cat
                    ? 'bg-terracotta-500 text-white border-terracotta-500'
                    : 'bg-white text-gray-500 border-ivory-300 hover:border-terracotta-300 hover:text-terracotta-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingTours ? (
            <p className="font-body text-gray-400 italic">Loading tours...</p>
          ) : filteredTours.length === 0 ? (
            <p className="font-body text-gray-400 italic">No tours available in this category for {city.name}.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTours.map(tour => (
                <TourCard key={tour.id} tour={tour} city={city} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
