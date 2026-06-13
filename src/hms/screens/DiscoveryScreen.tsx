import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Search, MapPin, Globe, Star, Plus, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { getSettings } from '../lib/settings'
import toast from 'react-hot-toast'
import type { HmsOutreachHotel } from '../types'

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  website?: string
  types?: string[]
  geometry?: { location: { lat: number; lng: number } }
  alreadyTracked?: boolean
  contactEmail?: string | null
  emailStatus?: 'idle' | 'searching' | 'found' | 'not_found'
}

export default function DiscoveryScreen() {
  const qc = useQueryClient()
  const [destination, setDestination] = useState('Bali')
  const [area, setArea] = useState('')
  const [starRating, setStarRating] = useState('5')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: existingHotels } = useQuery<HmsOutreachHotel[]>({
    queryKey: ['hms_outreach_all'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_outreach_hotels').select('name, website, google_place_id')
      return data ?? []
    },
  })

  async function search() {
    if (!area) { toast.error('Please enter an area to search'); return }
    setSearching(true)
    setResults([])
    setSelected(new Set())

    const settings = await getSettings()
    const apiKey = settings.google_places_api_key

    if (!apiKey) {
      toast.error('Google Places API key not configured. Go to Settings to add it.')
      setSearching(false)
      return
    }

    try {
      const query = `${starRating} star hotel ${area} ${destination}`
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

      // Note: direct API call from browser requires proxy or CORS-enabled endpoint
      // In production this should go through a Supabase Edge Function
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
      const data = await res.json()

      if (!data.results) {
        toast.error('No results from Google Places API. Check your API key.')
        setSearching(false)
        return
      }

      const places: PlaceResult[] = data.results.map((p: any) => {
        const existing = existingHotels?.find(
          h => h.google_place_id === p.place_id ||
            h.name.toLowerCase() === p.name.toLowerCase() ||
            (h.website && p.website && h.website.includes(p.website?.replace(/https?:\/\//, '').split('/')[0]))
        )
        return {
          place_id: p.place_id,
          name: p.name,
          formatted_address: p.formatted_address,
          rating: p.rating,
          website: p.website,
          types: p.types,
          geometry: p.geometry,
          alreadyTracked: !!existing,
          emailStatus: 'idle',
          contactEmail: null,
        }
      })

      setResults(places)
    } catch (err) {
      toast.error('Failed to search Google Places. Check your API key and try again.')
    }
    setSearching(false)
  }

  async function findEmail(placeId: string, website: string | undefined) {
    if (!website) {
      setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'not_found', contactEmail: null } : p))
      return
    }

    setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'searching' } : p))

    try {
      const res = await fetch('/api/extract-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }),
      })
      const data = await res.json()
      if (data.email) {
        setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'found', contactEmail: data.email } : p))
      } else {
        setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'not_found', contactEmail: null } : p))
      }
    } catch {
      setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'not_found' } : p))
    }
  }

  const addToOutreach = useMutation({
    mutationFn: async (places: PlaceResult[]) => {
      const { data: dest } = await supabase.from('hms_destinations').select('id').eq('name', destination).single()
      const records = places.map(p => ({
        name: p.name,
        destination_id: dest?.id,
        city: area,
        star_rating: parseInt(starRating),
        website: p.website ?? null,
        google_maps_url: p.geometry
          ? `https://maps.google.com/?q=${p.geometry.location.lat},${p.geometry.location.lng}`
          : null,
        contact_email: p.contactEmail ?? null,
        email_source: p.contactEmail ? 'extracted' : 'not_found',
        google_place_id: p.place_id,
        stage: 'Prospect',
      }))
      await supabase.from('hms_outreach_hotels').insert(records)
    },
    onSuccess: (_, places) => {
      qc.invalidateQueries({ queryKey: ['hms_outreach_all'] })
      setResults(r => r.map(p =>
        places.find(s => s.place_id === p.place_id) ? { ...p, alreadyTracked: true } : p
      ))
      setSelected(new Set())
      toast.success(`${places.length} hotel${places.length > 1 ? 's' : ''} added to outreach pipeline`)
    },
  })

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const selectedPlaces = results.filter(p => selected.has(p.place_id) && !p.alreadyTracked)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Hotel Discovery</h1>

      {/* Search form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
            <select className={inp} value={destination} onChange={e => setDestination(e.target.value)}>
              <option>Bali</option>
              <option>Thailand</option>
              <option>Vietnam</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Area *</label>
            <input className={inp} placeholder="e.g. Uluwatu" value={area} onChange={e => setArea(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Star rating</label>
            <select className={inp} value={starRating} onChange={e => setStarRating(e.target.value)}>
              <option value="4">4 stars</option>
              <option value="5">5 stars</option>
              <option value="4 or 5">4 & 5 stars</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={search}
              disabled={searching}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              <Search size={15} />
              {searching ? 'Searching…' : 'Search Hotels'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">{results.length} hotels found in {area}, {destination}</p>
            {selectedPlaces.length > 0 && (
              <button
                onClick={() => addToOutreach.mutate(selectedPlaces)}
                disabled={addToOutreach.isPending}
                className="flex items-center gap-2 bg-teal-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-teal-700 disabled:opacity-50"
              >
                <Plus size={15} />
                Add {selectedPlaces.length} to Outreach Pipeline
              </button>
            )}
          </div>

          <div className="space-y-3">
            {results.map(place => (
              <div
                key={place.place_id}
                className={`bg-white border rounded-xl p-4 transition-colors ${
                  place.alreadyTracked ? 'border-slate-200 opacity-60' :
                  selected.has(place.place_id) ? 'border-teal-400 bg-teal-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!place.alreadyTracked && (
                    <input
                      type="checkbox"
                      checked={selected.has(place.place_id)}
                      onChange={() => toggleSelect(place.place_id)}
                      className="mt-1 h-4 w-4 accent-teal-600"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{place.name}</span>
                      {place.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                          <Star size={11} fill="currentColor" /> {place.rating}
                        </span>
                      )}
                      {place.alreadyTracked && (
                        <span className="flex items-center gap-1 text-xs font-medium text-teal-600 bg-teal-100 rounded-full px-2 py-0.5">
                          <CheckCircle size={11} /> Already tracked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin size={11} /> {place.formatted_address}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {place.website && (
                        <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Globe size={11} /> Website
                        </a>
                      )}
                      {place.geometry && (
                        <a
                          href={`https://maps.google.com/?q=${place.geometry.location.lat},${place.geometry.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <MapPin size={11} /> Google Maps
                        </a>
                      )}
                    </div>

                    {/* Email extraction */}
                    <div className="mt-2">
                      {place.emailStatus === 'idle' && (
                        <button
                          onClick={() => findEmail(place.place_id, place.website)}
                          className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                          <Mail size={11} /> Find contact email
                        </button>
                      )}
                      {place.emailStatus === 'searching' && (
                        <span className="text-xs text-slate-400">Searching for email…</span>
                      )}
                      {place.emailStatus === 'found' && place.contactEmail && (
                        <span className="flex items-center gap-1 text-xs text-teal-700">
                          <CheckCircle size={11} /> {place.contactEmail}
                        </span>
                      )}
                      {place.emailStatus === 'not_found' && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <AlertCircle size={11} /> Only general form found — add manually
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !searching && (
        <div className="text-center py-16 text-slate-400">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>Search for hotels using Google Places to discover new partners.</p>
          <p className="text-xs mt-1">Requires a Google Places API key in Settings.</p>
        </div>
      )}
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'
