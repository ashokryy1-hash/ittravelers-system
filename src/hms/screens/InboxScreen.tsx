import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import {
  Inbox, ClipboardPaste, AlertTriangle, Eye, Loader2,
  Save, Trash2, ArrowLeft, Hotel, MapPin, User, Phone,
  Calendar, Link as LinkIcon, CheckCircle, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────────────────

type BookingSource = 'Direct' | 'GRN' | 'Ratehawk' | 'TBO' | 'Unknown'

interface ParsedHotel {
  hotel_name: string
  source: BookingSource
  checkin_date: string | null
  checkout_date: string | null
  nights: number | null
  room_type: string | null
  meal_plan: string | null
  quoted_price: number | null
  currency: string
  // resolved after matching
  hotel_id?: string | null
  room_type_id?: string | null
}

interface ParsedTour {
  date: string | null
  title: string
  price: number | null
  currency: string
  booking_link: string | null
}

interface ParsedTransfer {
  date: string | null
  route: string
  price: number | null
}

interface ParsedEmail {
  type: 'booking_request' | 'unknown'
  client_name: string | null
  client_phone: string | null
  destination: string | null
  travel_date: string | null
  return_date: string | null
  handling_agent: string | null
  dollar_rate: number | null
  total_quoted: number | null
  first_payment: number | null
  hotels: ParsedHotel[]
  tours: ParsedTour[]
  transfers: ParsedTransfer[]
  warnings: string[]
}

interface InboxEmail {
  id: string
  from_address: string | null
  subject: string | null
  body: string
  extracted_data: any | null
  status: 'unreviewed' | 'saved_reservation' | 'saved_tour' | 'ignored'
  created_at: string
}

// ── Date parser ────────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
  jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
  january:'01', february:'02', march:'03', april:'04', june:'06',
  july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
}

// Never uses Date constructor — avoids timezone shift bugs
function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim().replace(/\s+/g, ' ')

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // "9 Oct 2026" / "09 October 2026"
  const dmy = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (dmy) {
    const mon = MONTHS[dmy[2].toLowerCase()]
    if (mon) return `${dmy[3]}-${mon}-${dmy[1].padStart(2, '0')}`
  }

  // "Oct 9, 2026" / "October 9 2026"
  const mdy = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/)
  if (mdy) {
    const mon = MONTHS[mdy[1].toLowerCase()]
    if (mon) return `${mdy[3]}-${mon}-${mdy[2].padStart(2, '0')}`
  }

  // "9/10/2026" or "9-10-2026" (DD/MM/YYYY — common in Egypt)
  const dmy2 = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmy2) return `${dmy2[3]}-${dmy2[2].padStart(2, '0')}-${dmy2[1].padStart(2, '0')}`

  return null
}

// ── Main email parser ──────────────────────────────────────────────────────

function parseBookingEmail(body: string): ParsedEmail {
  const lines = body.split('\n').map(l => l.trim())
  const nonEmpty = lines.filter(Boolean)

  function getField(key: string): string | null {
    const line = nonEmpty.find(l =>
      l.toLowerCase().replace(/[🔹✈️💰🏨]/g, '').trim().toLowerCase().startsWith(key.toLowerCase() + ':')
    )
    if (!line) return null
    return line.split(':').slice(1).join(':').trim().replace(/^[🔹✈️💰🏨]\s*/, '').trim() || null
  }

  const clientName = getField('Client Name')
  const clientPhone = getField('Client Number')
  const destination = getField('Destinations') ?? getField('Destination')
  const handlingAgent = getField('Handling Agent')
  const travelDate = getField('Travel Date')
  const returnDate = getField('Return Date')

  // Find section boundaries
  const hotelSectionIdx = nonEmpty.findIndex(l => /🏨|^hotels:/i.test(l))
  // Handles: "Tours:", "Tours (GetYourGuide):", "Tours (Direct):" etc.
  const tourSectionIdx = nonEmpty.findIndex(l => /^tours[\s(:]/i.test(l) || /^tours$/i.test(l))
  const flightSectionIdx = nonEmpty.findIndex(l => /✈️|flight\s*(details|price)/i.test(l))
  const transferIdx = nonEmpty.findIndex(l => /^transfers?\s*(routes?)?:/i.test(l) || /^transfers?\s*routes?/i.test(l))

  // ── Parse hotels ──
  const hotelEnd = tourSectionIdx > 0 ? tourSectionIdx : (flightSectionIdx > 0 ? flightSectionIdx : nonEmpty.length)
  const hotelBlock = hotelSectionIdx >= 0 ? nonEmpty.slice(hotelSectionIdx + 1, hotelEnd) : []

  const hotels: ParsedHotel[] = []
  let cur: ParsedHotel | null = null

  for (const line of hotelBlock) {
    // New hotel line: "Hotel Name 1 (Direct) – Amarea Resort..."
    if (/^Hotel Name \d+/i.test(line)) {
      if (cur) hotels.push(cur)
      const sourceMatch = line.match(/\((Direct|GRN|Ratehawk|TBO)\)/i)
      const nameMatch = line.match(/[–\-]\s*(.+)$/)
      cur = {
        hotel_name: nameMatch?.[1]?.trim() ?? line.replace(/^Hotel Name \d+.*?[–\-]\s*/i, '').trim(),
        source: (sourceMatch?.[1] as BookingSource) ?? 'Unknown',
        checkin_date: null, checkout_date: null, nights: null,
        room_type: null, meal_plan: null, quoted_price: null, currency: 'USD',
      }
    } else if (cur) {
      const lc = line.toLowerCase()
      if (lc.startsWith('check-in:')) cur.checkin_date = parseDate(line.split(':').slice(1).join(':'))
      else if (lc.startsWith('check-out:')) cur.checkout_date = parseDate(line.split(':').slice(1).join(':'))
      else if (lc.startsWith('nights:')) cur.nights = parseInt(line.split(':')[1]) || null
      else if (lc.startsWith('room type:')) cur.room_type = line.split(':').slice(1).join(':').trim()
      else if (lc.startsWith('meal plan:')) cur.meal_plan = line.split(':').slice(1).join(':').trim()
      else if (lc.startsWith('quoted amount:')) {
        const amt = line.split(':').slice(1).join(':').trim()
        cur.currency = /IDR/i.test(amt) ? 'IDR' : /THB/i.test(amt) ? 'THB' : /EGP/i.test(amt) ? 'EGP' : 'USD'
        cur.quoted_price = parseFloat(amt.replace(/[^0-9.]/g, '')) || null
      }
    }
  }
  if (cur) hotels.push(cur)

  // ── Parse tours ──
  const tourEnd = flightSectionIdx > 0 ? flightSectionIdx : nonEmpty.length
  const tourBlock = tourSectionIdx >= 0 ? nonEmpty.slice(tourSectionIdx + 1, tourEnd) : []

  const tours: ParsedTour[] = []
  for (const line of tourBlock) {
    // Format A: "1.  10 Oct: Title price"  (Bali-style)
    // Format B: "Tour 1- 25 Dec 2026 Title price url"  (Sri Lanka / GYG style)
    const matchA = line.match(/^\d+[.)]\s+(.+)/)
    const matchB = line.match(/^Tour\s+\d+\s*[-–.)\s]\s*(.+)/i)
    const match = matchA ?? matchB
    if (!match) continue
    const content = match[1].trim()

    let tourDate: string | null = null
    let rest = content

    // Date with colon separator: "10 Oct: Title" or "10 Oct 2026: Title"
    const dateColon = content.match(/^(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)\s*[:\-]\s*(.+)/)
    // Date without colon: "25 Dec 2026 Title" (full year required to avoid eating part of title)
    const dateSpace = content.match(/^(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+(.+)/)

    if (dateColon) {
      tourDate = parseDate(dateColon[1])
      rest = dateColon[2].trim()
    } else if (dateSpace) {
      tourDate = parseDate(dateSpace[1])
      rest = dateSpace[2].trim()
    }

    // Price: "130$" or "$130" or "130 USD"
    const priceMatch = rest.match(/(\d+(?:\.\d+)?)\s*\$|\$\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*USD/i)
    const price = priceMatch ? parseFloat(priceMatch[1] ?? priceMatch[2] ?? priceMatch[3]) : null

    // URL (Get Your Guide or any link)
    const urlMatch = rest.match(/https?:\/\/[^\s]+/i)

    // Clean title — remove price and URL
    const title = rest
      .replace(/\s*\d+(?:\.\d+)?\s*\$/, '')
      .replace(/\$\s*\d+(?:\.\d+)?/, '')
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (title) tours.push({ date: tourDate, title, price, currency: 'USD', booking_link: urlMatch?.[0] ?? null })
  }

  // ── Parse transfers ──
  const transfers: ParsedTransfer[] = []
  if (transferIdx >= 0) {
    const xferEnd = tourSectionIdx > transferIdx ? tourSectionIdx : (flightSectionIdx > transferIdx ? flightSectionIdx : nonEmpty.length)
    const xferBlock = nonEmpty.slice(transferIdx + 1, xferEnd)
    for (const line of xferBlock) {
      const match = line.match(/^\d+[.)]\s+(.+)/)
      if (!match) continue
      const content = match[1].trim()
      // Date can be at start: "24 Dec ..." or "24 Dec 2026 ..."
      const dateStart = content.match(/^(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)\s+(.+)/)
      const priceMatch = content.match(/(\d+(?:\.\d+)?)\s*\$|\$\s*(\d+(?:\.\d+)?)/)
      const urlMatch = content.match(/https?:\/\/[^\s]+/i)
      const route = content
        .replace(/https?:\/\/[^\s]+/gi, '')
        .replace(/(\d+(?:\.\d+)?)\s*\$|\$\s*(\d+(?:\.\d+)?)/, '')
        .replace(/\s+/g, ' ').trim()
      transfers.push({
        date: dateStart ? parseDate(dateStart[1]) : null,
        route,
        price: priceMatch ? parseFloat(priceMatch[1] ?? priceMatch[2]) : null,
      })
    }
  }

  // ── Payment info ──
  const totalMatch = body.match(/Total Quoted[^:]*:\s*(?:USD\s*)?([\d,]+)\$/i)
  const dollarRateMatch = body.match(/Dollar rate\s*([\d.]+)/i)
  const firstPayMatch = body.match(/First Payment[^:]*:\s*USD\s*([\d.]+)/i)

  // ── Warnings ──
  const warnings: string[] = []
  if (!clientName) warnings.push('Missing client name')
  if (hotels.length === 0) warnings.push('No hotels found')
  hotels.forEach((h, i) => {
    if (!h.checkin_date) warnings.push(`Hotel ${i + 1}: missing check-in date`)
    if (!h.checkout_date) warnings.push(`Hotel ${i + 1}: missing check-out date`)
    if (!h.quoted_price) warnings.push(`Hotel ${i + 1}: missing quoted price`)
  })

  return {
    type: hotels.length > 0 || tours.length > 0 ? 'booking_request' : 'unknown',
    client_name: clientName,
    client_phone: clientPhone,
    destination,
    travel_date: parseDate(travelDate ?? ''),
    return_date: parseDate(returnDate ?? ''),
    handling_agent: handlingAgent,
    dollar_rate: dollarRateMatch ? parseFloat(dollarRateMatch[1]) : null,
    total_quoted: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null,
    first_payment: firstPayMatch ? parseFloat(firstPayMatch[1]) : null,
    hotels,
    tours,
    transfers,
    warnings,
  }
}

// ── Source badge colors ────────────────────────────────────────────────────

const SOURCE_COLORS: Record<BookingSource, string> = {
  Direct:   'bg-terracotta-100 text-terracotta-700',
  GRN:      'bg-blue-100 text-blue-700',
  Ratehawk: 'bg-purple-100 text-purple-700',
  TBO:      'bg-green-100 text-green-700',
  Unknown:  'bg-ivory-200 text-ivory-500',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unreviewed:        { label: 'Unreviewed',           color: 'bg-amber-100 text-amber-700' },
  saved_reservation: { label: 'Saved to Reservations', color: 'bg-green-100 text-green-700' },
  saved_tour:        { label: 'Saved to Tours',        color: 'bg-blue-100 text-blue-700' },
  ignored:           { label: 'Ignored',               color: 'bg-ivory-200 text-ivory-500' },
}

// ── Component ──────────────────────────────────────────────────────────────

export default function InboxScreen() {
  const qc = useQueryClient()
  const [view, setView] = useState<'list' | 'paste' | 'review'>('list')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null)
  const [parsed, setParsed] = useState<ParsedEmail | null>(null)
  const [saving, setSaving] = useState(false)

  // Paste form
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

  const { data: hmsHotels } = useQuery({
    queryKey: ['hms-hotels-inbox'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_hotels').select('id, name, city')
      return data ?? []
    },
  })

  const { data: hmsRooms } = useQuery({
    queryKey: ['hms-rooms-inbox'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_room_types').select('id, hotel_id, name')
      return data ?? []
    },
  })

  const updateEmail = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
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
    },
  })

  // ── Extract ──────────────────────────────────────────────────────────────

  async function handleExtract() {
    if (!pasteBody.trim()) return toast.error('Paste an email body first')
    setExtracting(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      const result = parseBookingEmail(pasteBody)

      const { data, error } = await supabase
        .from('hms_inbox_emails')
        .insert({
          subject: pasteSubject || null,
          from_address: pasteFrom || null,
          body: pasteBody,
          extracted_data: result,
          status: 'unreviewed',
        })
        .select()
        .single()
      if (error) throw error

      qc.invalidateQueries({ queryKey: ['inbox-emails'] })
      setPasteSubject('')
      setPasteFrom('')
      setPasteBody('')
      setSelectedEmail(data)
      setParsed(result)
      setView('review')
      toast.success('Email parsed — review before saving')
    } catch (err: any) {
      toast.error(err.message ?? 'Parsing failed')
    } finally {
      setExtracting(false)
    }
  }

  function openReview(email: InboxEmail) {
    setSelectedEmail(email)
    setParsed(email.extracted_data ?? null)
    setView('review')
  }

  // ── Find HMS match ────────────────────────────────────────────────────────

  function findHotelMatch(hotelName: string) {
    if (!hmsHotels) return null
    const lower = hotelName.toLowerCase()
    return hmsHotels.find(h =>
      h.name.toLowerCase().includes(lower) || lower.includes(h.name.toLowerCase())
    ) ?? null
  }

  function findRoomMatch(hotelId: string, roomName: string) {
    if (!hmsRooms || !roomName) return null
    const lower = roomName.toLowerCase()
    return hmsRooms.find(r =>
      r.hotel_id === hotelId &&
      (r.name.toLowerCase().includes(lower) || lower.includes(r.name.toLowerCase()))
    ) ?? null
  }

  // ── Save all ──────────────────────────────────────────────────────────────

  async function saveAll() {
    if (!parsed || !selectedEmail) return
    setSaving(true)
    try {
      const clientName = parsed.client_name ?? 'Unknown Client'

      // 1. Create one booking per hotel
      if (parsed.hotels.length > 0) {
        const bookingRows = parsed.hotels.map(h => {
          const hotelMatch = findHotelMatch(h.hotel_name)
          const roomMatch = hotelMatch ? findRoomMatch(hotelMatch.id, h.room_type ?? '') : null
          const nights = h.nights ??
            (h.checkin_date && h.checkout_date
              ? Math.round((new Date(h.checkout_date).getTime() - new Date(h.checkin_date).getTime()) / 86400000)
              : null)
          return {
            client_name: clientName,
            hotel_id: hotelMatch?.id ?? null,
            room_type_id: roomMatch?.id ?? null,
            room_type_name: h.room_type ?? null,
            checkin_date: h.checkin_date ?? '',
            checkout_date: h.checkout_date ?? '',
            nights,
            rate_per_night: (h.quoted_price && nights) ? Math.round(h.quoted_price / nights * 100) / 100 : null,
            total_price_idr: null,
            total_price_egp: null,
            currency: h.currency,
            meal_plan: h.meal_plan,
            status: 'Availability pending',
            hotel_confirmation_number: null,
            cutoff_date: null,
            notes: hotelMatch ? null : `Manual entry — hotel not in HMS (${h.source})`,
            quoted_price: h.quoted_price,
            paid_price: null,
            source: h.source,
          }
        })

        const { error: bookErr } = await supabase.from('hms_bookings').insert(bookingRows)
        if (bookErr) throw new Error('Bookings failed: ' + bookErr.message)
      }

      // 2. Create tour file if there are tours OR transfers
      if (parsed.tours.length > 0 || parsed.transfers.length > 0) {
        const { data: tour, error: tourErr } = await supabase
          .from('hms_tours')
          .insert({
            client_name: clientName,
            destination: parsed.destination ?? null,
            notes: parsed.destination ? `Destination: ${parsed.destination}` : null,
            status: 'Pending',
            booking_link: null,
          })
          .select()
          .single()
        if (tourErr) throw new Error('Tour failed: ' + tourErr.message)

        // Build a combined day list: tours + transfers, sorted by date
        type DayEntry =
          | { kind: 'tour'; date: string | null; t: ParsedTour }
          | { kind: 'transfer'; date: string | null; x: ParsedTransfer }

        const allDays: DayEntry[] = [
          ...parsed.tours.map(t => ({ kind: 'tour' as const, date: t.date, t })),
          ...parsed.transfers.map(x => ({ kind: 'transfer' as const, date: x.date, x })),
        ].sort((a, b) => {
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return a.date.localeCompare(b.date)
        })

        for (let i = 0; i < allDays.length; i++) {
          const entry = allDays[i]
          const isTour = entry.kind === 'tour'
          const t = isTour ? entry.t : null
          const x = !isTour ? entry.x : null

          const { data: day, error: dayErr } = await supabase
            .from('hms_tour_days')
            .insert({
              tour_id: tour.id,
              date: entry.date ?? null,
              sort_order: i,
              status: 'Pending',
              booking_link: t?.booking_link ?? null,
              quoted_price: (t?.price ?? x?.price) ?? null,
              paid_price: null,
            })
            .select()
            .single()
          if (dayErr) throw new Error(`Day ${i + 1} failed: ` + dayErr.message)

          let description: string
          let time = ''

          if (isTour && t) {
            // Regular tour activity — plain text shows as bullet point
            description = t.title
          } else if (x) {
            // Transfer — parse "From → To" or "From to To" from route string
            const arrowMatch = x.route.match(/^(.+?)\s*[→\-–>]+\s*(.+)$/)
            const from = arrowMatch ? arrowMatch[1].trim() : x.route
            const to = arrowMatch ? arrowMatch[2].trim() : ''
            // Use transfer activity format that ToursScreen recognises
            description = `__transfer__:${from}|||${to}|||`
          } else {
            description = ''
          }

          if (description) {
            const { error: actErr } = await supabase
              .from('hms_tour_activities')
              .insert({ day_id: day.id, description, time, sort_order: 1 })
            if (actErr) throw new Error(`Activity ${i + 1} failed: ` + actErr.message)
          }
        }
      }

      // 3. Mark email as saved
      const newStatus = parsed.hotels.length > 0 ? 'saved_reservation' : 'saved_tour'
      await updateEmail.mutateAsync({
        id: selectedEmail.id,
        updates: { status: newStatus, extracted_data: parsed },
      })

      const parts = []
      if (parsed.hotels.length > 0) parts.push(`${parsed.hotels.length} booking${parsed.hotels.length > 1 ? 's' : ''}`)
      if (parsed.tours.length > 0) parts.push(`${parsed.tours.length} tour day${parsed.tours.length > 1 ? 's' : ''}`)
      if (parsed.transfers.length > 0) parts.push(`${parsed.transfers.length} transfer${parsed.transfers.length > 1 ? 's' : ''}`)
      toast.success(`Saved: ${parts.join(' + ')}`)
      setView('list')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function ignoreEmail() {
    if (!selectedEmail) return
    await updateEmail.mutateAsync({ id: selectedEmail.id, updates: { status: 'ignored' } })
    toast.success('Marked as ignored')
    setView('list')
  }

  const filtered = (emails ?? []).filter(e =>
    filterStatus === 'all' || e.status === filterStatus
  )
  const unreviewedCount = (emails ?? []).filter(e => e.status === 'unreviewed').length

  // ── REVIEW VIEW ──────────────────────────────────────────────────────────

  if (view === 'review' && selectedEmail && parsed) {
    const totalBookings = parsed.hotels.length
    const totalTours = parsed.tours.length

    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-ivory-500 hover:text-terracotta-700 mb-5">
          <ArrowLeft size={15} /> Back to Inbox
        </button>

        {/* Client info bar */}
        <div className="bg-terracotta-50 border border-terracotta-100 rounded-xl px-5 py-4 mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-terracotta-800">
            <User size={15} /> {parsed.client_name ?? 'Unknown Client'}
          </div>
          {parsed.client_phone && (
            <div className="flex items-center gap-1.5 text-sm text-terracotta-600">
              <Phone size={13} /> {parsed.client_phone}
            </div>
          )}
          {parsed.destination && (
            <div className="flex items-center gap-1.5 text-sm text-terracotta-600">
              <MapPin size={13} /> {parsed.destination}
            </div>
          )}
          {parsed.travel_date && (
            <div className="flex items-center gap-1.5 text-sm text-terracotta-600">
              <Calendar size={13} /> {parsed.travel_date} → {parsed.return_date ?? '?'}
            </div>
          )}
          {parsed.handling_agent && (
            <div className="text-xs text-terracotta-400 ml-auto">Agent: {parsed.handling_agent}</div>
          )}
        </div>

        {/* Warnings */}
        {parsed.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-1.5">
              <AlertTriangle size={13} /> {parsed.warnings.length} warning{parsed.warnings.length > 1 ? 's' : ''}
            </div>
            <ul className="space-y-0.5">
              {parsed.warnings.map((w, i) => <li key={i} className="text-xs text-amber-700">• {w}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT — Hotels */}
          <div>
            {parsed.hotels.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-ivory-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Hotel size={13} /> {totalBookings} Hotel{totalBookings > 1 ? 's' : ''} → Reservations
                </h3>
                <div className="space-y-3">
                  {parsed.hotels.map((h, i) => {
                    const match = findHotelMatch(h.hotel_name)
                    return (
                      <div key={i} className="bg-white border border-ivory-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="font-medium text-sm text-terracotta-800 leading-tight">{h.hotel_name}</div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${SOURCE_COLORS[h.source]}`}>
                            {h.source}
                          </span>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-lg mb-3 flex items-center gap-1.5 ${match ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {match
                            ? <><CheckCircle size={11} /> Matched in HMS: {match.name}</>
                            : <><XCircle size={11} /> Not in HMS — will create as manual booking</>
                          }
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div className="text-ivory-400">Check-in</div>
                          <div className="text-ivory-700 font-medium">{h.checkin_date ?? '—'}</div>
                          <div className="text-ivory-400">Check-out</div>
                          <div className="text-ivory-700 font-medium">{h.checkout_date ?? '—'}</div>
                          <div className="text-ivory-400">Nights</div>
                          <div className="text-ivory-700 font-medium">{h.nights ?? '—'}</div>
                          <div className="text-ivory-400">Room</div>
                          <div className="text-ivory-700 font-medium leading-tight">{h.room_type ?? '—'}</div>
                          <div className="text-ivory-400">Meal plan</div>
                          <div className="text-ivory-700 font-medium">{h.meal_plan ?? '—'}</div>
                          <div className="text-ivory-400">Quoted</div>
                          <div className="text-terracotta-700 font-semibold">{h.quoted_price ? `${h.currency} ${h.quoted_price}` : '—'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Transfers */}
            {parsed.transfers.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-ivory-500 uppercase tracking-wide mb-2">
                  Transfers (info only — not saved)
                </h3>
                <div className="bg-white border border-ivory-200 rounded-xl p-4 space-y-2">
                  {parsed.transfers.map((t, i) => (
                    <div key={i} className="text-xs text-ivory-600 flex justify-between">
                      <span>{t.date && <span className="text-ivory-400 mr-1">{t.date}</span>}{t.route}</span>
                      {t.price && <span className="font-medium text-terracotta-700">${t.price}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Tours */}
          <div>
            {parsed.tours.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-ivory-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MapPin size={13} /> {totalTours} Tour Day{totalTours > 1 ? 's' : ''} → Tours Module
                </h3>
                <div className="bg-white border border-ivory-200 rounded-xl divide-y divide-ivory-100">
                  {parsed.tours.map((t, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {t.date && (
                            <div className="text-xs text-ivory-400 mb-0.5">{t.date}</div>
                          )}
                          <div className="text-sm font-medium text-terracotta-800 leading-tight">{t.title}</div>
                          {t.booking_link && (
                            <a href={t.booking_link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
                              <LinkIcon size={10} /> Get Your Guide link
                            </a>
                          )}
                        </div>
                        {t.price && (
                          <span className="text-sm font-semibold text-terracotta-700 shrink-0">
                            ${t.price}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment summary */}
            {(parsed.total_quoted || parsed.dollar_rate) && (
              <div className="bg-ivory-100 border border-ivory-200 rounded-xl p-4 text-xs space-y-1.5">
                <div className="font-semibold text-ivory-600 uppercase tracking-wide mb-2">Payment Summary</div>
                {parsed.total_quoted && (
                  <div className="flex justify-between">
                    <span className="text-ivory-500">Total quoted</span>
                    <span className="font-semibold text-terracotta-800">USD {parsed.total_quoted.toLocaleString()}</span>
                  </div>
                )}
                {parsed.first_payment && (
                  <div className="flex justify-between">
                    <span className="text-ivory-500">First payment</span>
                    <span className="font-medium text-terracotta-700">USD {parsed.first_payment}</span>
                  </div>
                )}
                {parsed.dollar_rate && (
                  <div className="flex justify-between">
                    <span className="text-ivory-500">Dollar rate</span>
                    <span className="font-medium text-ivory-700">{parsed.dollar_rate} EGP</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-ivory-200">
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex-1 bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : <><Save size={15} /> Save {totalBookings > 0 ? `${totalBookings} booking${totalBookings > 1 ? 's' : ''}` : ''}{totalBookings > 0 && (totalTours > 0 || parsed.transfers.length > 0) ? ' + ' : ''}{totalTours > 0 ? `${totalTours} tour days` : ''}{totalTours > 0 && parsed.transfers.length > 0 ? ' + ' : ''}{parsed.transfers.length > 0 ? `${parsed.transfers.length} transfers` : ''} to HMS</>
            }
          </button>
          <button onClick={ignoreEmail} className="border border-ivory-300 text-ivory-600 text-sm px-5 py-3 rounded-xl hover:bg-ivory-100 transition-colors">
            Ignore
          </button>
          <button
            onClick={() => { if (confirm('Delete this email?')) deleteEmail.mutate(selectedEmail.id) }}
            className="border border-red-200 text-red-500 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    )
  }

  // ── PASTE VIEW ────────────────────────────────────────────────────────────

  if (view === 'paste') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-ivory-500 hover:text-terracotta-700 mb-6">
          <ArrowLeft size={15} /> Back to Inbox
        </button>
        <div className="bg-white rounded-xl border border-ivory-200 p-6">
          <h2 className="text-lg font-semibold text-terracotta-800 mb-4 flex items-center gap-2">
            <ClipboardPaste size={18} /> Paste Sales Team Email
          </h2>
          <p className="text-xs text-ivory-500 mb-5 leading-relaxed">
            Copy the full email from your sales team and paste it below. The system will extract all hotels, tours, and client details automatically.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ivory-600 mb-1">From (optional)</label>
              <input type="text" value={pasteFrom} onChange={e => setPasteFrom(e.target.value)}
                placeholder="e.g. Menna@ittravelers.com"
                className="w-full text-sm border border-ivory-200 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ivory-600 mb-1">Subject (optional)</label>
              <input type="text" value={pasteSubject} onChange={e => setPasteSubject(e.target.value)}
                placeholder="e.g. New booking — Fares Elgamal — Bali"
                className="w-full text-sm border border-ivory-200 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ivory-600 mb-1">Email Body <span className="text-red-400">*</span></label>
              <textarea value={pasteBody} onChange={e => setPasteBody(e.target.value)}
                placeholder="Paste the full email here…"
                rows={14}
                className="w-full text-sm border border-ivory-200 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta-400 font-mono resize-none" />
            </div>
            <button onClick={handleExtract} disabled={extracting || !pasteBody.trim()}
              className="w-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
              {extracting
                ? <><Loader2 size={16} className="animate-spin" /> Parsing email…</>
                : <><Eye size={16} /> Extract Booking Details</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-terracotta-800 flex items-center gap-2">
            <Inbox size={22} /> Inbox
          </h1>
          {unreviewedCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreviewedCount}</span>
          )}
        </div>
        <button onClick={() => setView('paste')}
          className="flex items-center gap-2 bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <ClipboardPaste size={16} /> Paste Email
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'all', label: 'All' },
          { value: 'unreviewed', label: 'Unreviewed' },
          { value: 'saved_reservation', label: 'Reservations' },
          { value: 'saved_tour', label: 'Tours' },
          { value: 'ignored', label: 'Ignored' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filterStatus === f.value ? 'bg-terracotta-600 text-white' : 'bg-white border border-ivory-200 text-ivory-600 hover:border-terracotta-400'
            }`}>
            {f.label}
            {f.value === 'unreviewed' && unreviewedCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreviewedCount}</span>
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
            {filterStatus === 'all' ? 'No emails yet — click "Paste Email" to add one' : 'No emails in this category'}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(email => {
          const s = STATUS_LABELS[email.status]
          const d = email.extracted_data as ParsedEmail | null
          const hotels = d?.hotels?.length ?? 0
          const tours = d?.tours?.length ?? 0
          return (
            <div key={email.id}
              className="bg-white rounded-xl border border-ivory-200 p-4 flex items-start justify-between gap-4 hover:border-terracotta-200 transition-colors cursor-pointer"
              onClick={() => openReview(email)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                  {hotels > 0 && <span className="text-xs text-ivory-400">{hotels} hotel{hotels > 1 ? 's' : ''}</span>}
                  {tours > 0 && <span className="text-xs text-ivory-400">{tours} tour day{tours > 1 ? 's' : ''}</span>}
                  {d?.warnings?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle size={11} /> {d.warnings.length} warning{d.warnings.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-terracotta-800 truncate">{email.subject ?? '(no subject)'}</div>
                {d?.client_name && (
                  <div className="text-xs text-ivory-500 mt-1">
                    {d.client_name}
                    {d.destination && ` · ${d.destination}`}
                    {d.travel_date && ` · ${d.travel_date}`}
                  </div>
                )}
                {email.from_address && <div className="text-xs text-ivory-400 mt-0.5">{email.from_address}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-ivory-400">{timeAgo(email.created_at)}</span>
                <button className="text-xs bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 font-medium px-3 py-1.5 rounded-lg transition-colors">
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
