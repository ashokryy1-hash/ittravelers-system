import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, X, Building2, FileUp, Search } from 'lucide-react'
import type { HmsHotel, HmsDestination, HmsRoomType, HmsSurchargeRule } from '../types'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import PdfContractUpload from '../components/PdfContractUpload'

function contractBadge(status: string) {
  if (status === 'Active') return 'bg-terracotta-100 text-terracotta-700'
  if (status === 'Expiring soon') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function RatesScreen() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showPdfUpload, setShowPdfUpload] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editHotel, setEditHotel] = useState<HmsHotel | null>(null)
  const [search, setSearch] = useState('')

  const { data: destinations } = useQuery<HmsDestination[]>({
    queryKey: ['hms_destinations'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_destinations').select('*').order('name')
      return data ?? []
    },
  })

  const { data: hotels, isLoading } = useQuery<HmsHotel[]>({
    queryKey: ['hms_hotels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_hotels')
        .select('*, hms_destinations(name)')
        .order('name')
      return (data ?? []).map(h => {
        // Auto-update contract_status
        if (!h.valid_to) return h
        const days = Math.round((new Date(h.valid_to).getTime() - Date.now()) / 86400000)
        if (days < 0) return { ...h, contract_status: 'Expired' }
        if (days <= 90) return { ...h, contract_status: 'Expiring soon' }
        return { ...h, contract_status: 'Active' }
      })
    },
  })

  const deleteHotel = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('hms_hotels').delete().eq('id', id)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hms_hotels'] }); toast.success('Hotel deleted') },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Rate Management</h1>
        <div className="flex gap-2">
          <Link
            to="/hms/rates/quote"
            className="text-sm bg-terracotta-600 text-white rounded-lg px-4 py-2 hover:bg-terracotta-700"
          >
            Rate Viewer / Quote
          </Link>
          <button
            onClick={() => setShowPdfUpload(true)}
            className="flex items-center gap-1 text-sm bg-slate-700 text-white rounded-lg px-4 py-2 hover:bg-slate-800"
          >
            <FileUp size={15} /> Upload Contract PDF
          </button>
          <button
            onClick={() => { setShowForm(true); setEditHotel(null) }}
            className="flex items-center gap-1 text-sm border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50"
          >
            <Plus size={15} /> Add Manually
          </button>
        </div>
      </div>

      {isLoading && <p className="text-slate-400 text-sm">Loading…</p>}

      {/* Search */}
      {!isLoading && (hotels?.length ?? 0) > 0 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by hotel name, city, or destination…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-200 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">✕</button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {(hotels ?? [])
          .filter(h => {
            if (!search.trim()) return true
            const q = search.toLowerCase()
            return (
              h.name?.toLowerCase().includes(q) ||
              h.city?.toLowerCase().includes(q) ||
              (h as any).hms_destinations?.name?.toLowerCase().includes(q) ||
              h.chain?.toLowerCase().includes(q)
            )
          })
          .map(hotel => (
            <HotelRow
              key={hotel.id}
              hotel={hotel}
              expanded={expanded === hotel.id}
              onToggle={() => setExpanded(expanded === hotel.id ? null : hotel.id)}
              onEdit={() => { setEditHotel(hotel); setShowForm(true) }}
              onDelete={() => deleteHotel.mutate(hotel.id)}
            />
          ))}
      </div>

      {hotels?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-slate-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No contracted hotels yet. Add your first hotel above.</p>
        </div>
      )}

      {showForm && (
        <HotelForm
          destinations={destinations ?? []}
          hotel={editHotel}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['hms_hotels'] }) }}
        />
      )}

      {showPdfUpload && (
        <PdfContractUpload
          onClose={() => setShowPdfUpload(false)}
          onSaved={() => { setShowPdfUpload(false); qc.invalidateQueries({ queryKey: ['hms_hotels'] }) }}
        />
      )}

      {/* Surcharge Rules */}
      <SurchargeRulesSection destinations={destinations ?? []} />
    </div>
  )
}

function HotelRow({ hotel, expanded, onToggle, onEdit, onDelete }: {
  hotel: HmsHotel
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { data: rooms } = useQuery<HmsRoomType[]>({
    queryKey: ['hms_rooms', hotel.id],
    queryFn: async () => {
      const { data } = await supabase.from('hms_room_types').select('*').eq('hotel_id', hotel.id).order('sort_order')
      return data ?? []
    },
  })

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-2 flex-1 text-left min-w-0"
          onClick={onToggle}
        >
          {expanded ? <ChevronDown size={16} className="shrink-0 text-slate-400" /> : <ChevronRight size={16} className="shrink-0 text-slate-400" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-800">{hotel.name}</span>
              <span className="text-xs text-slate-400">{(hotel as any).hms_destinations?.name} · {hotel.city}{hotel.star_rating ? ' · ' + '★'.repeat(hotel.star_rating) : ''}</span>
              {hotel.surcharge_waiver && hotel.surcharge_waiver !== 'none' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{hotel.surcharge_waiver} surcharge waiver</span>
              )}
            </div>
            {/* Room prices preview */}
            {rooms && rooms.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                {rooms.map(r => (
                  <span key={r.id} className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{r.name}</span>
                    {' · '}
                    {r.currency} {r.low_season_rate?.toLocaleString() ?? '—'}
                    {r.high_season_rate ? ` / ${r.high_season_rate.toLocaleString()}` : ''}
                    {r.peak_season_rate ? ` / ${r.peak_season_rate.toLocaleString()}` : ''}
                    <span className="text-slate-400"> /night</span>
                  </span>
                ))}
              </div>
            )}
            {rooms && rooms.length === 0 && (
              <span className="text-xs text-amber-500 italic">No room types yet — click to add</span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${contractBadge(hotel.contract_status)}`}>
            {hotel.contract_status}
          </span>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs text-terracotta-600 hover:text-terracotta-700 border border-terracotta-200 hover:border-terracotta-400 rounded-lg px-2.5 py-1 transition-colors"
          >
            <Edit2 size={12} /> Edit
          </button>
          <button onClick={onDelete} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && <HotelDetail hotel={hotel} />}
    </div>
  )
}

function HotelDetail({ hotel }: { hotel: HmsHotel }) {
  const qc = useQueryClient()
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [editRoom, setEditRoom] = useState<HmsRoomType | null>(null)

  const { data: rooms } = useQuery<HmsRoomType[]>({
    queryKey: ['hms_rooms', hotel.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_room_types')
        .select('*')
        .eq('hotel_id', hotel.id)
        .order('sort_order')
      return data ?? []
    },
  })

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => { await supabase.from('hms_room_types').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hms_rooms', hotel.id] }),
  })

  return (
    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
        <Detail label="Chain" value={hotel.chain} />
        <Detail label="Surcharge waiver" value={hotel.surcharge_waiver} />
        <Detail label="Contract" value={`${hotel.valid_from ?? '—'} → ${hotel.valid_to ?? '—'}`} />
        <Detail label="Booking window" value={`${hotel.booking_window_from ?? '—'} → ${hotel.booking_window_to ?? '—'}`} />
        <Detail label="Contact" value={hotel.contact_name ? `${hotel.contact_name} · ${hotel.contact_email}` : hotel.contact_email} />
        {hotel.notes && <Detail label="Notes" value={hotel.notes} />}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Room Types</span>
        <button
          onClick={() => { setEditRoom(null); setShowRoomForm(true) }}
          className="text-xs text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
        >
          <Plus size={12} /> Add room type
        </button>
      </div>

      {rooms?.length === 0 && (
        <p className="text-xs text-slate-400 italic">No room types added yet.</p>
      )}

      <div className="space-y-1">
        {rooms?.map(r => (
          <div key={r.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-800">{r.name}</span>
              <span className="ml-2 text-xs text-slate-400 capitalize">{r.room_category} · {r.meal_plan}</span>
            </div>
            <div className="text-xs text-slate-600 text-right mx-3">
              <div>Low: {fmt(r.low_season_rate)}</div>
              <div>High: {fmt(r.high_season_rate)}</div>
              <div>Peak: {fmt(r.peak_season_rate)}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditRoom(r); setShowRoomForm(true) }} className="text-slate-400 hover:text-slate-600 p-1"><Edit2 size={12} /></button>
              <button onClick={() => deleteRoom.mutate(r.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showRoomForm && (
        <RoomTypeForm
          hotelId={hotel.id}
          room={editRoom}
          onClose={() => setShowRoomForm(false)}
          onSaved={() => { setShowRoomForm(false); qc.invalidateQueries({ queryKey: ['hms_rooms', hotel.id] }) }}
        />
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 w-32 shrink-0">{label}:</span>
      <span className="text-slate-800">{value}</span>
    </div>
  )
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

// ---- Hotel Form ----
function HotelForm({ destinations, hotel, onClose, onSaved }: {
  destinations: HmsDestination[]
  hotel: HmsHotel | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: hotel?.name ?? '',
    destination_id: hotel?.destination_id ?? '',
    city: hotel?.city ?? '',
    star_rating: hotel?.star_rating?.toString() ?? '',
    chain: hotel?.chain ?? '',
    surcharge_waiver: hotel?.surcharge_waiver ?? 'none',
    valid_from: hotel?.valid_from ?? '',
    valid_to: hotel?.valid_to ?? '',
    booking_window_from: hotel?.booking_window_from ?? '',
    booking_window_to: hotel?.booking_window_to ?? '',
    contact_name: hotel?.contact_name ?? '',
    contact_email: hotel?.contact_email ?? '',
    photo_link_url: hotel?.photo_link_url ?? '',
    notes: hotel?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const payload = {
      ...form,
      star_rating: form.star_rating ? parseInt(form.star_rating) : null,
      updated_at: new Date().toISOString(),
    }
    if (hotel) {
      await supabase.from('hms_hotels').update(payload).eq('id', hotel.id)
    } else {
      await supabase.from('hms_hotels').insert(payload)
    }
    setSaving(false)
    onSaved()
    toast.success(hotel ? 'Hotel updated' : 'Hotel added')
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Modal title={hotel ? 'Edit Hotel' : 'Add Hotel'} onClose={onClose}>
      <div className="space-y-3">
        <Row label="Hotel name *">
          <input className={inp} value={form.name} onChange={set('name')} />
        </Row>
        <Row label="Destination">
          <select className={inp} value={form.destination_id} onChange={set('destination_id')}>
            <option value="">Select…</option>
            {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Row>
        <Row label="City / Area">
          <input className={inp} value={form.city} onChange={set('city')} />
        </Row>
        <Row label="Star rating">
          <select className={inp} value={form.star_rating} onChange={set('star_rating')}>
            <option value="">—</option>
            {[3,4,5].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </Row>
        <Row label="Chain / Group">
          <input className={inp} value={form.chain} onChange={set('chain')} placeholder="e.g. Ini Vie Hospitality" />
        </Row>
        <Row label="Surcharge waiver">
          <select className={inp} value={form.surcharge_waiver} onChange={set('surcharge_waiver')}>
            <option value="none">None</option>
            <option value="50%">50% waiver</option>
            <option value="100%">100% waiver (full exemption)</option>
          </select>
        </Row>
        <Row label="Contract valid from">
          <input type="date" className={inp} value={form.valid_from} onChange={set('valid_from')} />
        </Row>
        <Row label="Contract valid to">
          <input type="date" className={inp} value={form.valid_to} onChange={set('valid_to')} />
        </Row>
        <Row label="Booking window from">
          <input type="date" className={inp} value={form.booking_window_from} onChange={set('booking_window_from')} />
        </Row>
        <Row label="Booking window to">
          <input type="date" className={inp} value={form.booking_window_to} onChange={set('booking_window_to')} />
        </Row>
        <Row label="Contact name">
          <input className={inp} value={form.contact_name} onChange={set('contact_name')} />
        </Row>
        <Row label="Contact email">
          <input type="email" className={inp} value={form.contact_email} onChange={set('contact_email')} />
        </Row>
        <Row label="Photo link URL">
          <input className={inp} value={form.photo_link_url} onChange={set('photo_link_url')} />
        </Row>
        <Row label="Notes">
          <textarea className={`${inp} h-20 resize-none`} value={form.notes} onChange={set('notes')} />
        </Row>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Cancel</button>
        <button
          onClick={save}
          disabled={saving || !form.name}
          className="text-sm bg-terracotta-600 text-white rounded-lg px-5 py-2 hover:bg-terracotta-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

// ---- Room Type Form ----
function RoomTypeForm({ hotelId, room, onClose, onSaved }: {
  hotelId: string
  room: HmsRoomType | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: room?.name ?? '',
    room_category: room?.room_category ?? 'room',
    low_season_rate: room?.low_season_rate?.toString() ?? '',
    high_season_rate: room?.high_season_rate?.toString() ?? '',
    peak_season_rate: room?.peak_season_rate?.toString() ?? '',
    currency: room?.currency ?? 'IDR',
    meal_plan: room?.meal_plan ?? 'BB',
    availability: room?.availability?.toString() ?? '',
    notes: room?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const payload = {
      hotel_id: hotelId,
      ...form,
      room_category: form.room_category as 'room' | 'villa',
      low_season_rate: form.low_season_rate ? parseFloat(form.low_season_rate) : null,
      high_season_rate: form.high_season_rate ? parseFloat(form.high_season_rate) : null,
      peak_season_rate: form.peak_season_rate ? parseFloat(form.peak_season_rate) : null,
      availability: form.availability ? parseInt(form.availability) : null,
    }
    if (room) {
      await supabase.from('hms_room_types').update(payload).eq('id', room.id)
    } else {
      await supabase.from('hms_room_types').insert(payload)
    }
    setSaving(false)
    onSaved()
    toast.success(room ? 'Room type updated' : 'Room type added')
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Modal title={room ? 'Edit Room Type' : 'Add Room Type'} onClose={onClose}>
      <div className="space-y-3">
        <Row label="Room type name *">
          <input className={inp} value={form.name} onChange={set('name')} placeholder="e.g. Garden Pool Villa" />
        </Row>
        <Row label="Category">
          <select className={inp} value={form.room_category} onChange={set('room_category')}>
            <option value="room">Room (non-private pool)</option>
            <option value="villa">Villa (private pool)</option>
          </select>
        </Row>
        <Row label="Currency">
          <select className={inp} value={form.currency} onChange={set('currency')}>
            <option>IDR</option><option>THB</option><option>USD</option>
          </select>
        </Row>
        <Row label="Meal plan">
          <select className={inp} value={form.meal_plan} onChange={set('meal_plan')}>
            {['RO','BB','HB','FB','AI'].map(m => <option key={m}>{m}</option>)}
          </select>
        </Row>
        <Row label="Low season rate">
          <input type="number" className={inp} value={form.low_season_rate} onChange={set('low_season_rate')} />
        </Row>
        <Row label="High season rate">
          <input type="number" className={inp} value={form.high_season_rate} onChange={set('high_season_rate')} />
        </Row>
        <Row label="Peak season rate">
          <input type="number" className={inp} value={form.peak_season_rate} onChange={set('peak_season_rate')} />
        </Row>
        <Row label="Total availability (units)">
          <input type="number" className={inp} value={form.availability} onChange={set('availability')} />
        </Row>
        <Row label="Notes">
          <textarea className={`${inp} h-16 resize-none`} value={form.notes} onChange={set('notes')} />
        </Row>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Cancel</button>
        <button
          onClick={save}
          disabled={saving || !form.name}
          className="text-sm bg-terracotta-600 text-white rounded-lg px-5 py-2 hover:bg-terracotta-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ---- Surcharge Rules Section ----
function SurchargeRulesSection({ destinations }: { destinations: HmsDestination[] }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editRule, setEditRule] = useState<HmsSurchargeRule | null>(null)

  const { data: rules } = useQuery<HmsSurchargeRule[]>({
    queryKey: ['hms_surcharge_rules_manage'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_surcharge_rules')
        .select('*, hms_destinations(name)')
        .order('start_date')
      return data ?? []
    },
  })

  const deleteRule = useMutation({
    mutationFn: async (id: string) => { await supabase.from('hms_surcharge_rules').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hms_surcharge_rules_manage'] }); toast.success('Rule deleted') },
  })

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Season Surcharge Rules</h2>
          <p className="text-xs text-slate-400 mt-0.5">Extra amount added per night during high/peak seasons. Set once per destination — applies to all hotels automatically.</p>
        </div>
        <button
          onClick={() => { setEditRule(null); setShowForm(true) }}
          className="flex items-center gap-1 text-sm border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50"
        >
          <Plus size={15} /> Add Rule
        </button>
      </div>

      {rules?.length === 0 && (
        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm">No surcharge rules yet.</p>
          <p className="text-xs mt-1">Add high and peak season surcharge amounts for each destination.</p>
        </div>
      )}

      {(rules?.length ?? 0) > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Destination</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Season</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Room surcharge</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Villa surcharge</th>
                <th className="px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules?.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">{(rule as any).hms_destinations?.name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rule.season_name.toLowerCase().includes('peak') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {rule.season_name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{rule.start_date} → {rule.end_date}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">IDR {rule.room_surcharge?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">IDR {rule.villa_surcharge?.toLocaleString()}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditRule(rule); setShowForm(true) }} className="text-slate-400 hover:text-slate-600 p-1"><Edit2 size={13} /></button>
                      <button onClick={() => { if (confirm('Delete this surcharge rule?')) deleteRule.mutate(rule.id) }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <SurchargeRuleForm
          destinations={destinations}
          rule={editRule}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['hms_surcharge_rules_manage'] }); qc.invalidateQueries({ queryKey: ['hms_surcharge_rules'] }) }}
        />
      )}
    </div>
  )
}

function SurchargeRuleForm({ destinations, rule, onClose, onSaved }: {
  destinations: HmsDestination[]
  rule: HmsSurchargeRule | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    destination_id: rule?.destination_id ?? '',
    season_name: rule?.season_name ?? '',
    start_date: rule?.start_date ?? '',
    end_date: rule?.end_date ?? '',
    room_surcharge: rule?.room_surcharge?.toString() ?? '',
    villa_surcharge: rule?.villa_surcharge?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.destination_id || !form.season_name || !form.start_date || !form.end_date) {
      toast.error('Fill in all required fields'); return
    }
    setSaving(true)
    const payload = {
      destination_id: form.destination_id,
      season_name: form.season_name,
      start_date: form.start_date,
      end_date: form.end_date,
      room_surcharge: parseFloat(form.room_surcharge) || 0,
      villa_surcharge: parseFloat(form.villa_surcharge) || 0,
    }
    if (rule) {
      await supabase.from('hms_surcharge_rules').update(payload).eq('id', rule.id)
    } else {
      await supabase.from('hms_surcharge_rules').insert(payload)
    }
    setSaving(false)
    toast.success(rule ? 'Rule updated' : 'Rule added')
    onSaved()
  }

  return (
    <Modal title={rule ? 'Edit Surcharge Rule' : 'Add Surcharge Rule'} onClose={onClose}>
      <div className="space-y-3">
        <Row label="Destination *">
          <select className={inp} value={form.destination_id} onChange={set('destination_id')}>
            <option value="">Select destination…</option>
            {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Row>
        <Row label="Season name *">
          <input className={inp} value={form.season_name} onChange={set('season_name')} placeholder="e.g. High Season 2026 or Peak Season 2026" />
        </Row>
        <p className="text-xs text-slate-400 -mt-1">Include the word "peak" in the name for peak season (e.g. "Peak Season 2026")</p>
        <Row label="Start date *">
          <input type="date" className={inp} value={form.start_date} onChange={set('start_date')} />
        </Row>
        <Row label="End date *">
          <input type="date" className={inp} value={form.end_date} onChange={set('end_date')} />
        </Row>
        <Row label="Room surcharge (IDR/night)">
          <input type="number" className={inp} value={form.room_surcharge} onChange={set('room_surcharge')} placeholder="e.g. 450000" />
        </Row>
        <Row label="Villa surcharge (IDR/night)">
          <input type="number" className={inp} value={form.villa_surcharge} onChange={set('villa_surcharge')} placeholder="e.g. 700000" />
        </Row>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving} className="text-sm bg-terracotta-600 text-white rounded-lg px-5 py-2 hover:bg-terracotta-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}
