import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, X, Building2, FileUp } from 'lucide-react'
import type { HmsHotel, HmsDestination, HmsRoomType } from '../types'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import PdfContractUpload from '../components/PdfContractUpload'

function contractBadge(status: string) {
  if (status === 'Active') return 'bg-teal-100 text-teal-700'
  if (status === 'Expiring soon') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function RatesScreen() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showPdfUpload, setShowPdfUpload] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editHotel, setEditHotel] = useState<HmsHotel | null>(null)

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
            className="text-sm bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
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

      <div className="space-y-2">
        {hotels?.map(hotel => (
          <div key={hotel.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                className="flex items-center gap-2 flex-1 text-left"
                onClick={() => setExpanded(expanded === hotel.id ? null : hotel.id)}
              >
                {expanded === hotel.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <div>
                  <span className="font-medium text-slate-800">{hotel.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {(hotel as any).hms_destinations?.name} · {hotel.city} · {'★'.repeat(hotel.star_rating ?? 0)}
                  </span>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${contractBadge(hotel.contract_status)}`}>
                  {hotel.contract_status}
                </span>
                <button onClick={() => { setEditHotel(hotel); setShowForm(true) }} className="text-slate-400 hover:text-slate-600 p-1">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteHotel.mutate(hotel.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {expanded === hotel.id && (
              <HotelDetail hotel={hotel} />
            )}
          </div>
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
          className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
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
          className="text-sm bg-teal-600 text-white rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50"
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
          className="text-sm bg-teal-600 text-white rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50"
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

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
