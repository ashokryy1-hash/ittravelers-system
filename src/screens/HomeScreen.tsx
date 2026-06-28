import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Destination } from '../types'
import { useBasePath } from '../context/TripExplorerContext'

const DESTINATIONS = [
  {
    slug: 'bali',
    fallbackImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    comingSoon: false,
  },
  {
    slug: 'thailand',
    fallbackImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
    comingSoon: true,
    name: 'Thailand',
    country: 'Thailand',
  },
  {
    slug: 'vietnam',
    fallbackImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    comingSoon: true,
    name: 'Vietnam',
    country: 'Vietnam',
  },
]

export default function HomeScreen() {
  const navigate = useNavigate()
  const basePath = useBasePath()

  const { data: destinations } = useQuery<Destination[]>({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('*')
      if (error) throw error
      return data ?? []
    },
  })

  const baliDest = destinations?.find(d => d.name === 'Bali')

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col">
      {/* Header */}
      <header className="text-center pt-16 pb-10 px-6">
        <h1 className="font-display text-6xl md:text-7xl text-terracotta-700 tracking-tight leading-none">
          ITTravelers
        </h1>
        <p className="font-display italic text-2xl md:text-3xl text-terracotta-400 mt-2">
          Trip Explorer
        </p>
        <p className="font-body text-sm text-gray-400 mt-4 uppercase tracking-widest">
          Internal Use Only
        </p>
      </header>

      {/* Destination Cards */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pb-16">
        <p className="font-display text-center text-xl text-gray-500 italic mb-8">
          Select a destination to begin exploring
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bali */}
          <button
            onClick={() => navigate(`${basePath}/bali`)}
            className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 aspect-[3/4] cursor-pointer"
          >
            <img
              src={baliDest?.cover_image_url || DESTINATIONS[0].fallbackImage}
              alt="Bali"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-terracotta-900/80 via-terracotta-800/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
              <p className="font-body text-ivory-200 text-xs uppercase tracking-widest mb-1">Indonesia</p>
              <h2 className="font-display text-white text-4xl">Bali</h2>
              <p className="font-body text-ivory-300 text-sm mt-1">Explore →</p>
            </div>
          </button>

          {/* Thailand */}
          <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[3/4]">
            <img
              src={DESTINATIONS[1].fallbackImage}
              alt="Thailand"
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-700/20 to-transparent" />
            <div className="absolute top-4 right-4">
              <span className="bg-gray-700/80 text-gray-200 text-xs font-body font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
              <p className="font-body text-gray-400 text-xs uppercase tracking-widest mb-1">Thailand</p>
              <h2 className="font-display text-gray-300 text-4xl">Thailand</h2>
            </div>
          </div>

          {/* Vietnam */}
          <button
            onClick={() => navigate(`${basePath}/vietnam`)}
            className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 aspect-[3/4] cursor-pointer"
          >
            <img
              src={DESTINATIONS[2].fallbackImage}
              alt="Vietnam"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-terracotta-900/80 via-terracotta-800/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
              <p className="font-body text-ivory-200 text-xs uppercase tracking-widest mb-1">Vietnam</p>
              <h2 className="font-display text-white text-4xl">Vietnam</h2>
              <p className="font-body text-ivory-300 text-sm mt-1">Explore →</p>
            </div>
          </button>
        </div>
      </main>

      <footer className="text-center pb-8">
        <button
          onClick={() => navigate(`${basePath}/admin`)}
          className="font-body text-xs text-gray-300 hover:text-gray-500 transition-colors uppercase tracking-widest"
        >
          Admin
        </button>
      </footer>
    </div>
  )
}
