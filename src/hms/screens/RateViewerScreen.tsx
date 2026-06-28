import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Copy, ChevronLeft, ChevronRight, Sparkles, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HmsHotel, HmsRoomType, HmsSurchargeRule, RateQuoteResult } from '../types'
import { getSeasonForStay, getSurcharge, seasonLabel, nightsBetween } from '../lib/season'
import { getSettings } from '../lib/settings'
import toast from 'react-hot-toast'

interface SessionHotelItem {
  name: string
  cityName: string
  checkIn: string
  checkOut: string
  roomType: string
}

interface SessionQuoteRow {
  item: SessionHotelItem
  matched: boolean
  result?: RateQuoteResult
  noRoom?: boolean
  suggestions?: HmsHotel[]  // fuzzy candidates when no confident match
}

// ─── Fuzzy hotel name matching ────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'by', 'at', 'in', 'of', 'de', 'el', 'la',
  'hotel', 'resort', 'villa', 'villas', 'boutique', 'luxury',
  'beach', 'spa', 'club', 'estate', 'retreat', 'suites', 'suite',
  'properties', 'property', 'hospitality', 'management', 'group',
  'collection', 'residences', 'residence', 'inn',
  'ini', 'vie',
  'bali', 'ubud', 'canggu', 'seminyak', 'nusa', 'dua', 'sanur',
  'jimbaran', 'kuta', 'legian', 'uluwatu', 'lombok', 'berawa',
  'phuket', 'koh', 'samui', 'krabi', 'chiang', 'mai', 'bangkok',
  'hanoi', 'hoi', 'an', 'hcmc', 'saigon', 'danang',
  'maldives', 'thailand', 'vietnam', 'indonesia',
])

function tokenize(name: string): Set<string> {
  return new Set(
    name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  )
}

function hotelMatchScore(a: string, b: string): number {
  const tokA = tokenize(a)
  const tokB = tokenize(b)
  if (!tokA.size || !tokB.size) return 0
  let intersection = 0
  for (const t of tokA) if (tokB.has(t)) intersection++
  // Containment: fraction of the SHORTER name's tokens found in the longer name.
  // This gives 1.0 when "Suara Alam" tokens are all inside
  // "Suara Alam Ubud Villa by Ini Vie Hospitality" — Jaccard would penalise the length.
  const containment = intersection / Math.min(tokA.size, tokB.size)
  // Blend with a small Jaccard term to penalise completely unrelated names of equal short length
  const union = tokA.size + tokB.size - intersection
  const jaccard = union > 0 ? intersection / union : 0
  return containment * 0.8 + jaccard * 0.2
}

function findBestHotelMatches(name: string, allHotels: HmsHotel[]): { hotel: HmsHotel; score: number }[] {
  return allHotels
    .map(h => ({ hotel: h, score: hotelMatchScore(name, h.name) }))
    .filter(x => x.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}

export default function RateViewerScreen() {
  const [destination, setDestination] = useState('Bali')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [area, setArea] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [results, setResults] = useState<RateQuoteResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [sessionRows, setSessionRows] = useState<SessionQuoteRow[] | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionRates, setSessionRates] = useState({ idrToEgp: 0, thbToEgp: 0, usdToEgp: 0 })

  const { data: hotels } = useQuery<HmsHotel[]>({
    queryKey: ['hms_hotels_quote'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_hotels').select('*, hms_destinations(name)').eq('contract_status', 'Active')
      return data ?? []
    },
  })

  const { data: rooms } = useQuery<HmsRoomType[]>({
    queryKey: ['hms_rooms_all'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_room_types').select('*')
      return data ?? []
    },
  })

  const { data: surchargeRules } = useQuery<HmsSurchargeRule[]>({
    queryKey: ['hms_surcharge_rules'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_surcharge_rules').select('*, hms_destinations(name)')
      return data ?? []
    },
  })

  // Unique cities for the selected destination
  const cities = useMemo(() => {
    const destHotels = (hotels ?? []).filter(h => (h as any).hms_destinations?.name === destination)
    return Array.from(new Set(destHotels.map(h => h.city).filter(Boolean))).sort() as string[]
  }, [hotels, destination])

  // Reset area when destination changes
  useEffect(() => { setArea('') }, [destination])

  // Load session quote from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('trip_explorer_quote')
    if (!raw) return
    localStorage.removeItem('trip_explorer_quote')
    let items: SessionHotelItem[]
    try { items = JSON.parse(raw) } catch { return }
    if (!items.length) return
    runSessionQuote(items)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runSessionQuote(items: SessionHotelItem[]) {
    setSessionLoading(true)
    setResults(null)
    const settings = await getSettings()
    const idrToEgp = parseFloat(settings.IDR_to_EGP)
    const thbToEgp = parseFloat(settings.THB_to_EGP)
    const usdToEgp = parseFloat(settings.USD_to_EGP)
    setSessionRates({ idrToEgp, thbToEgp, usdToEgp })
    const allHotels = hotels ?? []
    const allRooms = rooms ?? []
    const allRules = surchargeRules ?? []

    const rows: SessionQuoteRow[] = await Promise.all(items.map(async item => {
      const nights = nightsBetween(item.checkIn, item.checkOut)
      if (nights <= 0) return { item, matched: false }

      const candidates = findBestHotelMatches(item.name, allHotels)
      if (!candidates.length) return { item, matched: false }
      // Auto-match if top candidate is confident (score ≥ 0.5), else show suggestions
      if (candidates[0].score < 0.5) {
        return { item, matched: false, suggestions: candidates.map(c => c.hotel) }
      }
      const hotel = candidates[0].hotel

      const hotelRooms = allRooms.filter(r => r.hotel_id === hotel.id)
      const destRules = allRules.filter(r => (r as any).hms_destinations?.name === (hotel as any).hms_destinations?.name)
      const { season, rule } = getSeasonForStay(item.checkIn, item.checkOut, destRules)

      // Try to match room type by name (partial match)
      let room = hotelRooms.find(r => r.name.toLowerCase() === item.roomType.toLowerCase())
      if (!room && item.roomType) room = hotelRooms.find(r => r.name.toLowerCase().includes(item.roomType.toLowerCase()))
      if (!room) room = hotelRooms[0] // fallback: first room

      if (!room) return { item, matched: true, noRoom: true }

      let baseRate = 0
      if (season === 'peak') baseRate = room.peak_season_rate ?? room.high_season_rate ?? room.low_season_rate ?? 0
      else if (season === 'high') baseRate = room.high_season_rate ?? room.low_season_rate ?? 0
      else baseRate = room.low_season_rate ?? 0

      if (!baseRate) return { item, matched: true, noRoom: true }

      const surcharge = getSurcharge(season, rule, room.room_category as 'room' | 'villa', hotel.surcharge_waiver)
      const totalPerNight = baseRate + surcharge
      const totalStay = totalPerNight * nights
      let totalEgp = 0
      if (room.currency === 'IDR') totalEgp = totalStay * idrToEgp
      else if (room.currency === 'THB') totalEgp = totalStay * thbToEgp
      else totalEgp = totalStay * usdToEgp

      return {
        item,
        matched: true,
        result: { hotel, roomType: room, season, baseRate, surcharge, totalPerNight, totalStay, totalEgp, nights },
      }
    }))

    setSessionRows(rows)
    setSessionLoading(false)
  }

  async function search() {
    if (!checkin || !checkout) { toast.error('Enter check-in and check-out dates'); return }
    setSearching(true)
    const settings = await getSettings()
    const idrToEgp = parseFloat(settings.IDR_to_EGP)
    const nights = nightsBetween(checkin, checkout)
    if (nights <= 0) { toast.error('Check-out must be after check-in'); setSearching(false); return }

    // Filter hotels by destination and area
    const destHotels = (hotels ?? []).filter(h => {
      const destName = (h as any).hms_destinations?.name ?? ''
      if (destName !== destination) return false
      if (area && !h.city?.toLowerCase().includes(area.toLowerCase())) return false
      return true
    })

    // Get surcharge rules for destination
    const destRules = (surchargeRules ?? []).filter(r =>
      (r as any).hms_destinations?.name === destination
    )

    const { season, rule } = getSeasonForStay(checkin, checkout, destRules)

    const quoteResults: RateQuoteResult[] = []

    for (const hotel of destHotels) {
      const hotelRooms = (rooms ?? []).filter(r => r.hotel_id === hotel.id)
      for (const room of hotelRooms) {
        let baseRate = 0
        if (season === 'peak') baseRate = room.peak_season_rate ?? room.high_season_rate ?? room.low_season_rate ?? 0
        else if (season === 'high') baseRate = room.high_season_rate ?? room.low_season_rate ?? 0
        else baseRate = room.low_season_rate ?? 0

        if (!baseRate) continue

        const surcharge = getSurcharge(season, rule, room.room_category as 'room' | 'villa', hotel.surcharge_waiver)
        const totalPerNight = baseRate + surcharge
        const totalStay = totalPerNight * nights

        // Currency conversion
        let totalEgp = 0
        if (room.currency === 'IDR') totalEgp = totalStay * idrToEgp
        else if (room.currency === 'THB') totalEgp = totalStay * parseFloat(settings.THB_to_EGP)
        else totalEgp = totalStay * parseFloat(settings.USD_to_EGP)

        if (maxBudget && totalEgp > parseFloat(maxBudget)) continue

        quoteResults.push({ hotel, roomType: room, season, baseRate, surcharge, totalPerNight, totalStay, totalEgp, nights })
      }
    }

    // Sort by totalPerNight
    quoteResults.sort((a, b) => a.totalPerNight - b.totalPerNight)
    setResults(quoteResults)
    setSearching(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/hms/rates" className="text-slate-400 hover:text-slate-600"><ChevronLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-slate-800">Rate Viewer & Quote Tool</h1>
      </div>

      {/* Session quote panel */}
      {(sessionLoading || sessionRows) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-500" />
            <span className="font-semibold text-amber-800">Quote from Trip Explorer</span>
            <button
              onClick={() => setSessionRows(null)}
              className="ml-auto text-xs text-amber-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
          {sessionLoading && <div className="text-sm text-amber-600">Matching hotels with contracts…</div>}
          {sessionRows && (
            <>
              <div className="space-y-3">
                {sessionRows.map((row, i) => (
                  <SessionQuoteRow
                    key={i}
                    row={row}
                    rooms={rooms ?? []}
                    surchargeRules={surchargeRules ?? []}
                    idrToEgp={sessionRates.idrToEgp}
                    thbToEgp={sessionRates.thbToEgp}
                    usdToEgp={sessionRates.usdToEgp}
                    onResolved={updated => setSessionRows(prev => prev ? prev.map((r, j) => j === i ? updated : r) : prev)}
                  />
                ))}
              </div>
              {(() => {
                const totalEgp = sessionRows.reduce((sum, r) => sum + (r.result?.totalEgp ?? 0), 0)
                const matched = sessionRows.filter(r => r.result).length
                const total = sessionRows.length
                return (
                  <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between">
                    <span className="text-sm text-amber-700">{matched}/{total} hotels matched</span>
                    {totalEgp > 0 && (
                      <span className="font-bold text-lg text-amber-800">
                        Total: EGP {Math.round(totalEgp).toLocaleString()}
                      </span>
                    )}
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* Search form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
            <select className={inp} value={destination} onChange={e => setDestination(e.target.value)}>
              <option>Bali</option>
              <option>Thailand</option>
              <option>Vietnam</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City (optional)</label>
            <select className={inp} value={area} onChange={e => setArea(e.target.value)}>
              <option value="">All cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max budget EGP (optional)</label>
            <input type="number" className={inp} placeholder="e.g. 5000" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
            <input type="date" className={inp} value={checkin} onChange={e => setCheckin(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
            <input type="date" className={inp} value={checkout} onChange={e => setCheckout(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button
              onClick={search}
              disabled={searching}
              className="w-full bg-terracotta-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-terracotta-700 disabled:opacity-50"
            >
              {searching ? 'Searching…' : 'Search Rates'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results !== null && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''} · {nightsBetween(checkin, checkout)} nights
            {results[0] && <> · <span className="font-medium">{seasonLabel(results[0].season)} season</span></>}
          </p>
          {results.length === 0 && (
            <div className="text-center py-12 text-slate-400">No rooms found matching your criteria.</div>
          )}
          <div className="space-y-3">
            {results.map((r, i) => (
              <QuoteCard key={i} result={r} checkin={checkin} checkout={checkout} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SessionQuoteRow({
  row,
  rooms,
  surchargeRules,
  idrToEgp,
  thbToEgp,
  usdToEgp,
  onResolved,
}: {
  row: SessionQuoteRow
  rooms: HmsRoomType[]
  surchargeRules: HmsSurchargeRule[]
  idrToEgp: number
  thbToEgp: number
  usdToEgp: number
  onResolved: (updated: SessionQuoteRow) => void
}) {
  const { item, matched, result, noRoom, suggestions } = row
  const [open, setOpen] = useState(false)

  // Suggestions mode: low-confidence fuzzy matches
  if (!matched && suggestions && suggestions.length > 0) {
    return (
      <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-100">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <span className="text-sm text-slate-700 font-medium">{item.name}</span>
          <span className="text-xs text-amber-600 ml-auto">Did you mean one of these?</span>
        </div>
        <div className="divide-y divide-amber-50">
          {suggestions.map(h => (
            <button
              key={h.id}
              onClick={() => {
                const hotelRooms = rooms.filter(r => r.hotel_id === h.id)
                const destRules = surchargeRules.filter(r => (r as any).hms_destinations?.name === (h as any).hms_destinations?.name)
                const { season, rule } = getSeasonForStay(item.checkIn, item.checkOut, destRules)
                let room = hotelRooms.find(r => r.name.toLowerCase() === item.roomType.toLowerCase())
                if (!room && item.roomType) room = hotelRooms.find(r => r.name.toLowerCase().includes(item.roomType.toLowerCase()))
                if (!room) room = hotelRooms[0]
                if (!room) { onResolved({ item, matched: true, noRoom: true }); return }
                let baseRate = 0
                if (season === 'peak') baseRate = room.peak_season_rate ?? room.high_season_rate ?? room.low_season_rate ?? 0
                else if (season === 'high') baseRate = room.high_season_rate ?? room.low_season_rate ?? 0
                else baseRate = room.low_season_rate ?? 0
                if (!baseRate) { onResolved({ item, matched: true, noRoom: true }); return }
                const nights = nightsBetween(item.checkIn, item.checkOut)
                const surcharge = getSurcharge(season, rule, room.room_category as 'room' | 'villa', h.surcharge_waiver)
                const totalPerNight = baseRate + surcharge
                const totalStay = totalPerNight * nights
                let totalEgp = 0
                if (room.currency === 'IDR') totalEgp = totalStay * idrToEgp
                else if (room.currency === 'THB') totalEgp = totalStay * thbToEgp
                else totalEgp = totalStay * usdToEgp
                onResolved({ item, matched: true, result: { hotel: h, roomType: room, season, baseRate, surcharge, totalPerNight, totalStay, totalEgp, nights } })
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50 transition-colors"
            >
              <div className="flex-1 text-sm text-slate-700">{h.name}</div>
              <div className="text-xs text-slate-400">{h.city}</div>
              <ChevronRight size={13} className="text-amber-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!matched) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-red-200">
        <AlertTriangle size={14} className="text-red-400 shrink-0" />
        <span className="text-sm text-slate-700 font-medium">{item.name}</span>
        <span className="text-xs text-red-500 ml-auto">No contract found — add to HMS hotels</span>
      </div>
    )
  }

  if (noRoom || !result) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-amber-200">
        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
        <span className="text-sm text-slate-700 font-medium">{item.name}</span>
        <span className="text-xs text-amber-600 ml-auto">Hotel found but no matching room / no rate</span>
      </div>
    )
  }

  const { hotel, roomType, season, baseRate, surcharge, totalPerNight, totalStay, totalEgp, nights } = result

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <span className="font-medium text-slate-800 text-sm">{hotel.name}</span>
          {hotel.name.toLowerCase() !== item.name.toLowerCase() && (
            <span className="text-xs text-slate-400 ml-1 italic">(from "{item.name}")</span>
          )}
          <span className="text-xs text-slate-400 ml-2">{item.cityName} · {nights}n · {item.checkIn} → {item.checkOut}</span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-terracotta-700">EGP {Math.round(totalEgp).toLocaleString()}</div>
          <div className="text-xs text-slate-400">{roomType.currency} {totalStay.toLocaleString()} total</div>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Metric label="Room" value={roomType.name} />
          <Metric label="Meal plan" value={roomType.meal_plan} />
          <Metric label="Season" value={seasonLabel(season)} />
          <Metric label="Room type" value={item.roomType || roomType.name} />
          <Metric label="Base rate/night" value={`${roomType.currency} ${baseRate.toLocaleString()}`} />
          <Metric label="Surcharge/night" value={surcharge > 0 ? `${roomType.currency} ${surcharge.toLocaleString()}` : 'None'} />
          <Metric label="Total/night" value={`${roomType.currency} ${totalPerNight.toLocaleString()}`} highlight />
          <Metric label={`Total (${nights} nights)`} value={`EGP ${Math.round(totalEgp).toLocaleString()}`} highlight />
        </div>
      )}
    </div>
  )
}

function QuoteCard({ result, checkin, checkout }: { result: RateQuoteResult; checkin: string; checkout: string }) {
  const { hotel, roomType, season, baseRate, surcharge, totalPerNight, totalStay, totalEgp, nights } = result

  function buildWhatsApp(): string {
    const currency = roomType.currency
    return `🏨 ${hotel.name} — ${hotel.city}, ${(hotel as any).hms_destinations?.name ?? 'Bali'}
Room: ${roomType.name} (${roomType.meal_plan})
Dates: ${checkin} → ${checkout} (${nights} nights)
Season: ${seasonLabel(season)}
Rate: ${currency} ${baseRate.toLocaleString()}${surcharge > 0 ? ` + ${currency} ${surcharge.toLocaleString()} surcharge` : ''} = ${currency} ${totalPerNight.toLocaleString()}/night
Total: ${currency} ${totalStay.toLocaleString()} ≈ EGP ${Math.round(totalEgp).toLocaleString()}${roomType.notes ? `\nIncludes: ${roomType.notes}` : ''}`
  }

  function copy() {
    navigator.clipboard.writeText(buildWhatsApp())
    toast.success('Quote copied to clipboard')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{hotel.name}</span>
            <span className="text-xs text-slate-500">{hotel.city} · {'★'.repeat(hotel.star_rating ?? 0)}</span>
            {hotel.chain && <span className="text-xs text-slate-400">{hotel.chain}</span>}
          </div>
          <div className="text-sm text-slate-600 mt-0.5">
            {roomType.name} · <span className="capitalize">{roomType.room_category}</span> · {roomType.meal_plan}
          </div>
          {roomType.notes && <div className="text-xs text-slate-400 mt-0.5">{roomType.notes}</div>}
        </div>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-terracotta-600 border border-terracotta-200 rounded-lg px-3 py-1.5 hover:bg-terracotta-50 shrink-0">
          <Copy size={12} /> Copy quote
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Base rate/night" value={`${roomType.currency} ${baseRate.toLocaleString()}`} />
        <Metric label="Surcharge/night" value={surcharge > 0 ? `${roomType.currency} ${surcharge.toLocaleString()}` : 'None'} />
        <Metric label="Total/night" value={`${roomType.currency} ${totalPerNight.toLocaleString()}`} highlight />
        <Metric label={`Total ${nights}n`} value={`${roomType.currency} ${totalStay.toLocaleString()}`} />
        <Metric label="EGP equivalent" value={`EGP ${Math.round(totalEgp).toLocaleString()}`} highlight />
        <Metric label="Season" value={seasonLabel(season)} />
        {hotel.surcharge_waiver !== 'none' && <Metric label="Waiver" value={hotel.surcharge_waiver} />}
      </div>
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`font-medium ${highlight ? 'text-terracotta-700' : 'text-slate-800'}`}>{value}</div>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400'
