import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import {
  Inbox, ClipboardPaste, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, XCircle, Eye, Loader2, Save, Trash2, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

interface InboxEmail {
  id: string
  received_at: string
  from_address: string | null
  subject: string | null
  body: string
  extracted_data: any | null
  status: 'unreviewed' | 'saved_reservation' | 'saved_tour' | 'ignored'
  linked_booking_id: string | null
  created_at: string
}

interface ExtractedData {
  type: 'reservation' | 'tour' | 'unknown'
  client_name: string | null
  hotel_name: string | null
  room_type: string | null
  checkin_date: string | null
  checkout_date: string | null
  nights: number | null
  rate_per_night: number | null
  currency: string | null
  meal_plan: string | null
  confirmation_number: string | null
  cutoff_date: string | null
  status: string | null
  notes: string | null
  tour_destination: string | null
  tour_days: any[] | null
  warnings: string[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unreviewed: { label: 'Unreviewed', color: 'bg-amber-100 text-amber-700' },
  saved_reservation: { label: 'Saved to Reservations', color: 'bg-green-100 text-green-700' },
  saved_tour: { label: 'Saved to Tours', color: 'bg-blue-100 text-blue-700' },
  ignored: { label: 'Ignored', color: 'bg-ivory-200 text-ivory-500' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function InboxScreen() {
  const qc = useQueryClient()
  const [view, setView] = useState<'list' | 'paste' | 'review'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null)
  const [editedData, setEditedData] = useState<ExtractedData | null>(null)

  // Paste form state
  const [pasteSubject, setPasteSubject] = useState('')
  const [pasteFrom, setPasteFrom] = useState('')
  const [pasteBody, setPasteBody] = useState('')
  const [extracting, setExtracting] = useState(false)

  const { data: emails, isLoading } = useQuery<InboxEmail[]>({
    queryKey: ['inbox-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hms_inbox_emails')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: hotels } = useQuery({
    queryKey: ['hms-hotels-inbox'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_hotels').select('id, name, city')
      return data ?? []
    },
  })

  const { data: roomTypes } = useQuery({
    queryKey: ['hms-rooms-inbox'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_room_types').select('id, hotel_id, name')
      return data ?? []
    },
  })

  const updateEmail = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InboxEmail> }) => {
      const { error } = await supabase.from('hms_inbox_emails').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox-emails'] }),
  })

  const deleteEmail = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hms_inbox_emails').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-emails'] })
      setView('list')
      setSelectedEmail(null)
    },
  })

  function mockExtract(body: string, subject: string): ExtractedData {
    const lower = body.toLowerCase()
    const isTour = lower.includes('day') && (lower.includes('itinerary') || lower.includes('program') || lower.includes('tour'))

    // Try to pull simple patterns from the pasted text
    const clientMatch = body.match(/(?:guest(?:\s+name)?|client|dear\s+mr\.?\s*&?\s*mrs\.?|for\s+mr\.?\s*&?\s*mrs\.?)[\s:]+([A-Z][a-z]+(?:\s*&\s*[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+)?)/i)
    const hotelMatch = body.match(/(?:hotel|property|resort|villa)[\s:]+([A-Za-z &'.-]+)/i)
    const checkinMatch = body.match(/(?:check[-\s]?in|arrival)[\s:]+([0-9]{1,2}[\s/.-][A-Za-z0-9]+[\s/.-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i)
    const checkoutMatch = body.match(/(?:check[-\s]?out|departure)[\s:]+([0-9]{1,2}[\s/.-][A-Za-z0-9]+[\s/.-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i)
    const nightsMatch = body.match(/(\d+)\s*nights?/i)
    const rateMatch = body.match(/(?:rate|price|cost)[\s\w]*?:?\s*(?:USD|IDR|THB|EGP)?\s*([\d,]+(?:\.\d+)?)\s*(?:\/\s*night|per\s*night)?/i)
    const currencyMatch = body.match(/\b(USD|IDR|THB|EGP)\b/)
    const confMatch = body.match(/(?:confirmation|booking|ref(?:erence)?)[\s#:]+([A-Z0-9-]{4,20})/i)
    const cutoffMatch = body.match(/(?:payment|cutoff|deadline|due)[\s\w]*?(?:by|before|on)?[\s:]+([0-9]{1,2}[\s/.-][A-Za-z0-9]+[\s/.-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i)
    const mealMatch = body.match(/\b(BB|HB|FB|AI|all[\s-]inclusive|breakfast|half[\s-]board|full[\s-]board)\b/i)
    const roomMatch = body.match(/(?:room(?:\s+type)?|suite|villa)[\s:]+([A-Za-z ]+?)(?:\n|,|\.)/i)

    function parseDate(raw: string | undefined): string | null {
      if (!raw) return null
      const cleaned = raw.trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned
      const d = new Date(cleaned)
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
      return null
    }

    const checkin = parseDate(checkinMatch?.[1])
    const checkout = parseDate(checkoutMatch?.[1])
    const nights = nightsMatch ? parseInt(nightsMatch[1]) :
      (checkin && checkout ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : null)

    const warnings: string[] = []
    const clientName = clientMatch?.[1]?.trim() ?? null
    const hotelName = hotelMatch?.[1]?.trim().replace(/\s*:.*/, '') ?? null
    const rate = rateMatch ? parseFloat(rateMatch[1].replace(/,/g, '')) : null

    if (!clientName) warnings.push('Missing client name')
    if (!hotelName) warnings.push('Missing hotel name')
    if (!checkin) warnings.push('Missing check-in date')
    if (!checkout) warnings.push('Missing check-out date')
    if (!confMatch) warnings.push('Missing confirmation number')
    if (!cutoffMatch) warnings.push('Missing cutoff / payment deadline date')
    if (!rate) warnings.push('Missing rate per night')

    if (isTour) {
      return {
        type: 'tour',
        client_name: clientName,
        hotel_name: null,
        room_type: null,
        checkin_date: checkin,
        checkout_date: checkout,
        nights,
        rate_per_night: null,
        currency: currencyMatch?.[1] ?? null,
        meal_plan: null,
        confirmation_number: confMatch?.[1] ?? null,
        cutoff_date: null,
        status: null,
        notes: null,
        tour_destination: subject || 'Unknown',
        tour_days: [],
        warnings,
      }
    }

    return {
      type: 'reservation',
      client_name: clientName,
      hotel_name: hotelName,
      room_type: roomMatch?.[1]?.trim() ?? null,
      checkin_date: checkin,
      checkout_date: checkout,
      nights,
      rate_per_night: rate,
      currency: currencyMatch?.[1] ?? 'USD',
      meal_plan: mealMatch?.[1]?.toUpperCase() ?? null,
      confirmation_number: confMatch?.[1] ?? null,
      cutoff_date: parseDate(cutoffMatch?.[1]),
      status: lower.includes('confirm') ? 'Confirmed' : 'Availability pending',
      notes: null,
      tour_destination: null,
      tour_days: null,
      warnings,
    }
  }

  async function handleExtract() {
    if (!pasteBody.trim()) return toast.error('Paste an email body first')
    setExtracting(true)
    try {
      // MOCK MODE — reads patterns from the email text directly in the browser.
      // Replace with real API call once Anthropic credits are added.
      await new Promise(r => setTimeout(r, 1200)) // simulate processing time
      const extracted = mockExtract(pasteBody, pasteSubject)

      // Save to DB
      const { data, error } = await supabase
        .from('hms_inbox_emails')
        .insert({
          subject: pasteSubject || null,
          from_address: pasteFrom || null,
          body: pasteBody,
          extracted_data: extracted,
          status: 'unreviewed',
        })
        .select()
        .single()
      if (error) throw error

      qc.invalidateQueries({ queryKey: ['inbox-emails'] })
      toast.success('Email analysed — review the extracted data')
      setPasteSubject('')
      setPasteFrom('')
      setPasteBody('')
      setSelectedEmail(data)
      setEditedData(extracted)
      setView('review')
    } catch (err: any) {
      toast.error(err.message ?? 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  function openReview(email: InboxEmail) {
    setSelectedEmail(email)
    setEditedData(email.extracted_data ? { ...email.extracted_data } : null)
    setView('review')
  }

  async function saveAsReservation() {
    if (!editedData || !selectedEmail) return
    const d = editedData

    // Find hotel match
    const hotelMatch = hotels?.find(h =>
      h.name.toLowerCase().includes((d.hotel_name ?? '').toLowerCase()) ||
      (d.hotel_name ?? '').toLowerCase().includes(h.name.toLowerCase())
    )
    const roomMatch = hotelMatch
      ? roomTypes?.find(r =>
          r.hotel_id === hotelMatch.id &&
          r.name.toLowerCase().includes((d.room_type ?? '').toLowerCase())
        )
      : null

    const nights = d.nights ??
      (d.checkin_date && d.checkout_date
        ? Math.round((new Date(d.checkout_date).getTime() - new Date(d.checkin_date).getTime()) / 86400000)
        : null)

    const total = nights && d.rate_per_night ? nights * d.rate_per_night : null

    const { data: booking, error } = await supabase
      .from('hms_bookings')
      .insert({
        client_name: d.client_name ?? 'Unknown Client',
        hotel_id: hotelMatch?.id ?? null,
        room_type_id: roomMatch?.id ?? null,
        checkin_date: d.checkin_date ?? '',
        checkout_date: d.checkout_date ?? '',
        nights,
        rate_per_night: d.rate_per_night,
        total_price_idr: null,
        total_price_egp: null,
        currency: d.currency ?? 'USD',
        meal_plan: d.meal_plan,
        status: d.status ?? 'Availability pending',
        hotel_confirmation_number: d.confirmation_number,
        cutoff_date: d.cutoff_date,
        notes: d.notes,
        quoted_price: total,
        paid_price: null,
      })
      .select()
      .single()

    if (error) { toast.error('Failed to save booking: ' + error.message); return }

    await updateEmail.mutateAsync({
      id: selectedEmail.id,
      updates: { status: 'saved_reservation', linked_booking_id: booking.id, extracted_data: editedData },
    })

    toast.success('Saved to Reservations')
    setView('list')
  }

  async function saveAsTour() {
    if (!editedData || !selectedEmail) return
    const d = editedData

    const { data: tour, error: tourError } = await supabase
      .from('hms_tours')
      .insert({
        client_name: d.client_name ?? 'Unknown Client',
        destination: d.tour_destination ?? 'Unknown',
        status: 'Pending',
      })
      .select()
      .single()

    if (tourError) { toast.error('Failed to save tour: ' + tourError.message); return }

    if (d.tour_days?.length) {
      const days = d.tour_days.map((day: any) => ({
        tour_id: tour.id,
        day_number: day.day_number,
        title: day.title,
        description: day.description ?? null,
        date: day.date ?? null,
        booking_link: day.booking_link ?? null,
        status: 'Pending',
        quoted_price: null,
        paid_price: null,
      }))
      const { error: daysError } = await supabase.from('hms_tour_days').insert(days)
      if (daysError) toast.error('Tour saved but days failed: ' + daysError.message)
    }

    await updateEmail.mutateAsync({
      id: selectedEmail.id,
      updates: { status: 'saved_tour', extracted_data: editedData },
    })

    toast.success('Saved to Tours')
    setView('list')
  }

  async function ignoreEmail() {
    if (!selectedEmail) return
    await updateEmail.mutateAsync({ id: selectedEmail.id, updates: { status: 'ignored' } })
    toast.success('Email marked as ignored')
    setView('list')
  }

  const filtered = (emails ?? []).filter(e =>
    filterStatus === 'all' ? true : e.status === filterStatus
  )

  const unreviewedCount = (emails ?? []).filter(e => e.status === 'unreviewed').length

  // ── REVIEW PANEL ──
  if (view === 'review' && selectedEmail && editedData) {
    const d = editedData
    const hotelMatch = hotels?.find(h =>
      h.name.toLowerCase().includes((d.hotel_name ?? '').toLowerCase()) ||
      (d.hotel_name ?? '').toLowerCase().includes(h.name.toLowerCase())
    )

    function updateField(key: keyof ExtractedData, value: any) {
      setEditedData(prev => prev ? { ...prev, [key]: value } : prev)
    }

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-ivory-500 hover:text-terracotta-700 mb-6">
          <ArrowLeft size={16} /> Back to Inbox
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original email */}
          <div>
            <h2 className="text-sm font-semibold text-ivory-600 mb-2 uppercase tracking-wide">Original Email</h2>
            <div className="bg-white rounded-xl border border-ivory-200 p-4">
              {selectedEmail.subject && (
                <div className="text-sm font-medium text-terracotta-800 mb-1">{selectedEmail.subject}</div>
              )}
              {selectedEmail.from_address && (
                <div className="text-xs text-ivory-500 mb-3">From: {selectedEmail.from_address}</div>
              )}
              <pre className="text-xs text-ivory-700 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                {selectedEmail.body}
              </pre>
            </div>
          </div>

          {/* Extracted data */}
          <div>
            <h2 className="text-sm font-semibold text-ivory-600 mb-2 uppercase tracking-wide">AI Extracted Data</h2>
            <div className="bg-white rounded-xl border border-ivory-200 p-4 space-y-3">

              {/* Type selector */}
              <div className="flex gap-2">
                {(['reservation', 'tour', 'unknown'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => updateField('type', t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      d.type === t
                        ? 'bg-terracotta-600 text-white border-terracotta-600'
                        : 'border-ivory-300 text-ivory-600 hover:border-terracotta-400'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Warnings */}
              {d.warnings?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1">
                    <AlertTriangle size={13} /> Warnings
                  </div>
                  <ul className="space-y-0.5">
                    {d.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hotel match */}
              {d.hotel_name && (
                <div className={`text-xs px-2 py-1 rounded-lg ${hotelMatch ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {hotelMatch ? `✓ Matched to: ${hotelMatch.name}` : `✗ No HMS match for "${d.hotel_name}" — will save without hotel link`}
                </div>
              )}

              {/* Fields */}
              {[
                { label: 'Client Name', key: 'client_name' },
                { label: 'Hotel Name', key: 'hotel_name' },
                { label: 'Room Type', key: 'room_type' },
                { label: 'Check-in', key: 'checkin_date', placeholder: 'YYYY-MM-DD' },
                { label: 'Check-out', key: 'checkout_date', placeholder: 'YYYY-MM-DD' },
                { label: 'Nights', key: 'nights', type: 'number' },
                { label: 'Rate / night', key: 'rate_per_night', type: 'number' },
                { label: 'Currency', key: 'currency' },
                { label: 'Meal Plan', key: 'meal_plan' },
                { label: 'Confirmation #', key: 'confirmation_number' },
                { label: 'Cutoff / Payment Deadline', key: 'cutoff_date', placeholder: 'YYYY-MM-DD' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-xs text-ivory-500 w-40 shrink-0">{label}</label>
                  <input
                    type={type ?? 'text'}
                    value={(d as any)[key] ?? ''}
                    placeholder={placeholder ?? ''}
                    onChange={e => updateField(key as keyof ExtractedData, type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value || null)}
                    className="flex-1 text-xs border border-ivory-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-terracotta-400"
                  />
                </div>
              ))}

              {d.type === 'reservation' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-ivory-500 w-40 shrink-0">Status</label>
                  <select
                    value={d.status ?? ''}
                    onChange={e => updateField('status', e.target.value || null)}
                    className="flex-1 text-xs border border-ivory-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-terracotta-400"
                  >
                    <option value="">Select…</option>
                    <option>Availability pending</option>
                    <option>Confirmed</option>
                    <option>Paid</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              )}

              {d.type === 'tour' && d.tour_days && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-ivory-600 mb-1">Tour Days ({d.tour_days.length})</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {d.tour_days.map((day: any, i: number) => (
                      <div key={i} className="text-xs bg-ivory-50 rounded px-2 py-1">
                        Day {day.day_number}: {day.title}
                        {day.date && <span className="text-ivory-400 ml-1">({day.date})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              {d.type === 'reservation' && (
                <button
                  onClick={saveAsReservation}
                  className="flex-1 bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={15} /> Save to Reservations
                </button>
              )}
              {d.type === 'tour' && (
                <button
                  onClick={saveAsTour}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={15} /> Save to Tours
                </button>
              )}
              {d.type === 'unknown' && (
                <>
                  <button
                    onClick={saveAsReservation}
                    className="flex-1 bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-medium py-2 rounded-xl transition-colors"
                  >
                    Save as Reservation
                  </button>
                  <button
                    onClick={saveAsTour}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-xl transition-colors"
                  >
                    Save as Tour
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={ignoreEmail}
                className="flex-1 border border-ivory-300 text-ivory-600 text-sm py-2 rounded-xl hover:bg-ivory-100 transition-colors"
              >
                Ignore
              </button>
              <button
                onClick={() => { if (confirm('Delete this email from inbox?')) deleteEmail.mutate(selectedEmail.id) }}
                className="border border-red-200 text-red-500 text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PASTE VIEW ──
  if (view === 'paste') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-ivory-500 hover:text-terracotta-700 mb-6">
          <ArrowLeft size={16} /> Back to Inbox
        </button>

        <div className="bg-white rounded-xl border border-ivory-200 p-6">
          <h2 className="text-lg font-semibold text-terracotta-800 mb-4 flex items-center gap-2">
            <ClipboardPaste size={18} /> Paste Email
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ivory-600 mb-1">From (optional)</label>
              <input
                type="text"
                value={pasteFrom}
                onChange={e => setPasteFrom(e.target.value)}
                placeholder="e.g. reservations@fourseasons.com"
                className="w-full text-sm border border-ivory-200 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ivory-600 mb-1">Subject (optional)</label>
              <input
                type="text"
                value={pasteSubject}
                onChange={e => setPasteSubject(e.target.value)}
                placeholder="e.g. Booking Confirmation #12345"
                className="w-full text-sm border border-ivory-200 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ivory-600 mb-1">Email Body <span className="text-red-400">*</span></label>
              <textarea
                value={pasteBody}
                onChange={e => setPasteBody(e.target.value)}
                placeholder="Copy the full email text and paste it here…"
                rows={12}
                className="w-full text-sm border border-ivory-200 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta-400 font-mono resize-none"
              />
            </div>
            <button
              onClick={handleExtract}
              disabled={extracting || !pasteBody.trim()}
              className="w-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {extracting ? (
                <><Loader2 size={16} className="animate-spin" /> Analysing email…</>
              ) : (
                <><Eye size={16} /> Extract Booking Data (Demo Mode)</>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ──
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-terracotta-800 flex items-center gap-2">
            <Inbox size={22} /> Inbox
          </h1>
          {unreviewedCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreviewedCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setView('paste')}
          className="flex items-center gap-2 bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <ClipboardPaste size={16} /> Paste Email
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'all', label: 'All' },
          { value: 'unreviewed', label: 'Unreviewed' },
          { value: 'saved_reservation', label: 'Reservations' },
          { value: 'saved_tour', label: 'Tours' },
          { value: 'ignored', label: 'Ignored' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === f.value
                ? 'bg-terracotta-600 text-white'
                : 'bg-white border border-ivory-200 text-ivory-600 hover:border-terracotta-400'
            }`}
          >
            {f.label}
            {f.value === 'unreviewed' && unreviewedCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreviewedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-ivory-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-ivory-400">
          <Inbox size={40} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">
            {filterStatus === 'all'
              ? 'No emails yet — click "Paste Email" to add one'
              : 'No emails in this category'}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(email => {
          const s = STATUS_LABELS[email.status]
          const extracted = email.extracted_data as ExtractedData | null
          return (
            <div
              key={email.id}
              className="bg-white rounded-xl border border-ivory-200 p-4 flex items-start justify-between gap-4 hover:border-terracotta-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                    {s.label}
                  </span>
                  {extracted?.type && extracted.type !== 'unknown' && (
                    <span className="text-xs text-ivory-400 capitalize">{extracted.type}</span>
                  )}
                  {extracted?.warnings?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle size={11} /> {extracted.warnings.length} warning{extracted.warnings.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-terracotta-800 truncate">
                  {email.subject ?? '(no subject)'}
                </div>
                {email.from_address && (
                  <div className="text-xs text-ivory-400 mt-0.5">{email.from_address}</div>
                )}
                {extracted?.client_name && (
                  <div className="text-xs text-ivory-500 mt-1">
                    {extracted.client_name}
                    {extracted.hotel_name && ` · ${extracted.hotel_name}`}
                    {extracted.checkin_date && ` · ${extracted.checkin_date}`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-ivory-400">{timeAgo(email.created_at)}</span>
                <button
                  onClick={() => openReview(email)}
                  className="text-xs bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {email.status === 'unreviewed' ? 'Review →' : 'View'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
