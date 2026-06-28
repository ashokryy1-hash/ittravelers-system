import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Search, MapPin, Globe, Star, Plus, Mail, AlertCircle, CheckCircle, Edit2, Bookmark, Trash2 } from 'lucide-react'
import { getSettings } from '../lib/settings'
import toast from 'react-hot-toast'
import type { HmsOutreachHotel } from '../types'

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  website?: string
  geometry?: { location: { lat: number; lng: number } }
  alreadyTracked?: boolean
  contactEmail?: string | null
  emailStatus?: 'idle' | 'searching' | 'found' | 'not_found' | 'manual'
}

interface SavedHotel {
  id: string
  place_id: string
  name: string
  formatted_address: string | null
  destination: string | null
  area: string | null
  rating: number | null
  website: string | null
  google_maps_url: string | null
  contact_email: string | null
  added_to_outreach: boolean
  created_at: string
}

export default function DiscoveryScreen() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'search' | 'saved'>('search')
  const [destination, setDestination] = useState('Bali')
  const [area, setArea] = useState('')
  const [starRating, setStarRating] = useState('5')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [savedSelected, setSavedSelected] = useState<Set<string>>(new Set())

  const { data: existingHotels } = useQuery<HmsOutreachHotel[]>({
    queryKey: ['hms_outreach_all'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_outreach_hotels').select('name, website, google_place_id')
      return data ?? []
    },
  })

  const { data: savedHotels } = useQuery<SavedHotel[]>({
    queryKey: ['hms_discovery_saved'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_discovery_saved')
        .select('*')
        .order('created_at', { ascending: false })
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
      const query = starRating === 'boutique'
        ? `boutique hotel ${area} ${destination}`
        : `${starRating} star hotel ${area} ${destination}`

      const res = await fetch('/api/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, apiKey }),
      })
      const data = await res.json()

      if (!data.results) {
        toast.error('No results from Google Places API. Check your API key.')
        setSearching(false)
        return
      }

      const places: PlaceResult[] = data.results.map((p: any) => {
        const existing = existingHotels?.find(
          h => h.google_place_id === p.place_id ||
            h.name.toLowerCase() === p.name.toLowerCase()
        )
        return {
          place_id: p.place_id,
          name: p.name,
          formatted_address: p.formatted_address,
          rating: p.rating,
          website: p.website,
          geometry: p.geometry,
          alreadyTracked: !!existing,
          emailStatus: 'idle',
          contactEmail: null,
        }
      })

      setResults(places)

      // Auto-save all results to database (upsert so duplicates are ignored)
      const savedRecords = places.map(p => ({
        place_id: p.place_id,
        name: p.name,
        formatted_address: p.formatted_address ?? null,
        destination,
        area,
        rating: p.rating ?? null,
        website: p.website ?? null,
        google_maps_url: p.geometry
          ? `https://maps.google.com/?q=${p.geometry.location.lat},${p.geometry.location.lng}`
          : null,
      }))
      await supabase.from('hms_discovery_saved').upsert(savedRecords, { onConflict: 'place_id', ignoreDuplicates: true })
      qc.invalidateQueries({ queryKey: ['hms_discovery_saved'] })

    } catch {
      toast.error('Failed to search Google Places. Check your API key and try again.')
    }
    setSearching(false)
  }

  async function findEmail(placeId: string, website: string | undefined) {
    if (!website) {
      setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'not_found' } : p))
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
        setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'not_found' } : p))
      }
    } catch {
      setResults(r => r.map(p => p.place_id === placeId ? { ...p, emailStatus: 'not_found' } : p))
    }
  }

  const addToOutreach = useMutation({
    mutationFn: async (places: Array<{ place_id: string; name: string; website?: string | null; google_maps_url?: string | null; contactEmail?: string | null; formatted_address?: string | null; rating?: number | null }>) => {
      const { data: dest } = await supabase.from('hms_destinations').select('id').eq('name', destination).single()
      const records = places.map(p => ({
        name: p.name,
        destination_id: dest?.id,
        city: area || (savedHotels?.find(s => s.place_id === p.place_id)?.area ?? ''),
        star_rating: starRating === 'boutique' ? null : parseInt(starRating),
        website: p.website ?? null,
        google_maps_url: p.google_maps_url ?? null,
        contact_email: p.contactEmail ?? null,
        email_source: p.contactEmail ? 'extracted' : 'not_found',
        google_place_id: p.place_id,
        stage: 'Prospect',
      }))
      await supabase.from('hms_outreach_hotels').insert(records)
      // Mark as added in saved table
      await supabase.from('hms_discovery_saved')
        .update({ added_to_outreach: true })
        .in('place_id', places.map(p => p.place_id))
    },
    onSuccess: (_, places) => {
      qc.invalidateQueries({ queryKey: ['hms_outreach_all'] })
      qc.invalidateQueries({ queryKey: ['hms_discovery_saved'] })
      setResults(r => r.map(p => places.find(s => s.place_id === p.place_id) ? { ...p, alreadyTracked: true } : p))
      setSelected(new Set())
      setSavedSelected(new Set())
      toast.success(`${places.length} hotel${places.length > 1 ? 's' : ''} added to outreach pipeline`)
    },
  })

  const deleteSaved = useMutation({
    mutationFn: async (ids: string[]) => {
      await supabase.from('hms_discovery_saved').delete().in('id', ids)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hms_discovery_saved'] })
      setSavedSelected(new Set())
    },
  })

  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSavedSelect(id: string) {
    setSavedSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const selectedPlaces = results.filter(p => selected.has(p.place_id) && !p.alreadyTracked)
  const selectedSaved = (savedHotels ?? []).filter(h => savedSelected.has(h.id) && !h.added_to_outreach)

  const savedByDest = (savedHotels ?? []).reduce<Record<string, SavedHotel[]>>((acc, h) => {
    const key = `${h.destination} — ${h.area}`
    if (!acc[key]) acc[key] = []
    acc[key].push(h)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Hotel Discovery</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {([['search', 'Search'], ['saved', `Saved (${savedHotels?.length ?? 0})`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-terracotta-600 text-terracotta-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Hotel type</label>
                <select className={inp} value={starRating} onChange={e => setStarRating(e.target.value)}>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="4 or 5">4 & 5 stars</option>
                  <option value="boutique">Boutique</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={search}
                  disabled={searching}
                  className="w-full flex items-center justify-center gap-2 bg-terracotta-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-terracotta-700 disabled:opacity-50"
                >
                  <Search size={15} />
                  {searching ? 'Searching…' : 'Search Hotels'}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
              <Bookmark size={11} /> Results are automatically saved to the Saved tab
            </p>
          </div>

          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500">{results.length} hotels found in {area}, {destination}</p>
                {selectedPlaces.length > 0 && (
                  <button
                    onClick={() => addToOutreach.mutate(selectedPlaces.map(p => ({ ...p, google_maps_url: p.geometry ? `https://maps.google.com/?q=${p.geometry.location.lat},${p.geometry.location.lng}` : null })))}
                    disabled={addToOutreach.isPending}
                    className="flex items-center gap-2 bg-terracotta-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-terracotta-700 disabled:opacity-50"
                  >
                    <Plus size={15} /> Add {selectedPlaces.length} to Outreach Pipeline
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {results.map(place => (
                  <PlaceCard
                    key={place.place_id}
                    place={place}
                    selected={selected.has(place.place_id)}
                    onToggle={() => toggleSelect(place.place_id)}
                    onEmailChange={setResults}
                    onFindEmail={() => findEmail(place.place_id, place.website)}
                  />
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && !searching && (
            <div className="text-center py-16 text-slate-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p>Search for hotels using Google Places to discover new partners.</p>
              <p className="text-xs mt-1">Results are automatically saved so you can come back later.</p>
            </div>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div>
          {Object.keys(savedByDest).length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
              <p>No saved hotels yet. Search and results will appear here automatically.</p>
            </div>
          ) : (
            <>
              {/* Bulk action bar */}
              {(savedSelected.size > 0 || selectedSaved.length > 0) && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl">
                  <span className="text-sm text-terracotta-700 font-medium">{savedSelected.size} selected</span>
                  {selectedSaved.length > 0 && (
                    <button
                      onClick={() => addToOutreach.mutate(selectedSaved.map(h => ({
                        place_id: h.place_id, name: h.name, website: h.website,
                        google_maps_url: h.google_maps_url, contactEmail: h.contact_email,
                      })))}
                      disabled={addToOutreach.isPending}
                      className="flex items-center gap-1 text-sm bg-terracotta-600 text-white rounded-lg px-3 py-1.5 hover:bg-terracotta-700 disabled:opacity-50"
                    >
                      <Plus size={14} /> Add to Outreach Pipeline
                    </button>
                  )}
                  <button
                    onClick={() => deleteSaved.mutate(Array.from(savedSelected))}
                    className="flex items-center gap-1 text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}

              {Object.entries(savedByDest).map(([group, hotels]) => (
                <div key={group} className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{group}</div>
                  <div className="space-y-2">
                    {hotels.map(h => (
                      <div
                        key={h.id}
                        className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${
                          h.added_to_outreach ? 'opacity-50 border-slate-200' :
                          savedSelected.has(h.id) ? 'border-terracotta-400 bg-terracotta-50' : 'border-slate-200'
                        }`}
                      >
                        {!h.added_to_outreach && (
                          <input
                            type="checkbox"
                            checked={savedSelected.has(h.id)}
                            onChange={() => toggleSavedSelect(h.id)}
                            className="mt-1 h-4 w-4 accent-terracotta-600 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">{h.name}</span>
                            {h.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                <Star size={11} fill="currentColor" /> {h.rating}
                              </span>
                            )}
                            {h.added_to_outreach && (
                              <span className="flex items-center gap-1 text-xs font-medium text-terracotta-600 bg-terracotta-100 rounded-full px-2 py-0.5">
                                <CheckCircle size={11} /> In Outreach
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{h.formatted_address}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            {h.website && (
                              <a href={h.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <Globe size={11} /> Website
                              </a>
                            )}
                            {h.google_maps_url && (
                              <a href={h.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <MapPin size={11} /> Maps
                              </a>
                            )}
                            {h.contact_email && (
                              <span className="flex items-center gap-1 text-xs text-terracotta-700">
                                <CheckCircle size={11} /> {h.contact_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function PlaceCard({ place, selected, onToggle, onEmailChange, onFindEmail }: {
  place: PlaceResult
  selected: boolean
  onToggle: () => void
  onEmailChange: React.Dispatch<React.SetStateAction<PlaceResult[]>>
  onFindEmail: () => void
}) {
  return (
    <div className={`bg-white border rounded-xl p-4 transition-colors ${
      place.alreadyTracked ? 'border-slate-200 opacity-60' :
      selected ? 'border-terracotta-400 bg-terracotta-50' : 'border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        {!place.alreadyTracked && (
          <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 h-4 w-4 accent-terracotta-600" />
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
              <span className="flex items-center gap-1 text-xs font-medium text-terracotta-600 bg-terracotta-100 rounded-full px-2 py-0.5">
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
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <MapPin size={11} /> Google Maps
              </a>
            )}
          </div>

          {/* Email */}
          <div className="mt-2">
            {place.emailStatus === 'idle' && (
              <div className="flex items-center gap-2">
                <button onClick={onFindEmail} className="text-xs text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1">
                  <Mail size={11} /> Find contact email
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => onEmailChange(r => r.map(p => p.place_id === place.place_id ? { ...p, emailStatus: 'manual' } : p))}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <Edit2 size={11} /> Add manually
                </button>
              </div>
            )}
            {place.emailStatus === 'manual' && (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="email"
                  placeholder="email@hotel.com"
                  autoFocus
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-terracotta-400"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val) onEmailChange(r => r.map(p => p.place_id === place.place_id ? { ...p, emailStatus: 'found', contactEmail: val } : p))
                    }
                  }}
                />
                <span className="text-xs text-slate-400">Enter to save</span>
              </div>
            )}
            {place.emailStatus === 'searching' && <span className="text-xs text-slate-400">Searching…</span>}
            {place.emailStatus === 'found' && place.contactEmail && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-terracotta-700"><CheckCircle size={11} /> {place.contactEmail}</span>
                <button
                  onClick={() => onEmailChange(r => r.map(p => p.place_id === place.place_id ? { ...p, emailStatus: 'manual', contactEmail: null } : p))}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >edit</button>
              </div>
            )}
            {place.emailStatus === 'not_found' && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-slate-400"><AlertCircle size={11} /> Not found</span>
                <button
                  onClick={() => onEmailChange(r => r.map(p => p.place_id === place.place_id ? { ...p, emailStatus: 'manual' } : p))}
                  className="text-xs text-terracotta-600 hover:text-terracotta-700"
                >Add manually</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400'
