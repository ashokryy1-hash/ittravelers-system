import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Mail, MessageSquare, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import type { HmsBooking, HmsBookingEmail, HmsHotel, HmsRoomType } from '../types'
import EmailPreviewPanel from '../components/EmailPreviewPanel'
import { Modal } from './RatesScreen'
import { getSettings } from '../lib/settings'
import { nightsBetween } from '../lib/season'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  'Availability pending': 'bg-amber-100 text-amber-700',
  'Confirmed': 'bg-teal-100 text-teal-700',
  'Paid': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
}

export default function ReservationsScreen() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [openBooking, setOpenBooking] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState<{ to: string; subject: string; body: string; bookingId: string } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')

  const { data: bookings } = useQuery<HmsBooking[]>({
    queryKey: ['hms_bookings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_bookings')
        .select('*, hms_hotels(name, contact_email, city, surcharge_waiver), hms_room_types(name, room_category, meal_plan, currency, low_season_rate, high_season_rate, peak_season_rate)')
        .order('checkin_date')
      return data ?? []
    },
  })

  async function draftAvailabilityEmail(booking: HmsBooking) {
    const settings = await getSettings()
    toast.loading('Generating email draft…', { id: 'draft' })

    const hotel = (booking as any).hms_hotels
    const room = (booking as any).hms_room_types

    const userPrompt = `Write a professional availability request email to ${hotel?.name} hotel.

Details:
- Check-in: ${booking.checkin_date}
- Check-out: ${booking.checkout_date}
- Nights: ${booking.nights}
- Room type: ${room?.name} (${room?.meal_plan})
- Rate: ${booking.currency} ${booking.rate_per_night?.toLocaleString()}/night (as per our contract)
- Guests: honeymoon couple (do not mention the client's name)

The email must:
- Reference our contracted rate for these dates
- Request confirmation of availability for the specified dates
- Be professional and concise
- Be signed as ITTravelers

Agency signature: ${settings.agency_signature}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: userPrompt
          }],
        }),
      })
      const data = await res.json()
      const body = data.content?.[0]?.text ?? ''
      toast.dismiss('draft')
      setEmailDraft({
        to: hotel?.contact_email ?? '',
        subject: `Availability Request — ${booking.checkin_date} to ${booking.checkout_date}`,
        body,
        bookingId: booking.id,
      })
    } catch {
      toast.dismiss('draft')
      toast.error('Failed to generate draft.')
    }
  }

  async function sendEmail(subject: string, body: string) {
    if (!emailDraft) return
    setSendingEmail(true)
    await supabase.from('hms_booking_emails').insert({
      booking_id: emailDraft.bookingId,
      direction: 'sent',
      subject,
      body,
      sent_at: new Date().toISOString(),
    })
    try {
      const settings = await getSettings()
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailDraft.to, subject, body, senderName: settings.outlook_sender_name }),
      })
    } catch {}
    qc.invalidateQueries({ queryKey: ['hms_booking_emails', emailDraft.bookingId] })
    setSendingEmail(false)
    setEmailDraft(null)
    toast.success('Email sent and logged')
  }

  const filtered = (bookings ?? []).filter(b => statusFilter === 'All' || b.status === statusFilter)

  const pendingCount = (bookings ?? []).filter(b => b.status === 'Availability pending').length
  const confirmedCount = (bookings ?? []).filter(b => b.status === 'Confirmed').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reservations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-sm bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
        >
          <Plus size={15} /> New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-5">
        <span className="text-sm text-slate-600">{bookings?.length ?? 0} total</span>
        <span className="text-sm text-amber-600">{pendingCount} pending</span>
        <span className="text-sm text-teal-600">{confirmedCount} confirmed</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['All', 'Availability pending', 'Confirmed', 'Paid', 'Cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            expanded={openBooking === booking.id}
            onToggle={() => setOpenBooking(openBooking === booking.id ? null : booking.id)}
            onDraftEmail={() => draftAvailabilityEmail(booking)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">No bookings found.</div>
      )}

      {showForm && (
        <BookingForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['hms_bookings'] }) }}
        />
      )}

      {emailDraft && (
        <EmailPreviewPanel
          to={emailDraft.to || '(no contact email)'}
          subject={emailDraft.subject}
          body={emailDraft.body}
          onSend={sendEmail}
          onClose={() => setEmailDraft(null)}
          sending={sendingEmail}
        />
      )}
    </div>
  )
}

function BookingCard({ booking, expanded, onToggle, onDraftEmail }: {
  booking: HmsBooking
  expanded: boolean
  onToggle: () => void
  onDraftEmail: () => void
}) {
  const qc = useQueryClient()
  const hotel = (booking as any).hms_hotels
  const room = (booking as any).hms_room_types
  const [incomingEmail, setIncomingEmail] = useState('')
  const [incomingSubject, setIncomingSubject] = useState('')
  const [confirmNumber, setConfirmNumber] = useState(booking.hotel_confirmation_number ?? '')

  const { data: emails } = useQuery<HmsBookingEmail[]>({
    queryKey: ['hms_booking_emails', booking.id],
    queryFn: async () => {
      const { data } = await supabase.from('hms_booking_emails').select('*').eq('booking_id', booking.id).order('sent_at')
      return data ?? []
    },
    enabled: expanded,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ status, confirmNum }: { status: string; confirmNum?: string }) => {
      await supabase.from('hms_bookings').update({
        status,
        hotel_confirmation_number: confirmNum ?? booking.hotel_confirmation_number,
      }).eq('id', booking.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hms_bookings'] }),
  })

  async function logIncoming() {
    if (!incomingEmail.trim()) return
    await supabase.from('hms_booking_emails').insert({
      booking_id: booking.id,
      direction: 'received',
      subject: incomingSubject,
      body: incomingEmail,
    })
    qc.invalidateQueries({ queryKey: ['hms_booking_emails', booking.id] })
    setIncomingEmail('')
    setIncomingSubject('')
    toast.success('Reply logged')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button className="w-full text-left px-4 py-3" onClick={onToggle}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-800">{booking.client_name}</span>
              <span className="text-sm text-slate-500">{hotel?.name} · {hotel?.city}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {booking.checkin_date} → {booking.checkout_date} ({booking.nights}n) · {room?.name}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[booking.status] ?? ''}`}>
              {booking.status}
            </span>
            {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <Detail label="Room" value={`${room?.name} (${room?.meal_plan})`} />
            <Detail label="Rate/night" value={`${booking.currency} ${booking.rate_per_night?.toLocaleString()}`} />
            <Detail label="Total" value={`${booking.currency} ${booking.total_price_idr?.toLocaleString()} ≈ EGP ${booking.total_price_egp?.toLocaleString()}`} />
            {booking.hotel_confirmation_number && <Detail label="Confirmation #" value={booking.hotel_confirmation_number} />}
            {booking.notes && <Detail label="Notes" value={booking.notes} />}
          </div>

          {/* Status update */}
          <div className="flex gap-2 flex-wrap">
            {['Availability pending', 'Confirmed', 'Paid', 'Cancelled'].map(s => (
              <button
                key={s}
                onClick={() => updateStatus.mutate({ status: s })}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  booking.status === s ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Confirm number */}
          {booking.status === 'Confirmed' && (
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                placeholder="Hotel confirmation number"
                value={confirmNumber}
                onChange={e => setConfirmNumber(e.target.value)}
              />
              <button
                onClick={() => updateStatus.mutate({ status: booking.status, confirmNum: confirmNumber })}
                className="text-sm bg-teal-600 text-white rounded-lg px-3 py-1.5 hover:bg-teal-700"
              >
                Save
              </button>
            </div>
          )}

          {/* Email actions */}
          <button
            onClick={onDraftEmail}
            className="flex items-center gap-1 text-sm text-teal-600 border border-teal-300 rounded-lg px-3 py-1.5 hover:bg-teal-50"
          >
            <Mail size={14} /> Draft availability request
          </button>

          {/* Email log */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">Email thread ({emails?.length ?? 0})</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emails?.map(e => (
                <div key={e.id} className={`text-xs rounded-lg p-2 ${e.direction === 'sent' ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="flex justify-between mb-0.5">
                    <span className={`font-medium ${e.direction === 'sent' ? 'text-teal-700' : 'text-slate-600'}`}>
                      {e.direction === 'sent' ? '→ Sent' : '← Received'}
                    </span>
                    <span className="text-slate-400">{e.sent_at.split('T')[0]}</span>
                  </div>
                  {e.subject && <div className="font-medium text-slate-700 mb-0.5">{e.subject}</div>}
                  <p className="text-slate-600 whitespace-pre-wrap line-clamp-3">{e.body}</p>
                </div>
              ))}
            </div>

            {/* Log incoming */}
            <div className="mt-2 pt-2 border-t border-slate-100">
              <input
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-1"
                placeholder="Subject of hotel's reply"
                value={incomingSubject}
                onChange={e => setIncomingSubject(e.target.value)}
              />
              <textarea
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 h-16 resize-none"
                placeholder="Paste hotel's reply here…"
                value={incomingEmail}
                onChange={e => setIncomingEmail(e.target.value)}
              />
              <button
                onClick={logIncoming}
                disabled={!incomingEmail.trim()}
                className="w-full text-xs bg-slate-600 text-white rounded py-1 mt-1 hover:bg-slate-700 disabled:opacity-50"
              >
                Log received email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-500 shrink-0 w-28">{label}:</span>
      <span className="text-slate-800">{value}</span>
    </div>
  )
}

// ---- Booking Form ----
function BookingForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    client_name: '', hotel_id: '', room_type_id: '',
    checkin_date: '', checkout_date: '', meal_plan: '',
    rate_per_night: '', currency: 'IDR', notes: '',
    status: 'Availability pending',
  })
  const [saving, setSaving] = useState(false)

  const { data: hotels } = useQuery<HmsHotel[]>({
    queryKey: ['hms_hotels_booking'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_hotels').select('*').eq('contract_status', 'Active').order('name')
      return data ?? []
    },
  })

  const { data: rooms } = useQuery<HmsRoomType[]>({
    queryKey: ['hms_rooms_booking', form.hotel_id],
    queryFn: async () => {
      const { data } = await supabase.from('hms_room_types').select('*').eq('hotel_id', form.hotel_id).order('name')
      return data ?? []
    },
    enabled: !!form.hotel_id,
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function handleRoomSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const roomId = e.target.value
    const room = rooms?.find(r => r.id === roomId)
    setForm(f => ({
      ...f,
      room_type_id: roomId,
      meal_plan: room?.meal_plan ?? f.meal_plan,
      currency: room?.currency ?? f.currency,
    }))
  }

  async function save() {
    setSaving(true)
    const nights = nightsBetween(form.checkin_date, form.checkout_date)
    const rate = parseFloat(form.rate_per_night) || 0
    const totalIdr = rate * nights
    const settings = await getSettings()
    const idrToEgp = parseFloat(settings.IDR_to_EGP)
    const totalEgp = form.currency === 'IDR' ? totalIdr * idrToEgp
      : form.currency === 'THB' ? totalIdr * parseFloat(settings.THB_to_EGP)
      : totalIdr * parseFloat(settings.USD_to_EGP)

    await supabase.from('hms_bookings').insert({
      ...form,
      rate_per_night: rate,
      nights,
      total_price_idr: totalIdr,
      total_price_egp: Math.round(totalEgp),
    })
    setSaving(false)
    onSaved()
    toast.success('Booking created')
  }

  return (
    <Modal title="New Booking" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Client name *</label>
          <input className={inp} value={form.client_name} onChange={set('client_name')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hotel *</label>
          <select className={inp} value={form.hotel_id} onChange={set('hotel_id')}>
            <option value="">Select hotel…</option>
            {hotels?.map(h => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
          </select>
        </div>
        {form.hotel_id && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Room type</label>
            <select className={inp} value={form.room_type_id} onChange={handleRoomSelect}>
              <option value="">Select room…</option>
              {rooms?.map(r => <option key={r.id} value={r.id}>{r.name} ({r.meal_plan})</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-in *</label>
            <input type="date" className={inp} value={form.checkin_date} onChange={set('checkin_date')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-out *</label>
            <input type="date" className={inp} value={form.checkout_date} onChange={set('checkout_date')} />
          </div>
        </div>
        {form.checkin_date && form.checkout_date && (
          <p className="text-xs text-slate-500">{nightsBetween(form.checkin_date, form.checkout_date)} nights</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rate/night</label>
            <input type="number" className={inp} value={form.rate_per_night} onChange={set('rate_per_night')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <select className={inp} value={form.currency} onChange={set('currency')}>
              <option>IDR</option><option>THB</option><option>USD</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Meal plan</label>
          <select className={inp} value={form.meal_plan} onChange={set('meal_plan')}>
            {['','RO','BB','HB','FB','AI'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (honeymoon decoration, transfers, etc.)</label>
          <textarea className={`${inp} h-16 resize-none`} value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Cancel</button>
        <button
          onClick={save}
          disabled={saving || !form.client_name || !form.hotel_id || !form.checkin_date || !form.checkout_date}
          className="text-sm bg-teal-600 text-white rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Create Booking'}
        </button>
      </div>
    </Modal>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'
