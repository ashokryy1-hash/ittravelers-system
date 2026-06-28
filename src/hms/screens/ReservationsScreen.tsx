import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Mail, ChevronDown, ChevronUp, AlertTriangle, Users, List, ChevronRight, Trash2 } from 'lucide-react'
import type { HmsBooking, HmsBookingEmail, HmsHotel, HmsRoomType } from '../types'
import EmailPreviewPanel from '../components/EmailPreviewPanel'
import { Modal } from './RatesScreen'
import { getSettings } from '../lib/settings'
import { getSeasonForStay, seasonLabel, nightsBetween } from '../lib/season'
import type { HmsSurchargeRule } from '../types'
import toast from 'react-hot-toast'

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / 86400000)
}

const STATUS_COLORS: Record<string, string> = {
  'Availability pending': 'bg-amber-100 text-amber-700',
  'Confirmed': 'bg-teal-100 text-teal-700',
  'Paid': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
}

function buildEmailTemplate(type: 'availability' | 'confirm' | 'payment' | 'cancel' | 'reminder', booking: HmsBooking, settings: Record<string, string>, season: string = 'Low') {
  const hotel = (booking as any).hms_hotels
  const room = (booking as any).hms_room_types
  const hotelName = hotel?.name ?? 'your hotel'
  const roomName = room?.name ?? booking.notes ?? 'the reserved room'
  const mealPlan = room?.meal_plan ?? ''
  const currency = booking.currency
  const rate = booking.rate_per_night?.toLocaleString() ?? '0'
  const checkin = booking.checkin_date
  const checkout = booking.checkout_date
  const nights = booking.nights
  const sig = settings.agency_signature ?? 'ITTravelers\nAhmed Shokry – Operations Manager'
  const toEmail = hotel?.reservation_email || hotel?.contact_email || ''
  const seasonNote = season !== 'Low' ? ` (${season} Season)` : ''

  if (type === 'availability') {
    return {
      to: toEmail,
      subject: `Availability Request — ${checkin} to ${checkout} | ${hotelName}`,
      body: `Dear Reservations Team,

I hope this message finds you well.

I am writing on behalf of ITTravelers to kindly request availability for the following reservation:

• Hotel: ${hotelName}
• Room Type: ${roomName}${mealPlan ? ` (${mealPlan})` : ''}
• Check-in: ${checkin}
• Check-out: ${checkout}
• Duration: ${nights} night${nights !== 1 ? 's' : ''}
• Rate: ${currency} ${rate}/night${seasonNote} (as per our corporate contract)
• Guests: Honeymoon couple

Could you please confirm availability and kindly hold the room pending our voucher?

We look forward to your reply.

${sig}`,
    }
  }

  if (type === 'confirm') {
    return {
      to: toEmail,
      subject: `Reservation Confirmation — ${checkin} to ${checkout} | ${hotelName}`,
      body: `Dear Reservations Team,

Thank you for confirming availability. We are pleased to proceed with the following reservation:

• Hotel: ${hotelName}
• Guest: ${booking.client_name} (Honeymoon couple)
• Room Type: ${roomName}${mealPlan ? ` (${mealPlan})` : ''}
• Check-in: ${checkin} at 2:00 PM
• Check-out: ${checkout} at 12:00 PM
• Duration: ${nights} night${nights !== 1 ? 's' : ''}
• Rate: ${currency} ${rate}/night${seasonNote} (as per our corporate contract)
• Total: ${currency} ${booking.total_price_idr?.toLocaleString()}

Please send us the official hotel voucher and payment details at your earliest convenience.

${sig}`,
    }
  }

  if (type === 'payment') {
    return {
      to: toEmail,
      subject: `Payment Confirmation — ${booking.client_name} | ${checkin} | ${hotelName}`,
      body: `Dear Reservations Team,

We are writing to confirm that payment has been processed for the following reservation:

• Hotel: ${hotelName}
• Guest: ${booking.client_name}
• Room Type: ${roomName}
• Check-in: ${checkin}
• Check-out: ${checkout}
• Total Paid: ${currency} ${booking.total_price_idr?.toLocaleString()}
${booking.hotel_confirmation_number ? `• Confirmation Number: ${booking.hotel_confirmation_number}` : ''}

Please kindly acknowledge receipt and confirm the reservation is fully secured.

${sig}`,
    }
  }

  if (type === 'reminder') {
    return {
      to: toEmail,
      subject: `Follow-up: Availability Request — ${checkin} to ${checkout} | ${hotelName}`,
      body: `Dear Reservations Team,

I hope you are doing well.

I am following up on my previous availability request for the below reservation, as we have not yet received a response:

• Hotel: ${hotelName}
• Room Type: ${roomName}${mealPlan ? ` (${mealPlan})` : ''}
• Check-in: ${checkin}
• Check-out: ${checkout}
• Duration: ${nights} night${nights !== 1 ? 's' : ''}
• Rate: ${currency} ${rate}/night${seasonNote} (as per our corporate contract)
• Guests: Honeymoon couple

Could you please kindly confirm availability at your earliest convenience? We would like to proceed with the booking as soon as possible.

Thank you for your time and we look forward to hearing from you.

${sig}`,
    }
  }

  // cancel
  return {
    to: toEmail,
    subject: `Cancellation Request — ${booking.client_name} | ${checkin} | ${hotelName}`,
    body: `Dear Reservations Team,

We regret to inform you that we must cancel the following reservation:

• Hotel: ${hotelName}
• Guest: ${booking.client_name}
• Room Type: ${roomName}
• Check-in: ${checkin}
• Check-out: ${checkout}
${booking.hotel_confirmation_number ? `• Confirmation Number: ${booking.hotel_confirmation_number}` : ''}

We sincerely apologise for any inconvenience caused. Please confirm the cancellation and advise on any applicable charges per your cancellation policy.

${sig}`,
  }
}

export default function ReservationsScreen() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [openBooking, setOpenBooking] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState<{ to: string; subject: string; body: string; bookingId: string } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [view, setView] = useState<'list' | 'clients'>('list')
  const [openClient, setOpenClient] = useState<string | null>(null)

  const { data: bookings } = useQuery<HmsBooking[]>({
    queryKey: ['hms_bookings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_bookings')
        .select('*, cutoff_date, hms_hotels(name, contact_email, reservation_email, city, surcharge_waiver, destination_id), hms_room_types(name, room_category, meal_plan, currency, low_season_rate, high_season_rate, peak_season_rate)')
        .order('checkin_date')
      return data ?? []
    },
  })

  async function useTemplate(type: 'availability' | 'confirm' | 'payment' | 'cancel' | 'reminder', booking: HmsBooking) {
    const settings = await getSettings()
    // Fetch surcharge rules for the hotel's destination to determine season
    const hotel = (booking as any).hms_hotels
    let season = 'Low'
    if (hotel?.destination_id && booking.checkin_date && booking.checkout_date) {
      const { data: rules } = await supabase
        .from('hms_surcharge_rules')
        .select('*')
        .eq('destination_id', hotel.destination_id)
      if (rules && rules.length > 0) {
        const { season: s } = getSeasonForStay(booking.checkin_date, booking.checkout_date, rules as HmsSurchargeRule[])
        season = seasonLabel(s)
      }
    }
    const draft = buildEmailTemplate(type, booking, settings, season)
    setEmailDraft({ ...draft, bookingId: booking.id })
  }

  async function draftAvailabilityEmail(booking: HmsBooking) {
    const settings = await getSettings()
    toast.loading('Generating AI draft…', { id: 'draft' })

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
      const res = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const body = data.text ?? ''
      toast.dismiss('draft')
      const toEmail = hotel?.reservation_email || hotel?.contact_email || ''
      setEmailDraft({
        to: toEmail,
        subject: `Availability Request — ${booking.checkin_date} to ${booking.checkout_date}`,
        body,
        bookingId: booking.id,
      })
    } catch {
      toast.dismiss('draft')
      toast.error('Failed to generate draft.')
    }
  }

  async function sendEmail(subject: string, body: string, to: string) {
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
        body: JSON.stringify({ to, subject, body, senderName: settings.outlook_sender_name }),
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

  // Group bookings by client name for the Clients view (normalize: trim + title-case for deduplication)
  const normalizeClientName = (name: string) => name.trim().toLowerCase()
  const clientGroups = filtered.reduce<Record<string, { displayName: string; bookings: HmsBooking[] }>>((acc, b) => {
    const raw = b.client_name || 'Unknown'
    const key = normalizeClientName(raw)
    if (!acc[key]) acc[key] = { displayName: raw.trim(), bookings: [] }
    acc[key].bookings.push(b)
    return acc
  }, {})

  async function deleteBooking(id: string) {
    await supabase.from('hms_booking_emails').delete().eq('booking_id', id)
    await supabase.from('hms_bookings').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['hms_bookings'] })
    toast.success('Booking deleted')
  }

  const renderBookingCard = (booking: HmsBooking) => (
    <BookingCard
      key={booking.id}
      booking={booking}
      expanded={openBooking === booking.id}
      onToggle={() => setOpenBooking(openBooking === booking.id ? null : booking.id)}
      onDraftEmail={() => draftAvailabilityEmail(booking)}
      onTemplate={(type) => useTemplate(type, booking)}
      onDelete={() => deleteBooking(booking.id)}
    />
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reservations</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <List size={13} /> All
            </button>
            <button
              onClick={() => setView('clients')}
              className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${view === 'clients' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={13} /> Clients
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
          >
            <Plus size={15} /> New Booking
          </button>
        </div>
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

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-2">
          {filtered.map(renderBookingCard)}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">No bookings found.</div>
          )}
        </div>
      )}

      {/* Clients view */}
      {view === 'clients' && (
        <div className="space-y-3">
          {Object.keys(clientGroups).length === 0 && (
            <div className="text-center py-12 text-slate-400">No clients found.</div>
          )}
          {Object.entries(clientGroups).sort(([a], [b]) => a.localeCompare(b)).map(([key, { displayName, bookings: clientBookings }]) => {
            const isOpen = openClient === key
            const statusCounts = clientBookings.reduce<Record<string, number>>((acc, b) => {
              acc[b.status] = (acc[b.status] ?? 0) + 1
              return acc
            }, {})
            const hasPending = (statusCounts['Availability pending'] ?? 0) > 0

            return (
              <div key={key} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenClient(isOpen ? null : key)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{displayName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {clientBookings.length} booking{clientBookings.length !== 1 ? 's' : ''}
                        {Object.entries(statusCounts).map(([s, n]) => (
                          <span key={s} className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[s] ?? 'bg-slate-100 text-slate-600'}`}>
                            {n} {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasPending && (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        <AlertTriangle size={11} /> Awaiting reply
                      </span>
                    )}
                    {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-3 py-3 space-y-2 bg-slate-50">
                    {clientBookings.map(renderBookingCard)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <BookingForm
          existingClients={[...new Set((bookings ?? []).map(b => b.client_name?.trim()).filter(Boolean))] as string[]}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['hms_bookings'] }) }}
        />
      )}

      {emailDraft && (
        <EmailPreviewPanel
          to={emailDraft.to}
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

function BookingCard({ booking, expanded, onToggle, onDraftEmail, onTemplate, onDelete }: {
  booking: HmsBooking
  expanded: boolean
  onToggle: () => void
  onDraftEmail: () => void
  onTemplate: (type: 'availability' | 'confirm' | 'payment' | 'cancel' | 'reminder') => void
  onDelete: () => void
}) {
  const qc = useQueryClient()
  const hotel = (booking as any).hms_hotels
  const room = (booking as any).hms_room_types
  const [incomingEmail, setIncomingEmail] = useState('')
  const [incomingSubject, setIncomingSubject] = useState('')
  const [confirmNumber, setConfirmNumber] = useState(booking.hotel_confirmation_number ?? '')
  const [cutoffDate, setCutoffDate] = useState(booking.cutoff_date ?? '')
  const [editingName, setEditingName] = useState(false)
  const [clientName, setClientName] = useState(booking.client_name ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cutoffDays = daysUntil(booking.cutoff_date)
  const showCutoffWarning = cutoffDays !== null && cutoffDays <= 14 && booking.status !== 'Paid' && booking.status !== 'Cancelled'

  const { data: emails } = useQuery<HmsBookingEmail[]>({
    queryKey: ['hms_booking_emails', booking.id],
    queryFn: async () => {
      const { data } = await supabase.from('hms_booking_emails').select('*').eq('booking_id', booking.id).order('sent_at')
      return data ?? []
    },
    enabled: expanded,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ status, confirmNum, cutoff }: { status: string; confirmNum?: string; cutoff?: string | null }) => {
      await supabase.from('hms_bookings').update({
        status,
        hotel_confirmation_number: confirmNum ?? booking.hotel_confirmation_number,
        ...(cutoff !== undefined ? { cutoff_date: cutoff } : {}),
      }).eq('id', booking.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hms_bookings'] }),
  })

  async function saveClientName() {
    if (!clientName.trim()) return
    await supabase.from('hms_bookings').update({ client_name: clientName.trim() }).eq('id', booking.id)
    qc.invalidateQueries({ queryKey: ['hms_bookings'] })
    setEditingName(false)
    toast.success('Client name updated')
  }

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
              <span className="font-medium text-slate-800">{clientName || booking.client_name}</span>
              <span className="text-sm text-slate-500">{hotel?.name} · {hotel?.city}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {booking.checkin_date} → {booking.checkout_date} ({booking.nights}n) · {room?.name}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showCutoffWarning && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                <AlertTriangle size={12} />
                {cutoffDays! <= 0 ? 'Cutoff PASSED' : `Pay in ${cutoffDays}d`}
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[booking.status] ?? ''}`}>
              {booking.status}
            </span>
            {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* Editable client name */}
          <div className="flex items-center gap-2">
            {editingName ? (
              <>
                <input
                  autoFocus
                  className="text-sm font-medium border border-teal-400 rounded-lg px-3 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveClientName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button onClick={saveClientName} className="text-xs bg-teal-600 text-white rounded-lg px-3 py-1.5 hover:bg-teal-700">Save</button>
                <button onClick={() => setEditingName(false)} className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">Cancel</button>
              </>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setEditingName(true) }}
                className="text-sm font-medium text-slate-800 hover:text-teal-600 flex items-center gap-1 group"
              >
                {clientName}
                <span className="text-xs text-slate-400 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity">(edit name)</span>
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <Detail label="Room" value={`${room?.name} (${room?.meal_plan})`} />
            <Detail label="Rate/night" value={`${booking.currency} ${booking.rate_per_night?.toLocaleString()}`} />
            <Detail label="Total" value={`${booking.currency} ${booking.total_price_idr?.toLocaleString()} ≈ EGP ${booking.total_price_egp?.toLocaleString()}`} />
            {booking.hotel_confirmation_number && <Detail label="Confirmation #" value={booking.hotel_confirmation_number} />}
            {booking.notes && <Detail label="Notes" value={booking.notes} />}
          </div>

          {/* Status update */}
          <div className="flex items-center gap-2 flex-wrap">
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
            {booking.status === 'Cancelled' && (
              <div className="ml-auto flex items-center gap-1">
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-red-600">Delete permanently?</span>
                    <button
                      onClick={onDelete}
                      className="text-xs bg-red-600 text-white rounded-lg px-3 py-1 hover:bg-red-700"
                    >Yes, delete</button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs border border-slate-300 rounded-lg px-3 py-1 hover:bg-slate-50"
                    >Cancel</button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg px-3 py-1 hover:bg-red-100"
                  >
                    <Trash2 size={12} /> Delete booking
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Confirm number + cutoff date */}
          {booking.status === 'Confirmed' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                  placeholder="Hotel confirmation number"
                  value={confirmNumber}
                  onChange={e => setConfirmNumber(e.target.value)}
                />
                <button
                  onClick={() => updateStatus.mutate({ status: booking.status, confirmNum: confirmNumber, cutoff: cutoffDate || null })}
                  className="text-sm bg-teal-600 text-white rounded-lg px-3 py-1.5 hover:bg-teal-700"
                >
                  Save
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 shrink-0">Hotel payment cutoff:</label>
                <input
                  type="date"
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 flex-1"
                  value={cutoffDate}
                  onChange={e => setCutoffDate(e.target.value)}
                />
                <span className="text-xs text-slate-400">(reminder 14 days before)</span>
              </div>
            </div>
          )}

          {/* Email templates */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">Email templates (instant, no AI needed)</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onTemplate('availability')}
                className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-100">
                <Mail size={13} /> Availability request
              </button>
              {booking.status === 'Availability pending' && (
                <button onClick={() => onTemplate('reminder')}
                  className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 hover:bg-orange-100">
                  <AlertTriangle size={13} /> Send reminder
                </button>
              )}
              <button onClick={() => onTemplate('confirm')}
                className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100">
                <Mail size={13} /> Confirm reservation
              </button>
              <button onClick={() => onTemplate('payment')}
                className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-100">
                <Mail size={13} /> Payment confirmation
              </button>
              <button onClick={() => onTemplate('cancel')}
                className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-100">
                <Mail size={13} /> Cancellation request
              </button>
            </div>
            <button onClick={onDraftEmail}
              className="mt-2 flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
              <Mail size={13} /> AI-written draft (requires Anthropic credits)
            </button>
          </div>

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
function BookingForm({ onClose, onSaved, existingClients }: { onClose: () => void; onSaved: () => void; existingClients: string[] }) {
  const [hotelMode, setHotelMode] = useState<'contract' | 'manual'>('contract')
  const [form, setForm] = useState({
    client_name: '', hotel_id: '', room_type_id: '',
    manual_hotel_name: '', manual_room_type: '',
    checkin_date: '', checkout_date: '', meal_plan: '',
    rate_per_night: '', currency: 'IDR', notes: '',
    status: 'Availability pending',
  })
  const [saving, setSaving] = useState(false)
  const [detectedSeason, setDetectedSeason] = useState<'low' | 'high' | 'peak'>('low')

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

  const { data: surchargeRules } = useQuery<HmsSurchargeRule[]>({
    queryKey: ['hms_surcharge_rules_form', form.hotel_id],
    queryFn: async () => {
      const hotel = hotels?.find(h => h.id === form.hotel_id)
      if (!hotel?.destination_id) return []
      const { data } = await supabase.from('hms_surcharge_rules').select('*').eq('destination_id', hotel.destination_id)
      return data ?? []
    },
    enabled: !!form.hotel_id && !!hotels,
  })

  function getRateForSeason(room: HmsRoomType, season: 'low' | 'high' | 'peak'): string {
    if (season === 'peak' && room.peak_season_rate) return String(room.peak_season_rate)
    if (season === 'high' && room.high_season_rate) return String(room.high_season_rate)
    return room.low_season_rate ? String(room.low_season_rate) : ''
  }

  function applySeasonRate(roomId: string, checkin: string) {
    const room = rooms?.find(r => r.id === roomId)
    if (!room) return
    let season: 'low' | 'high' | 'peak' = 'low'
    if (checkin && surchargeRules && surchargeRules.length > 0) {
      const { season: s } = getSeasonForStay(checkin, checkin, surchargeRules)
      season = s
    }
    setDetectedSeason(season)
    setForm(f => ({
      ...f,
      room_type_id: roomId,
      meal_plan: room.meal_plan ?? f.meal_plan,
      currency: room.currency ?? f.currency,
      rate_per_night: getRateForSeason(room, season),
    }))
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setForm(f => ({ ...f, [k]: value }))
    // Re-apply season rate when check-in date changes and a room is already selected
    if (k === 'checkin_date' && form.room_type_id) {
      applySeasonRate(form.room_type_id, value)
    }
  }

  function handleRoomSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    applySeasonRate(e.target.value, form.checkin_date)
  }

  async function save() {
    if (!form.client_name.trim()) return toast.error('Client name required')
    if (hotelMode === 'contract' && !form.hotel_id) return toast.error('Please select a hotel')
    if (hotelMode === 'manual' && !form.manual_hotel_name.trim()) return toast.error('Please enter hotel name')
    if (!form.checkin_date || !form.checkout_date) return toast.error('Dates required')
    setSaving(true)
    const nights = nightsBetween(form.checkin_date, form.checkout_date)
    const rate = parseFloat(form.rate_per_night) || 0
    const totalIdr = rate * nights
    const settings = await getSettings()
    const idrToEgp = parseFloat(settings.IDR_to_EGP)
    const totalEgp = form.currency === 'IDR' ? totalIdr * idrToEgp
      : form.currency === 'THB' ? totalIdr * parseFloat(settings.THB_to_EGP)
      : totalIdr * parseFloat(settings.USD_to_EGP)

    const notesValue = hotelMode === 'manual'
      ? `Hotel: ${form.manual_hotel_name}${form.manual_room_type ? ` | Room: ${form.manual_room_type}` : ''}${form.notes ? `\n${form.notes}` : ''}`
      : form.notes

    const { error } = await supabase.from('hms_bookings').insert({
      client_name: form.client_name.trim(),
      hotel_id: hotelMode === 'contract' ? (form.hotel_id || null) : null,
      room_type_id: hotelMode === 'contract' ? (form.room_type_id || null) : null,
      checkin_date: form.checkin_date,
      checkout_date: form.checkout_date,
      meal_plan: form.meal_plan || null,
      rate_per_night: rate,
      currency: form.currency,
      notes: notesValue || null,
      status: form.status,
      nights,
      total_price_idr: totalIdr,
      total_price_egp: Math.round(totalEgp),
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    onSaved()
    toast.success('Booking created')
  }

  return (
    <Modal title="New Booking" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Client name *</label>
          <input
            className={inp}
            list="existing-clients"
            placeholder="Type or select existing client…"
            value={form.client_name}
            onChange={set('client_name')}
          />
          <datalist id="existing-clients">
            {existingClients.sort().map(name => <option key={name} value={name} />)}
          </datalist>
        </div>
        {/* Hotel mode toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(['contract', 'manual'] as const).map(mode => (
            <button key={mode} type="button" onClick={() => { setHotelMode(mode); setForm(f => ({ ...f, hotel_id: '', room_type_id: '', manual_hotel_name: '', manual_room_type: '' })) }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${hotelMode === mode ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              {mode === 'contract' ? '📋 From Contracts' : '✏️ Enter Manually'}
            </button>
          ))}
        </div>

        {hotelMode === 'contract' ? (
          <>
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
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hotel name *</label>
              <input className={inp} placeholder="e.g. Four Seasons Bali at Sayan" value={form.manual_hotel_name} onChange={set('manual_hotel_name')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Room type</label>
              <input className={inp} placeholder="e.g. Deluxe Pool Villa" value={form.manual_room_type} onChange={set('manual_room_type')} />
            </div>
          </>
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
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">{nightsBetween(form.checkin_date, form.checkout_date)} nights</p>
            {form.room_type_id && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                detectedSeason === 'peak' ? 'bg-red-100 text-red-700' :
                detectedSeason === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {seasonLabel(detectedSeason)} Season
              </span>
            )}
          </div>
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
          disabled={saving || !form.client_name || !form.checkin_date || !form.checkout_date || (hotelMode === 'contract' && !form.hotel_id) || (hotelMode === 'manual' && !form.manual_hotel_name)}
          className="text-sm bg-teal-600 text-white rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Create Booking'}
        </button>
      </div>
    </Modal>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'
