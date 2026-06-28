import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSession } from '../context/SessionContext'
import { useBasePath } from '../context/TripExplorerContext'
import SelectionCounter from '../components/SelectionCounter'
import type { Destination, City } from '../types'

export default function VietnamScreen() {
  const navigate = useNavigate()
  const basePath = useBasePath()
  const { totalCount } = useSession()

  const { data: destination, isLoading: loadingDest } = useQuery<Destination | null>({
    queryKey: ['destination', 'vietnam'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('name', 'Vietnam')
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: cities, isLoading: loadingCities } = useQuery<City[]>({
    queryKey: ['cities', destination?.id],
    enabled: !!destination?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('destination_id', destination!.id)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  if (loadingDest || loadingCities) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <p className="font-display italic text-xl text-terracotta-400">Loading Vietnam...</p>
      </div>
    )
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-gray-500 mb-4">Vietnam not found. Have you run the SQL migration?</p>
          <button onClick={() => navigate(`${basePath}/`)} className="text-terracotta-500 underline">Go back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory-100">
      <SelectionCounter />

      {/* Hero */}
      <div className="relative h-72 md:h-96">
        <img
          src={destination.cover_image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200'}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-terracotta-900/70 via-terracotta-800/20 to-transparent" />
        <button
          onClick={() => navigate(`${basePath}/`)}
          className="absolute top-4 left-4 flex items-center gap-2 text-white/90 hover:text-white font-body text-sm transition-colors bg-black/20 hover:bg-black/30 px-3 py-2 rounded-full"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {totalCount > 0 && (
          <button
            onClick={() => navigate(`${basePath}/summary`)}
            className="absolute top-4 right-4 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-full text-sm font-body font-medium shadow-lg transition-colors"
          >
            {totalCount} selected
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h1 className="font-display text-5xl md:text-7xl text-white leading-none">
            {destination.name}
          </h1>
          <p className="font-body text-ivory-200 text-sm mt-1">{destination.country}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Vibe */}
        <p className="font-display italic text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mb-6">
          {destination.vibe_description}
        </p>

        {/* Mood Tags */}
        {destination.mood_tags && destination.mood_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {destination.mood_tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-body font-medium bg-dusty-rose-100 text-dusty-rose-500 border border-dusty-rose-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* City Cards */}
        <div className="mb-6">
          <h2 className="font-display text-2xl text-terracotta-700 mb-4">Explore by City</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-fr">
            {(cities ?? []).map((city) => (
              <button
                key={city.id}
                onClick={() => navigate(`${basePath}/vietnam/${city.id}`)}
                className="group text-left rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all relative"
              >
                {city.cover_image_url ? (
                  <>
                    <div className="h-36 w-full overflow-hidden">
                      <img
                        src={city.cover_image_url}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-display text-xl text-white leading-tight">{city.name}</h3>
                      <p className="font-body text-xs text-white/75 mt-0.5 italic">{city.vibe_tagline}</p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-white hover:bg-terracotta-50 border border-ivory-300 hover:border-terracotta-300 rounded-xl transition-all h-36 flex flex-col justify-between">
                    <h3 className="font-display text-xl text-terracotta-700 group-hover:text-terracotta-600">
                      {city.name}
                    </h3>
                    <p className="font-body text-xs text-gray-400 italic">{city.vibe_tagline}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
