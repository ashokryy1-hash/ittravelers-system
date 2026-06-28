import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Copy, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HmsHotel, HmsRoomType, HmsSurchargeRule, RateQuoteResult } from '../types'
import { getSeasonForStay, getSurcharge, seasonLabel, nightsBetween } from '../lib/season'
import { getSettings } from '../lib/settings'
import toast from 'react-hot-toast'

export default function RateViewerScreen() {
  const [destination, setDestination] = useState('Bali')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [area, setArea] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [results, setResults] = useState<RateQuoteResult[] | null>(null)
  const [searching, setSearching] = useState(false)

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
            <label className="block text-xs font-medium text-gray-600 mb-1">Area (optional)</label>
            <input className={inp} placeholder="e.g. Ubud" value={area} onChange={e => setArea(e.target.value)} />
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
