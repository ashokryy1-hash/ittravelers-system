import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Trash2, User, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from '../context/SessionContext'
import { useBasePath } from '../context/TripExplorerContext'
import type { SessionSelection } from '../types'

function groupByCity(selections: SessionSelection[]): Record<string, SessionSelection[]> {
  return selections.reduce<Record<string, SessionSelection[]>>((acc, sel) => {
    if (!acc[sel.cityName]) acc[sel.cityName] = []
    acc[sel.cityName].push(sel)
    return acc
  }, {})
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildSummaryText(
  grouped: Record<string, SessionSelection[]>,
  clientName: string,
  hotelDates: Record<string, { checkIn: string; checkOut: string; roomType: string }>,
): string {
  const lines: string[] = ['ITTravelers Trip Explorer — Session Summary', '']
  if (clientName) { lines.push(`Client: ${clientName}`); lines.push('') }

  for (const [city, items] of Object.entries(grouped)) {
    lines.push(city.toUpperCase())
    const hotels = items.filter(i => i.type === 'hotel')
    const tours = items.filter(i => i.type === 'tour')
    if (hotels.length > 0) {
      lines.push('Hotels:')
      hotels.forEach(h => {
        const d = hotelDates[h.id]
        const parts: string[] = []
        if (d?.checkIn && d?.checkOut) parts.push(`Check-in: ${formatDate(d.checkIn)}, Check-out: ${formatDate(d.checkOut)}`)
        if (d?.roomType) parts.push(`Room: ${d.roomType}`)
        lines.push(`  - ${h.name}${parts.length ? ' — ' + parts.join(' | ') : ''}`)
      })
    }
    if (tours.length > 0) {
      lines.push('Tours:')
      tours.forEach(t => lines.push(`  - ${t.name}${t.details ? ` (${t.details})` : ''}`))
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

export default function SummaryScreen() {
  const navigate = useNavigate()
  const basePath = useBasePath()
  const { selections, clearSession, totalCount, hotelDates, setHotelDates } = useSession()
  const [clientName, setClientName] = useState('')

  const grouped = groupByCity(selections)

  const handleCopy = async () => {
    const text = buildSummaryText(grouped, clientName, hotelDates)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Summary copied to clipboard!')
    } catch {
      toast.error('Failed to copy. Please try manually.')
    }
  }

  const handleClear = () => {
    if (window.confirm('Clear all selections? This cannot be undone.')) {
      clearSession()
      toast.success('Session cleared.')
    }
  }

  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Header */}
      <div className="bg-white border-b border-ivory-300 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-body text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="font-display text-2xl text-terracotta-800">Session Summary</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {totalCount === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-3xl text-gray-300 italic">Nothing selected yet.</p>
            <p className="font-body text-gray-400 mt-2">Go explore and add hotels and tours.</p>
            <button
              onClick={() => navigate(`${basePath}/bali`)}
              className="mt-6 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full font-body text-sm font-medium transition-colors"
            >
              Explore Bali
            </button>
          </div>
        ) : (
          <>
            {/* Client name */}
            <div className="bg-white border border-ivory-200 rounded-2xl p-5 mb-6 shadow-sm">
              <p className="font-body text-xs uppercase tracking-wider text-gray-400 mb-3">Client Details</p>
              <div className="flex items-center gap-3">
                <User size={16} className="text-terracotta-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Client name"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full border border-ivory-300 rounded-lg px-3 py-2 font-body text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-200 transition"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full font-body text-sm font-medium transition-colors shadow"
              >
                <Copy size={15} />
                Copy Summary
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-400 hover:text-red-500 border border-red-200 rounded-full font-body text-sm font-medium transition-colors"
              >
                <Trash2 size={15} />
                Clear Session
              </button>
            </div>

            {/* Grouped selections */}
            <div className="space-y-8">
              {Object.entries(grouped).map(([cityName, items]) => (
                <div key={cityName}>
                  <h2 className="font-display text-2xl text-terracotta-700 mb-3 pb-2 border-b border-ivory-300">
                    {cityName}
                  </h2>
                  <div className="space-y-2">
                    {items.filter(i => i.type === 'hotel').length > 0 && (
                      <div>
                        <p className="font-body text-xs uppercase tracking-wider text-gray-400 mb-1.5">Hotels</p>
                        {items.filter(i => i.type === 'hotel').map(item => {
                          const dates = hotelDates[item.id] ?? { checkIn: '', checkOut: '', roomType: '' }
                          return (
                            <div key={item.id} className="py-3 px-4 bg-white rounded-xl border border-ivory-200 mb-2 space-y-2">
                              <p className="font-body font-medium text-sm text-gray-800">{item.name}</p>

                              {/* Check-in / Check-out */}
                              <div className="flex items-center gap-3">
                                <Calendar size={14} className="text-terracotta-400 shrink-0" />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-body text-xs text-gray-400">Check-in</span>
                                    <input
                                      type="date"
                                      value={dates.checkIn}
                                      onChange={e => setHotelDates(item.id, { ...dates, checkIn: e.target.value })}
                                      className="border border-ivory-300 rounded-lg px-2 py-1 font-body text-xs text-gray-700 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-200 transition"
                                    />
                                  </div>
                                  <span className="text-gray-300 font-body text-xs">→</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-body text-xs text-gray-400">Check-out</span>
                                    <input
                                      type="date"
                                      value={dates.checkOut}
                                      min={dates.checkIn || undefined}
                                      onChange={e => setHotelDates(item.id, { ...dates, checkOut: e.target.value })}
                                      className="border border-ivory-300 rounded-lg px-2 py-1 font-body text-xs text-gray-700 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-200 transition"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Room type */}
                              {item.roomTypes && item.roomTypes.length > 0 && (
                                <div className="flex items-center gap-3">
                                  <span className="font-body text-xs text-gray-400 shrink-0 ml-[22px]">Room type</span>
                                  <select
                                    value={dates.roomType}
                                    onChange={e => setHotelDates(item.id, { ...dates, roomType: e.target.value })}
                                    className="border border-ivory-300 rounded-lg px-2 py-1 font-body text-xs text-gray-700 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-200 transition bg-white"
                                  >
                                    <option value="">— Select room type —</option>
                                    {item.roomTypes.map(rt => (
                                      <option key={rt} value={rt}>{rt}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {items.filter(i => i.type === 'tour').length > 0 && (
                      <div>
                        <p className="font-body text-xs uppercase tracking-wider text-gray-400 mb-1.5">Tours</p>
                        {items.filter(i => i.type === 'tour').map(item => (
                          <div key={item.id} className="flex items-start gap-3 py-2 px-4 bg-white rounded-xl border border-ivory-200 mb-2">
                            <div>
                              <p className="font-body font-medium text-sm text-gray-800">{item.name}</p>
                              {item.details && (
                                <p className="font-body text-xs text-gray-400 mt-0.5">{item.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
