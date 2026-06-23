import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, Map } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSession } from '../context/SessionContext'
import HotelCard from '../components/HotelCard'
import TourCard from '../components/TourCard'
import type { City, Hotel, Tour } from '../types'

const TOUR_CATEGORIES = ['All', 'Romantic', 'Adventure', 'Cultural', 'Nature', 'Water', 'Nightlife', 'Beach Club'] as const

type Tab = 'hotels' | 'tours'

function getHotelGroup(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('luxury resort') || n.includes('resort & spa') || n.includes('resort and spa')) return 'Resorts & Spas'
  if (n.includes('villa')) return 'Villas'
  if (n.includes('resort')) return 'Resorts'
  return 'Boutique & Other'
}

export default function AreaScreen() {
  const { cityId } = useParams<{ cityId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const destSlug = location.pathname.split('/')[1] // 'bali' or 'vietnam'
  const { totalCount } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('hotels')
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

  // Group hotels by type
  const hotelGroups: Record<string, Hotel[]> = {}
  for (const hotel of hotels ?? []) {
    const group = getHotelGroup(hotel.name)
    if (!hotelGroups[group]) hotelGroups[group] = []
    hotelGroups[group].push(hotel)
  }
  const groupOrder = ['Resorts & Spas', 'Resorts', 'Villas', 'Boutique & Other']
  const sortedGroups = groupOrder.filter(g => hotelGroups[g]?.length > 0)

  const hotelCount = hotels?.length ?? 0
  const tourCount = tours?.length ?? 0

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
          <button onClick={() => navigate('/' + destSlug)} className="text-terracotta-500 underline">Back to Bali</button>
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
            onClick={() => navigate('/' + destSlug)}
            className="flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-body text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            {destSlug.charAt(0).toUpperCase() + destSlug.slice(1)}
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

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex gap-1 bg-white border border-ivory-300 rounded-xl p-1 w-fit shadow-sm">
          {city.has_hotels && (
            <button
              onClick={() => setActiveTab('hotels')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-body font-medium transition-all ${
                activeTab === 'hotels'
                  ? 'bg-terracotta-500 text-white shadow-sm'
                  : 'text-stone-500 hover:text-terracotta-600 hover:bg-ivory-100'
              }`}
            >
              <Building2 size={15} />
              Hotels & Villas
              {hotelCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'hotels' ? 'bg-white/20 text-white' : 'bg-ivory-200 text-stone-500'}`}>
                  {hotelCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('tours')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-body font-medium transition-all ${
              activeTab === 'tours'
                ? 'bg-terracotta-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-terracotta-600 hover:bg-ivory-100'
            }`}
          >
            <Map size={15} />
            Tours & Experiences
            {tourCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'tours' ? 'bg-white/20 text-white' : 'bg-ivory-200 text-stone-500'}`}>
                {tourCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 pb-16">

        {/* Hotels tab */}
        {activeTab === 'hotels' && city.has_hotels && (
          <div className="space-y-10">
            {loadingHotels ? (
              <p className="font-body text-gray-400 italic">Loading hotels...</p>
            ) : !hotels || hotels.length === 0 ? (
              <p className="font-body text-gray-400 italic">No hotels listed yet for this area.</p>
            ) : (
              sortedGroups.map(group => (
                <section key={group}>
                  <h2 className="font-display text-2xl text-terracotta-700 mb-4 pb-2 border-b border-ivory-300">
                    {group}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotelGroups[group].map(hotel => (
                      <HotelCard key={hotel.id} hotel={hotel} city={city} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}

        {/* Tours tab */}
        {activeTab === 'tours' && (
          <div>
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
          </div>
        )}
      </div>
    </div>
  )
}
