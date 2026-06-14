import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Search, Copy, Lock } from 'lucide-react'
import type { HmsHotel, HmsRoomType, HmsSurchargeRule, RateQuoteResult } from '../types'
import { getSeasonForStay, getSurcharge, seasonLabel, nightsBetween } from '../lib/season'
import { getSettings } from '../lib/settings'
import toast from 'react-hot-toast'

const SALES_PIN_KEY = 'hms_sales_pin_ok'

export default function SalesPortalScreen() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SALES_PIN_KEY) === 'true')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['hms_settings_sales'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_settings').select('*')
      const map: Record<string, string> = {}
      for (const row of data ?? []) map[row.key] = row.value
      return map
    },
  })

  function checkPin() {
    const correctPin = settings?.sales_pin || import.meta.env.VITE_SALES_PIN || '1234'
    if (pin === correctPin) {
      sessionStorage.setItem(SALES_PIN_KEY, 'true')
      setUnlocked(true)
    } else {
      setPinError(true)
      setPin('')
      setTimeout(() => setPinError(false), 2000)
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-teal-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-1">ITTravelers</h1>
          <p className="text-sm text-slate-500 mb-6">Sales Rate Portal</p>
          <input
            type="password"
            maxLength={6}
            placeholder="Enter PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkPin()}
            className={`w-full text-center text-2xl tracking-widest border rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-400 ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            autoFocus
          />
          {pinError && <p className="text-xs text-red-500 mb-3">Incorrect PIN. Please try again.</p>}
          <button
            onClick={checkPin}
            className="w-full bg-teal-600 text-white rounded-xl py-3 font-medium hover:bg-teal-700 transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  return <QuoteTool />
}

function QuoteTool() {
  const [destination, setDestination] = useState('Bali')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [area, setArea] = useState('')
  const [results, setResults] = useState<RateQuoteResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [usdRate, setUsdRate] = useState(16000) // IDR per 1 USD fallback

  const { data: hotels } = useQuery<HmsHotel[]>({
    queryKey: ['hms_hotels_sales'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_hotels')
        .select('*, hms_destinations(name)')
        .eq('contract_status', 'Active')
      return data ?? []
    },
  })

  const { data: rooms } = useQuery<HmsRoomType[]>({
    queryKey: ['hms_rooms_sales'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_room_types').select('*')
      return data ?? []
    },
  })

  const { data: surchargeRules } = useQuery<HmsSurchargeRule[]>({
    queryKey: ['hms_surcharge_rules_sales'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_surcharge_rules').select('*, hms_destinations(name)')
      return data ?? []
    },
  })

  async function search() {
    if (!checkin || !checkout) { toast.error('Please enter check-in and check-out dates'); return }
    setSearching(true)
    const settings = await getSettings()
    const idrToEgp = parseFloat(settings.IDR_to_EGP)
    const usdToEgp = parseFloat(settings.USD_to_EGP)
    // IDR per USD = (IDR→EGP rate) / (USD→EGP rate) inverted
    // e.g. 1 USD = 50 EGP, 1 IDR = 0.0018 EGP → 1 USD = 50/0.0018 ≈ 27,778 IDR
    if (idrToEgp > 0 && usdToEgp > 0) setUsdRate(usdToEgp / idrToEgp)
    const nights = nightsBetween(checkin, checkout)
    if (nights <= 0) { toast.error('Check-out must be after check-in'); setSearching(false); return }

    const destHotels = (hotels ?? []).filter(h => {
      const destName = (h as any).hms_destinations?.name ?? ''
      if (destName !== destination) return false
      if (area && !h.city?.toLowerCase().includes(area.toLowerCase())) return false
      return true
    })

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
        const totalPerNight = (baseRate + surcharge) * 1.05  // 5% margin
        const totalStay = totalPerNight * nights

        let totalEgp = 0
        if (room.currency === 'IDR') totalEgp = totalStay * idrToEgp
        else if (room.currency === 'THB') totalEgp = totalStay * parseFloat(settings.THB_to_EGP)
        else totalEgp = totalStay * parseFloat(settings.USD_to_EGP)

        quoteResults.push({ hotel, roomType: room, season, baseRate, surcharge, totalPerNight, totalStay, totalEgp, nights })
      }
    }

    quoteResults.sort((a, b) => a.totalEgp - b.totalEgp)
    setResults(quoteResults)
    setSearching(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">ITTravelers</h1>
            <p className="text-xs text-slate-500">Sales Rate Portal</p>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('hms_sales_pin_ok'); window.location.reload() }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Lock
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Search form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Search Rates</h2>
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
              <input className={inp} placeholder="e.g. Ubud, Uluwatu" value={area} onChange={e => setArea(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
              <input type="date" className={inp} value={checkin} onChange={e => setCheckin(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
              <input type="date" className={inp} value={checkout} onChange={e => setCheckout(e.target.value)} />
            </div>
            <div className="flex items-end sm:col-span-2 md:col-span-1">
              <button
                onClick={search}
                disabled={searching}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
              >
                <Search size={15} />
                {searching ? 'Searching…' : 'Get Rates'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results !== null && (
          <div>
            <p className="text-sm text-slate-500 mb-3">
              {results.length} option{results.length !== 1 ? 's' : ''} · {nightsBetween(checkin, checkout)} nights
              {results[0] && <> · <span className="font-medium capitalize">{seasonLabel(results[0].season)} season</span></>}
            </p>
            {results.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
                No rooms found for these dates and area.
              </div>
            )}
            <div className="space-y-3">
              {results.map((r, i) => (
                <SalesQuoteCard key={i} result={r} checkin={checkin} checkout={checkout} usdRate={usdRate} />
              ))}
            </div>
          </div>
        )}

        {results === null && (
          <div className="text-center py-16 text-slate-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter dates and click "Get Rates" to see available options.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SalesQuoteCard({ result, checkin, checkout, usdRate }: { result: RateQuoteResult; checkin: string; checkout: string; usdRate: number }) {
  const { hotel, roomType, season, totalPerNight, totalStay, nights } = result
  const currency = roomType.currency

  // totalPerNight and totalStay already include 5% markup
  const totalUsd = currency === 'USD'
    ? totalStay
    : currency === 'IDR'
      ? totalStay / (usdRate > 0 ? usdRate : 16000)
      : totalStay / (usdRate > 0 ? usdRate : 16000)  // fallback for THB

  const perNightUsd = totalUsd / nights

  function buildWhatsApp(): string {
    const idrTotal = Math.round(totalStay).toLocaleString()
    const usdTotal = totalUsd.toFixed(0)
    return `🏨 *${hotel.name}*
📍 ${hotel.city}, ${(hotel as any).hms_destinations?.name ?? 'Bali'}
🛏 ${roomType.name} (${roomType.meal_plan})
📅 ${checkin} → ${checkout} (${nights} nights)
✨ Season: ${seasonLabel(season)}
💰 ${currency} ${idrTotal} total ≈ USD ${Number(usdTotal).toLocaleString()}${roomType.notes ? `\n✅ Includes: ${roomType.notes}` : ''}

For bookings & inquiries: Ittravelers.com`
  }

  function copy() {
    navigator.clipboard.writeText(buildWhatsApp())
    toast.success('Quote copied — ready to paste into WhatsApp')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{hotel.name}</span>
            <span className="text-xs text-slate-500">{hotel.city}</span>
            {hotel.star_rating && (
              <span className="text-xs text-amber-500">{'★'.repeat(hotel.star_rating)}</span>
            )}
          </div>
          <div className="text-sm text-slate-600 mt-0.5">
            {roomType.name} · <span className="capitalize">{roomType.room_category}</span> · {roomType.meal_plan}
          </div>
          {roomType.notes && <div className="text-xs text-teal-600 mt-0.5">✓ {roomType.notes}</div>}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-teal-600 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 shrink-0 font-medium"
        >
          <Copy size={12} /> Copy quote
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-slate-400">Per night ({currency})</div>
          <div className="font-bold text-slate-800">{currency} {Math.round(totalPerNight).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Total {nights}n ({currency})</div>
          <div className="font-bold text-teal-700 text-base">{currency} {Math.round(totalStay).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Per night (USD)</div>
          <div className="font-bold text-slate-800">USD {perNightUsd.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Total {nights}n (USD)</div>
          <div className="font-bold text-teal-700 text-base">USD {Math.round(totalUsd).toLocaleString()}</div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-400">Season</div>
          <div className="text-sm font-medium text-slate-600 capitalize">{seasonLabel(season)}</div>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'
