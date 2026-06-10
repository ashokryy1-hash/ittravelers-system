import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import type { Hotel, Tour, City, Destination } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotelForm {
  name: string
  star_rating: number
  chain: string
  city_id: string
  room_types: string[]
  cover_image_url: string
  photo_link_url: string
  tiktok_url: string
  notes: string
  sort_order: number
}

interface TourForm {
  name: string
  description: string
  category: string
  cover_image_url: string
  tour_link_url: string
  tiktok_1: string
  tiktok_2: string
  tiktok_3: string
  tiktok_4: string
  inclusions: string[]
  exclusions: string[]
  sort_order: number
  city_ids: string[]
}

interface AreaForm {
  name: string
  vibe_tagline: string
  destination_id: string
  has_hotels: boolean
  sort_order: number
  cover_image_url: string
}

interface ExtractedHotel {
  name: string
  star_rating: number
  chain: string
  room_types: string[]
  notes: string
  approved: boolean
}

const emptyHotelForm: HotelForm = {
  name: '', star_rating: 5, chain: '', city_id: '',
  room_types: [], cover_image_url: '', photo_link_url: '', tiktok_url: '', notes: '', sort_order: 0,
}

const emptyTourForm: TourForm = {
  name: '', description: '', category: 'Romantic',
  cover_image_url: '', tour_link_url: '',
  tiktok_1: '', tiktok_2: '', tiktok_3: '', tiktok_4: '',
  inclusions: [], exclusions: [],
  sort_order: 0, city_ids: [],
}

const emptyAreaForm: AreaForm = {
  name: '', vibe_tagline: '', destination_id: '',
  has_hotels: true, sort_order: 0, cover_image_url: '',
}

// ─── Password Gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPw = import.meta.env.VITE_ADMIN_PASSWORD
    if (password === adminPw) {
      onSuccess()
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-ivory-100 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <h1 className="font-display text-4xl text-terracotta-800 text-center mb-2">Admin</h1>
        <p className="font-body text-sm text-gray-400 text-center mb-8">ITTravelers Trip Explorer</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-3 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
            autoFocus
          />
          {error && <p className="font-body text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-body font-medium transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Hotel Modal ───────────────────────────────────────────────────────────────

function HotelModal({
  form, setForm, cities, onSave, onClose, saving,
}: {
  form: HotelForm
  setForm: (f: HotelForm) => void
  cities: City[]
  onSave: () => void
  onClose: () => void
  saving: boolean
}) {
  const [roomInput, setRoomInput] = useState('')

  const addRoom = () => {
    const trimmed = roomInput.trim()
    if (trimmed && !form.room_types.includes(trimmed)) {
      setForm({ ...form, room_types: [...form.room_types, trimmed] })
    }
    setRoomInput('')
  }

  const removeRoom = (room: string) => {
    setForm({ ...form, room_types: form.room_types.filter(r => r !== room) })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-ivory-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-terracotta-800">Hotel Details</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Hotel Name *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                placeholder="e.g. Kaamala Luxury Resort & Spa"
              />
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">City *</label>
              <select
                value={form.city_id}
                onChange={e => setForm({ ...form, city_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              >
                <option value="">Select city...</option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Star Rating</label>
              <select
                value={form.star_rating}
                onChange={e => setForm({ ...form, star_rating: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              >
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Chain</label>
              <input
                value={form.chain}
                onChange={e => setForm({ ...form, chain: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                placeholder="e.g. Ini Vie"
              />
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              />
            </div>
          </div>

          {/* Room types */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Room Types</label>
            <div className="flex gap-2 mb-2">
              <input
                value={roomInput}
                onChange={e => setRoomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRoom())}
                className="flex-1 px-4 py-2 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                placeholder="Type room type and press Add or Enter"
              />
              <button
                onClick={addRoom}
                className="px-4 py-2 bg-terracotta-500 text-white rounded-xl font-body text-sm hover:bg-terracotta-600 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.room_types.map(room => (
                <span key={room} className="flex items-center gap-1 px-2.5 py-1 bg-ivory-100 border border-ivory-200 rounded-full text-xs font-body">
                  {room}
                  <button onClick={() => removeRoom(room)}><X size={10} className="text-gray-400 hover:text-red-400" /></button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Card Cover Image URL</label>
            <input
              value={form.cover_image_url}
              onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              placeholder="https://... (direct image URL shown on the card)"
            />
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="preview" className="mt-2 h-28 w-full object-cover rounded-lg border border-ivory-300" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Photo Album Link (opens in new tab)</label>
            <input
              value={form.photo_link_url}
              onChange={e => setForm({ ...form, photo_link_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              placeholder="https://bit.ly/... (your existing photo folder links)"
            />
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">TikTok URL (optional)</label>
            <input
              value={form.tiktok_url}
              onChange={e => setForm({ ...form, tiktok_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              placeholder="https://tiktok.com/..."
            />
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400 resize-none"
              rows={2}
              placeholder="e.g. Adults only"
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-ivory-200 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-xl font-body text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-body text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Hotel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tour Modal ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = ['Romantic', 'Adventure', 'Cultural', 'Nature', 'Water', 'Nightlife', 'Beach Club']

function TourModal({
  form, setForm, cities, onSave, onClose, saving,
}: {
  form: TourForm
  setForm: (f: TourForm) => void
  cities: City[]
  onSave: () => void
  onClose: () => void
  saving: boolean
}) {
  const [inclInput, setInclInput] = useState('')
  const [exclInput, setExclInput] = useState('')

  const toggleCity = (id: string) => {
    setForm({ ...form, city_ids: form.city_ids.includes(id) ? form.city_ids.filter(c => c !== id) : [...form.city_ids, id] })
  }
  const addIncl = () => { if (inclInput.trim()) { setForm({ ...form, inclusions: [...form.inclusions, inclInput.trim()] }); setInclInput('') } }
  const addExcl = () => { if (exclInput.trim()) { setForm({ ...form, exclusions: [...form.exclusions, exclInput.trim()] }); setExclInput('') } }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-ivory-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-terracotta-800">Tour Details</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-6 space-y-4">

          {/* Name */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Tour Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              placeholder="e.g. Ubud Elephant Tour" />
          </div>

          {/* Description */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400 resize-none" rows={2} />
          </div>

          {/* Category + Sort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400">
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400" />
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Cover Image URL</label>
            <input value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
              placeholder="https://... (leave blank to use category photo)" />
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-ivory-300" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </div>

          {/* Tour link */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Tour Link URL</label>
            <input value={form.tour_link_url} onChange={e => setForm({ ...form, tour_link_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400" placeholder="https://..." />
          </div>

          {/* TikTok links */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">TikTok Links (up to 4)</label>
            <div className="space-y-2">
              {(['tiktok_1','tiktok_2','tiktok_3','tiktok_4'] as const).map((k, i) => (
                <input key={k} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                  placeholder={`TikTok ${i + 1} URL (optional)`} />
              ))}
            </div>
          </div>

          {/* Inclusions */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Inclusions</label>
            <div className="flex gap-2 mb-2">
              <input value={inclInput} onChange={e => setInclInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIncl())}
                className="flex-1 px-4 py-2 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                placeholder="e.g. Private driver, Entrance fees" />
              <button onClick={addIncl} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-body text-sm hover:bg-emerald-600 transition-colors">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.inclusions.map((item, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-body text-emerald-700">
                  {item}
                  <button onClick={() => setForm({ ...form, inclusions: form.inclusions.filter((_, j) => j !== i) })}><X size={10} className="text-emerald-400 hover:text-red-400" /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Exclusions */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Exclusions</label>
            <div className="flex gap-2 mb-2">
              <input value={exclInput} onChange={e => setExclInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExcl())}
                className="flex-1 px-4 py-2 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                placeholder="e.g. Lunch, Personal expenses" />
              <button onClick={addExcl} className="px-4 py-2 bg-red-400 text-white rounded-xl font-body text-sm hover:bg-red-500 transition-colors">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.exclusions.map((item, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-body text-red-600">
                  {item}
                  <button onClick={() => setForm({ ...form, exclusions: form.exclusions.filter((_, j) => j !== i) })}><X size={10} className="text-red-300 hover:text-red-500" /></button>
                </span>
              ))}
            </div>
          </div>

          {/* City assignments */}
          <div>
            <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">City Assignments</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {cities.map(city => (
                <button key={city.id} type="button" onClick={() => toggleCity(city.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${form.city_ids.includes(city.id) ? 'bg-terracotta-500 text-white border-terracotta-500' : 'bg-white text-gray-500 border-gray-200 hover:border-terracotta-300'}`}>
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-ivory-200 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-xl font-body text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="px-6 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-body text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Tour
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Panel ───────────────────────────────────────────────────────────────

function AdminPanel() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'hotels' | 'tours' | 'areas'>('hotels')

  // Hotel state
  const [hotelModal, setHotelModal] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [hotelForm, setHotelForm] = useState<HotelForm>(emptyHotelForm)

  // PDF extraction state
  const [pdfExtracting, setPdfExtracting] = useState(false)
  const [extractedHotels, setExtractedHotels] = useState<ExtractedHotel[]>([])
  const [savingExtracted, setSavingExtracted] = useState(false)

  // Tour state
  const [tourModal, setTourModal] = useState(false)
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [tourForm, setTourForm] = useState<TourForm>(emptyTourForm)
  const [tourCityMap, setTourCityMap] = useState<Record<string, string[]>>({})

  // Area state
  const [areaForm, setAreaForm] = useState<AreaForm>(emptyAreaForm)
  const [editingArea, setEditingArea] = useState<City | null>(null)
  const [savingArea, setSavingArea] = useState(false)

  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('*')
      if (error) throw error
      return data ?? []
    },
  })

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ['cities-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cities').select('*').order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  const { data: allHotels = [], isLoading: loadingHotels } = useQuery<Hotel[]>({
    queryKey: ['hotels-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('explorer_hotels').select('*').order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  const { data: allTours = [], isLoading: loadingTours } = useQuery<Tour[]>({
    queryKey: ['tours-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('explorer_tours').select('*').order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  // Load tour_cities for edit
  const loadTourCities = async (tourId: string) => {
    const { data } = await supabase.from('tour_cities').select('city_id').eq('tour_id', tourId)
    return (data ?? []).map(r => r.city_id)
  }

  // Hotel CRUD
  const saveHotelMutation = useMutation({
    mutationFn: async (form: HotelForm) => {
      if (editingHotel) {
        const { error } = await supabase.from('explorer_hotels').update(form).eq('id', editingHotel.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('explorer_hotels').insert(form)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotels-admin'] })
      qc.invalidateQueries({ queryKey: ['hotels'] })
      setHotelModal(false)
      setEditingHotel(null)
      setHotelForm(emptyHotelForm)
      toast.success(editingHotel ? 'Hotel updated.' : 'Hotel added.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteHotel = async (id: string) => {
    if (!window.confirm('Delete this hotel?')) return
    const { error } = await supabase.from('explorer_hotels').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    qc.invalidateQueries({ queryKey: ['hotels-admin'] })
    toast.success('Hotel deleted.')
  }

  const openAddHotel = () => {
    setEditingHotel(null)
    setHotelForm(emptyHotelForm)
    setHotelModal(true)
  }

  const openEditHotel = (hotel: Hotel) => {
    setEditingHotel(hotel)
    setHotelForm({
      name: hotel.name,
      star_rating: hotel.star_rating,
      chain: hotel.chain ?? '',
      city_id: hotel.city_id,
      room_types: hotel.room_types ?? [],
      cover_image_url: hotel.cover_image_url ?? '',
      photo_link_url: hotel.photo_link_url ?? '',
      tiktok_url: hotel.tiktok_url ?? '',
      notes: hotel.notes ?? '',
      sort_order: hotel.sort_order ?? 0,
    })
    setHotelModal(true)
  }

  // PDF extraction
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
    if (!apiKey) {
      toast.error('VITE_CLAUDE_API_KEY not set in environment.')
      return
    }
    setPdfExtracting(true)
    setExtractedHotels([])

    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-client-side-fetch': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: base64 },
                },
                {
                  type: 'text',
                  text: `Extract hotel information from this PDF contract. Return a JSON array of hotels with these fields: name (string), star_rating (number 1-5), chain (string), room_types (array of strings), notes (string). Return ONLY the JSON array, no other text.`,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message ?? 'Claude API error')
      }

      const result = await response.json()
      const text = result.content?.[0]?.text ?? ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Could not parse AI response')
      const parsed: Omit<ExtractedHotel, 'approved'>[] = JSON.parse(jsonMatch[0])
      setExtractedHotels(parsed.map(h => ({ ...h, approved: true })))
      toast.success(`Extracted ${parsed.length} hotel(s) from PDF.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setPdfExtracting(false)
      e.target.value = ''
    }
  }

  const saveExtractedHotels = async () => {
    const approved = extractedHotels.filter(h => h.approved)
    if (approved.length === 0) { toast.error('No hotels approved.'); return }
    setSavingExtracted(true)
    try {
      const inserts = approved.map(h => ({
        name: h.name,
        star_rating: h.star_rating,
        chain: h.chain,
        room_types: h.room_types,
        notes: h.notes,
        city_id: null,
        sort_order: 0,
        photo_link_url: '',
        tiktok_url: '',
      }))
      const { error } = await supabase.from('explorer_hotels').insert(inserts)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['hotels-admin'] })
      setExtractedHotels([])
      toast.success(`${approved.length} hotel(s) saved!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingExtracted(false)
    }
  }

  // Tour CRUD
  const saveTourMutation = useMutation({
    mutationFn: async (form: TourForm) => {
      const { city_ids, ...tourData } = form
      if (editingTour) {
        const { error } = await supabase.from('explorer_tours').update(tourData).eq('id', editingTour.id)
        if (error) throw error
        await supabase.from('tour_cities').delete().eq('tour_id', editingTour.id)
        if (city_ids.length > 0) {
          const { error: e2 } = await supabase.from('tour_cities').insert(
            city_ids.map(cid => ({ tour_id: editingTour.id, city_id: cid }))
          )
          if (e2) throw e2
        }
      } else {
        const { data, error } = await supabase.from('explorer_tours').insert(tourData).select().single()
        if (error) throw error
        if (city_ids.length > 0) {
          const { error: e2 } = await supabase.from('tour_cities').insert(
            city_ids.map(cid => ({ tour_id: data.id, city_id: cid }))
          )
          if (e2) throw e2
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tours-admin'] })
      qc.invalidateQueries({ queryKey: ['tours'] })
      setTourModal(false)
      setEditingTour(null)
      setTourForm(emptyTourForm)
      toast.success(editingTour ? 'Tour updated.' : 'Tour added.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteTour = async (id: string) => {
    if (!window.confirm('Delete this tour?')) return
    const { error } = await supabase.from('explorer_tours').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    qc.invalidateQueries({ queryKey: ['tours-admin'] })
    toast.success('Tour deleted.')
  }

  const openAddTour = () => {
    setEditingTour(null)
    setTourForm(emptyTourForm)
    setTourModal(true)
  }

  const openEditTour = async (tour: Tour) => {
    setEditingTour(tour)
    const cityIds = await loadTourCities(tour.id)
    setTourForm({
      name: tour.name,
      description: tour.description ?? '',
      category: tour.category,
      cover_image_url: tour.cover_image_url ?? '',
      tour_link_url: tour.tour_link_url ?? '',
      tiktok_1: tour.tiktok_1 ?? '',
      tiktok_2: tour.tiktok_2 ?? '',
      tiktok_3: tour.tiktok_3 ?? '',
      tiktok_4: tour.tiktok_4 ?? '',
      inclusions: tour.inclusions ?? [],
      exclusions: tour.exclusions ?? [],
      sort_order: tour.sort_order ?? 0,
      city_ids: cityIds,
    })
    setTourModal(true)
  }

  // Area CRUD
  const saveArea = async () => {
    setSavingArea(true)
    try {
      if (editingArea) {
        const { error } = await supabase.from('cities').update({
          name: areaForm.name,
          vibe_tagline: areaForm.vibe_tagline,
          has_hotels: areaForm.has_hotels,
          sort_order: areaForm.sort_order,
          cover_image_url: areaForm.cover_image_url,
        }).eq('id', editingArea.id)
        if (error) throw error
        toast.success('Area updated.')
      } else {
        const { error } = await supabase.from('cities').insert(areaForm)
        if (error) throw error
        toast.success('Area added.')
      }
      qc.invalidateQueries({ queryKey: ['cities-all'] })
      qc.invalidateQueries({ queryKey: ['cities'] })
      setEditingArea(null)
      setAreaForm(emptyAreaForm)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingArea(false)
    }
  }

  const deleteArea = async (id: string) => {
    if (!window.confirm('Delete this area? This will also delete associated hotels.')) return
    const { error } = await supabase.from('cities').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    qc.invalidateQueries({ queryKey: ['cities-all'] })
    toast.success('Area deleted.')
  }

  const cityById = (id: string) => cities.find(c => c.id === id)

  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Header */}
      <div className="bg-white border-b border-ivory-300 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-body text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Home
          </button>
          <h1 className="font-display text-2xl text-terracotta-800">Admin Panel</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <div className="flex gap-1 border-b border-ivory-300 mb-8">
          {(['hotels', 'tours', 'areas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-body text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-terracotta-500 text-terracotta-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* HOTELS TAB */}
        {activeTab === 'hotels' && (
          <div className="pb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl text-terracotta-700">Hotels</h2>
              <button
                onClick={openAddHotel}
                className="flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-body text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add Hotel
              </button>
            </div>

            {/* PDF Upload */}
            <div className="bg-white rounded-2xl border border-ivory-300 p-5 mb-8">
              <h3 className="font-display text-xl text-terracotta-700 mb-3">Upload Hotel Contract PDF</h3>
              <p className="font-body text-sm text-gray-500 mb-4">
                Upload a PDF contract to extract hotel data using AI (Claude). You can review and approve each extracted hotel before saving.
              </p>
              <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer font-body text-sm font-medium transition-colors ${
                pdfExtracting
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-terracotta-600 border-terracotta-300 hover:bg-terracotta-50'
              }`}>
                {pdfExtracting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {pdfExtracting ? 'Extracting hotel data with AI...' : 'Choose PDF'}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={pdfExtracting}
                  className="hidden"
                />
              </label>

              {extractedHotels.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-body text-sm font-medium text-gray-700">
                      {extractedHotels.filter(h => h.approved).length} / {extractedHotels.length} hotels approved
                    </p>
                    <button
                      onClick={saveExtractedHotels}
                      disabled={savingExtracted}
                      className="flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-body text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {savingExtracted && <Loader2 size={14} className="animate-spin" />}
                      Save Approved Hotels
                    </button>
                  </div>
                  <div className="space-y-2">
                    {extractedHotels.map((h, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${h.approved ? 'border-terracotta-200 bg-terracotta-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                        <button
                          onClick={() => setExtractedHotels(prev => prev.map((x, j) => j === i ? { ...x, approved: !x.approved } : x))}
                          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${h.approved ? 'bg-terracotta-500 border-terracotta-500 text-white' : 'border-gray-300'}`}
                        >
                          {h.approved && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium text-gray-800">{h.name}</p>
                          <p className="font-body text-xs text-gray-500">{'★'.repeat(h.star_rating)} · {h.chain}</p>
                          {h.room_types.length > 0 && (
                            <p className="font-body text-xs text-gray-400 mt-1 truncate">{h.room_types.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hotel List */}
            {loadingHotels ? (
              <p className="font-body text-gray-400 italic">Loading hotels...</p>
            ) : (
              <div className="space-y-6">
                {cities.map(city => {
                  const cityHotels = allHotels.filter(h => h.city_id === city.id)
                  if (cityHotels.length === 0) return null
                  return (
                    <div key={city.id}>
                      <h3 className="font-display text-xl text-terracotta-600 mb-3">{city.name}</h3>
                      <div className="space-y-2">
                        {cityHotels.map(hotel => (
                          <div key={hotel.id} className="bg-white rounded-xl border border-ivory-200 px-4 py-3 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-sm font-medium text-gray-800 truncate">{hotel.name}</p>
                              <p className="font-body text-xs text-gray-400">{'★'.repeat(hotel.star_rating)} · {hotel.chain}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!hotel.tiktok_url && (
                                <button
                                  onClick={() => openEditHotel(hotel)}
                                  className="px-2.5 py-1 text-xs font-body border border-dusty-rose-200 text-dusty-rose-500 rounded-lg hover:bg-dusty-rose-50 transition-colors"
                                >
                                  Add TikTok
                                </button>
                              )}
                              <button onClick={() => openEditHotel(hotel)} className="p-1.5 text-gray-400 hover:text-terracotta-500 rounded-lg hover:bg-terracotta-50 transition-colors">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => deleteHotel(hotel.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TOURS TAB */}
        {activeTab === 'tours' && (
          <div className="pb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl text-terracotta-700">Tours</h2>
              <button
                onClick={openAddTour}
                className="flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-body text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add Tour
              </button>
            </div>

            {/* Website import (placeholder) */}
            <div className="bg-white rounded-2xl border border-ivory-300 p-5 mb-8">
              <h3 className="font-display text-xl text-terracotta-700 mb-2">Import from Website</h3>
              <p className="font-body text-sm text-gray-400 italic">Coming soon — import tour data from a URL automatically.</p>
            </div>

            {loadingTours ? (
              <p className="font-body text-gray-400 italic">Loading tours...</p>
            ) : (
              <div className="space-y-2">
                {allTours.map(tour => (
                  <div key={tour.id} className="bg-white rounded-xl border border-ivory-200 px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-gray-800 truncate">{tour.name}</p>
                      <p className="font-body text-xs text-gray-400">{tour.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditTour(tour)} className="p-1.5 text-gray-400 hover:text-terracotta-500 rounded-lg hover:bg-terracotta-50 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteTour(tour.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AREAS TAB */}
        {activeTab === 'areas' && (
          <div className="pb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl text-terracotta-700">Areas</h2>
            </div>

            {/* Add/Edit form */}
            <div className="bg-white rounded-2xl border border-ivory-300 p-6 mb-8">
              <h3 className="font-display text-xl text-terracotta-700 mb-4">
                {editingArea ? `Edit: ${editingArea.name}` : 'Add New Area'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Area Name *</label>
                  <input
                    value={areaForm.name}
                    onChange={e => setAreaForm({ ...areaForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Vibe Tagline</label>
                  <input
                    value={areaForm.vibe_tagline}
                    onChange={e => setAreaForm({ ...areaForm, vibe_tagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Cover Image URL</label>
                  <input
                    value={areaForm.cover_image_url}
                    onChange={e => setAreaForm({ ...areaForm, cover_image_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                    placeholder="https://... (direct image URL for the area card)"
                  />
                  {areaForm.cover_image_url && (
                    <img src={areaForm.cover_image_url} alt="preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-ivory-300" onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                </div>
                <div>
                  <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Destination</label>
                  <select
                    value={areaForm.destination_id}
                    onChange={e => setAreaForm({ ...areaForm, destination_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                  >
                    <option value="">Select destination...</option>
                    {destinations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Sort Order</label>
                  <input
                    type="number"
                    value={areaForm.sort_order}
                    onChange={e => setAreaForm({ ...areaForm, sort_order: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 font-body text-sm focus:outline-none focus:border-terracotta-400"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="has_hotels"
                    checked={areaForm.has_hotels}
                    onChange={e => setAreaForm({ ...areaForm, has_hotels: e.target.checked })}
                    className="w-4 h-4 accent-terracotta-500"
                  />
                  <label htmlFor="has_hotels" className="font-body text-sm text-gray-600">Has Hotels</label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={saveArea}
                  disabled={savingArea}
                  className="flex items-center gap-2 px-5 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-body text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {savingArea && <Loader2 size={14} className="animate-spin" />}
                  {editingArea ? 'Update Area' : 'Add Area'}
                </button>
                {editingArea && (
                  <button
                    onClick={() => { setEditingArea(null); setAreaForm(emptyAreaForm) }}
                    className="px-5 py-2 border border-gray-200 rounded-xl font-body text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Area list */}
            <div className="space-y-2">
              {cities.map(city => (
                <div key={city.id} className="bg-white rounded-xl border border-ivory-200 px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-gray-800">{city.name}</p>
                    <p className="font-body text-xs text-gray-400">
                      {city.vibe_tagline} · order: {city.sort_order} · {city.has_hotels ? 'Hotels' : 'Day trips only'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingArea(city)
                        setAreaForm({
                          name: city.name,
                          vibe_tagline: city.vibe_tagline ?? '',
                          destination_id: city.destination_id,
                          has_hotels: city.has_hotels,
                          sort_order: city.sort_order,
                          cover_image_url: city.cover_image_url ?? '',
                        })
                      }}
                      className="p-1.5 text-gray-400 hover:text-terracotta-500 rounded-lg hover:bg-terracotta-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteArea(city.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {hotelModal && (
        <HotelModal
          form={hotelForm}
          setForm={setHotelForm}
          cities={cities}
          onSave={() => saveHotelMutation.mutate(hotelForm)}
          onClose={() => { setHotelModal(false); setEditingHotel(null) }}
          saving={saveHotelMutation.isPending}
        />
      )}
      {tourModal && (
        <TourModal
          form={tourForm}
          setForm={setTourForm}
          cities={cities}
          onSave={() => saveTourMutation.mutate(tourForm)}
          onClose={() => { setTourModal(false); setEditingTour(null) }}
          saving={saveTourMutation.isPending}
        />
      )}
    </div>
  )
}

// ─── AdminScreen (exported) ────────────────────────────────────────────────────

export default function AdminScreen() {
  const [authenticated, setAuthenticated] = useState(false)

  if (!authenticated) {
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />
  }

  return <AdminPanel />
}
