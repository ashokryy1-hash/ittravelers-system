import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { HmsBooking } from '../types'
import { useState } from 'react'
import { Users, Hotel, Map, ChevronDown, ChevronUp, DollarSign, CheckCircle, Clock } from 'lucide-react'

interface TourFile {
  id: string
  client_name: string
  destination: string | null
  created_at: string
  hms_tour_days: { id: string; date: string | null; hms_tour_activities: { description: string }[] }[]
}

interface ClientSummary {
  name: string
  hotels: HmsBooking[]
  tours: TourFile[]
  totalQuoted: number
  totalPaid: number
}

function statusColor(status: HmsBooking['status']) {
  switch (status) {
    case 'Confirmed': return 'bg-blue-100 text-blue-700'
    case 'Paid': return 'bg-green-100 text-green-700'
    case 'Cancelled': return 'bg-red-100 text-red-700'
    default: return 'bg-amber-100 text-amber-700'
  }
}

function ClientCard({ client }: { client: ClientSummary }) {
  const [expanded, setExpanded] = useState(false)
  const outstanding = client.totalQuoted - client.totalPaid

  return (
    <div className="bg-white border border-ivory-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-ivory-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-full bg-terracotta-100 flex items-center justify-center text-terracotta-700 font-bold text-sm shrink-0">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-terracotta-800 text-sm truncate">{client.name}</div>
          <div className="text-xs text-ivory-500 mt-0.5">
            {client.hotels.length > 0 && <span>{client.hotels.length} hotel{client.hotels.length > 1 ? 's' : ''}</span>}
            {client.hotels.length > 0 && client.tours.length > 0 && <span className="mx-1.5">·</span>}
            {client.tours.length > 0 && <span>{client.tours.length} tour file{client.tours.length > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          {client.totalQuoted > 0 && (
            <div className="text-xs font-semibold text-terracotta-700">USD {client.totalQuoted.toLocaleString()}</div>
          )}
          {outstanding > 0 && (
            <div className="text-xs text-amber-600 mt-0.5">{outstanding.toLocaleString()} unpaid</div>
          )}
          {client.totalQuoted > 0 && outstanding === 0 && (
            <div className="text-xs text-green-600 mt-0.5 flex items-center gap-1 justify-end"><CheckCircle size={11} /> Fully paid</div>
          )}
        </div>
        {expanded ? <ChevronUp size={15} className="text-ivory-400 shrink-0" /> : <ChevronDown size={15} className="text-ivory-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-ivory-100 px-5 py-4 space-y-4">

          {/* Hotels */}
          {client.hotels.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ivory-500 uppercase tracking-wide mb-2">
                <Hotel size={12} /> Hotels
              </div>
              <div className="space-y-2">
                {client.hotels.map(b => (
                  <div key={b.id} className="flex items-start gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-terracotta-800 truncate">{b.hms_hotels?.name ?? 'Manual hotel'}</div>
                      <div className="text-ivory-400 mt-0.5">
                        {b.checkin_date} → {b.checkout_date}
                        {b.nights && <span className="ml-1.5">({b.nights}n)</span>}
                        {b.room_type_name && <span className="ml-1.5 text-ivory-500">· {b.room_type_name}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(b.status)}`}>{b.status}</span>
                      {b.quoted_price && (
                        <div className="text-ivory-600 font-medium mt-1">{b.currency} {b.quoted_price.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tours */}
          {client.tours.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ivory-500 uppercase tracking-wide mb-2">
                <Map size={12} /> Tours
              </div>
              <div className="space-y-2">
                {client.tours.map(tour => {
                  const dayCount = tour.hms_tour_days?.length ?? 0
                  return (
                    <div key={tour.id} className="text-xs">
                      <div className="font-medium text-terracotta-800">
                        {tour.destination ?? 'Tour itinerary'}
                        {dayCount > 0 && <span className="text-ivory-400 font-normal ml-1.5">· {dayCount} day{dayCount > 1 ? 's' : ''}</span>}
                      </div>
                      {tour.hms_tour_days?.slice(0, 3).map((day, di) => {
                        const first = day.hms_tour_activities?.[0]?.description ?? ''
                        const isTransfer = first.startsWith('__transfer__:')
                        const label = isTransfer
                          ? (() => { const parts = first.replace('__transfer__:', '').split('|||'); return `🚗 ${parts[0]} → ${parts[1]}` })()
                          : first
                        return label ? (
                          <div key={di} className="text-ivory-400 mt-0.5 pl-2 truncate">
                            {day.date && <span className="mr-1">{day.date}</span>}{label}
                          </div>
                        ) : null
                      })}
                      {dayCount > 3 && <div className="text-ivory-400 pl-2 mt-0.5">+{dayCount - 3} more days…</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Payment summary */}
          {client.totalQuoted > 0 && (
            <div className="bg-ivory-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-ivory-500">Total quoted</span>
                <span className="font-semibold text-terracotta-800">USD {client.totalQuoted.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-500">Total paid</span>
                <span className="font-semibold text-green-700">USD {client.totalPaid.toLocaleString()}</span>
              </div>
              {outstanding > 0 && (
                <div className="flex justify-between border-t border-ivory-200 pt-1 mt-1">
                  <span className="text-ivory-500 flex items-center gap-1"><Clock size={10} /> Outstanding</span>
                  <span className="font-bold text-amber-700">USD {outstanding.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ClientsScreen() {
  const [search, setSearch] = useState('')

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['hms_bookings_clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hms_bookings')
        .select('*, hms_hotels!hotel_id(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as HmsBooking[]
    },
  })

  const { data: tours = [], isLoading: loadingTours } = useQuery({
    queryKey: ['hms_tours_clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hms_tours')
        .select(`
          id, client_name, destination, created_at,
          hms_tour_days!tour_id(
            id, date,
            hms_tour_activities!day_id(description)
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as TourFile[]
    },
  })

  // Group by client name
  const clientMap = new Map<string, ClientSummary>()

  for (const b of bookings) {
    const key = b.client_name.trim()
    if (!clientMap.has(key)) clientMap.set(key, { name: key, hotels: [], tours: [], totalQuoted: 0, totalPaid: 0 })
    const c = clientMap.get(key)!
    c.hotels.push(b)
    c.totalQuoted += b.quoted_price ?? 0
    c.totalPaid += b.paid_price ?? 0
  }

  for (const t of tours) {
    const key = t.client_name?.trim()
    if (!key) continue
    if (!clientMap.has(key)) clientMap.set(key, { name: key, hotels: [], tours: [], totalQuoted: 0, totalPaid: 0 })
    clientMap.get(key)!.tours.push(t)
  }

  const clients = Array.from(clientMap.values())
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const totalOutstanding = clients.reduce((s, c) => s + Math.max(0, c.totalQuoted - c.totalPaid), 0)

  if (loadingBookings || loadingTours) {
    return (
      <div className="p-6 text-center text-ivory-400 text-sm">Loading clients…</div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-terracotta-800 flex items-center gap-2">
            <Users size={20} /> Clients
          </h1>
          <p className="text-xs text-ivory-500 mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''} with bookings or tours</p>
        </div>
        {totalOutstanding > 0 && (
          <div className="text-right">
            <div className="text-xs text-ivory-500">Total outstanding</div>
            <div className="text-sm font-bold text-amber-700 flex items-center gap-1">
              <DollarSign size={14} /> {totalOutstanding.toLocaleString()} USD
            </div>
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Search clients…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full text-sm border border-ivory-200 rounded-xl px-4 py-2.5 mb-5 focus:outline-none focus:border-terracotta-400"
      />

      {clients.length === 0 ? (
        <div className="text-center text-ivory-400 text-sm py-16">
          {search ? 'No clients match your search.' : 'No clients yet. Save bookings from the Inbox or Reservations module.'}
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => <ClientCard key={c.name} client={c} />)}
        </div>
      )}
    </div>
  )
}
