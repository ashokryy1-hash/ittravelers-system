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

const AREAS: Record<string, string[]> = {
  Bali: ['Ubud', 'Seminyak', 'Uluwatu', 'Canggu', 'Nusa Penida', 'Sanur', 'Kuta', 'Nusa Ceningan', 'Kintamani'],
  Thailand: ['Phuket', 'Koh Samui', 'Krabi', 'Bangkok', 'Chiang Mai'],
  Vietnam: ['Hanoi', 'Ho Chi Minh', 'Da Nang', 'Hoi An', 'Phu Quoc'],
}

const BUDGET_TIERS = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Budget  < USD 150/n', min: 0, max: 150 },
  { label: 'Mid  USD 150–300/n', min: 150, max: 300 },
  { label: 'Luxury  > USD 300/n', min: 300, max: Infinity },
]

function QuoteTool() {
  const [destination, setDestination] = useState('Bali')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [area, setArea] = useState('')
  const [stars, setStars] = useState<string>('all')  // 'all' | '4' | '5'
  const [budgetTier, setBudgetTier] = useState(0)
  const [results, setResults] = useState<RateQuoteResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [usdRate, setUsdRate] = useState(16000)

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
      if (stars !== 'all' && h.star_rating !== parseInt(stars)) return false
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
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm space-y-4">

          {/* Row 1: Destination tabs */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Destination</div>
            <div className="flex gap-2">
              {['Bali'].map(d => (
                <button key={d} onClick={() => { setDestination(d); setArea('') }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${destination === d ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Area chips */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Area</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setArea('')}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${!area ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                All areas
              </button>
              {(AREAS[destination] ?? []).map(a => (
                <button key={a} onClick={() => setArea(a === area ? '' : a)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${area === a ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Star rating buttons */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Star rating</div>
            <div className="flex gap-2">
              {[['all', 'All ★'], ['4', '4★'], ['5', '5★']].map(([val, label]) => (
                <button key={val} onClick={() => setStars(val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${stars === val ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Dates + search */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
              <input type="date" className={inp} value={checkin} onChange={e => setCheckin(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
              <input type="date" className={inp} value={checkout} onChange={e => setCheckout(e.target.value)} />
            </div>
            <div className="flex items-end col-span-2 sm:col-span-1">
              <button onClick={search} disabled={searching}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                <Search size={15} />
                {searching ? 'Searching…' : 'Get Rates'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results !== null && (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm text-slate-500">
                {results.length} option{results.length !== 1 ? 's' : ''} · {nightsBetween(checkin, checkout)} nights
                {results[0] && <> · <span className="font-medium capitalize">{seasonLabel(results[0].season)} season</span></>}
              </p>
            </div>

            {/* Budget tier filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              {BUDGET_TIERS.map((tier, i) => {
                const count = results.filter(r => {
                  const perNightUsd = r.totalPerNight / (usdRate || 16000)
                  return perNightUsd >= tier.min && perNightUsd < tier.max
                }).length
                return (
                  <button key={i} onClick={() => setBudgetTier(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${budgetTier === i ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
                    {tier.label} <span className="opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>

            {(() => {
              const tier = BUDGET_TIERS[budgetTier]
              const filtered = results.filter(r => {
                const perNightUsd = r.totalPerNight / (usdRate || 16000)
                return perNightUsd >= tier.min && perNightUsd < tier.max
              })
              return filtered.length === 0
                ? <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">No rooms found for this budget tier.</div>
                : <div className="space-y-3">{filtered.map((r, i) => <SalesQuoteCard key={i} result={r} checkin={checkin} checkout={checkout} usdRate={usdRate} />)}</div>
            })()}
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
