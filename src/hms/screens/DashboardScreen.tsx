import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { AlertTriangle, Bell, Calendar, Building2, CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HmsHotel, HmsOutreachHotel, HmsBooking } from '../types'

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr).getTime()
  return Math.round((d - Date.now()) / (1000 * 60 * 60 * 24))
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export default function DashboardScreen() {
  const { data: hotels } = useQuery<HmsHotel[]>({
    queryKey: ['hms_hotels_dashboard'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_hotels').select('*')
      return data ?? []
    },
  })

  const { data: outreachHotels } = useQuery<HmsOutreachHotel[]>({
    queryKey: ['hms_outreach_followups'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_outreach_hotels')
        .select('*')
        .lte('follow_up_date', today())
        .not('stage', 'in', '("Signed","Declined")')
      return data ?? []
    },
  })

  const { data: bookings } = useQuery<HmsBooking[]>({
    queryKey: ['hms_bookings_dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_bookings')
        .select('*, hms_hotels(name)')
        .gte('checkin_date', today())
      return data ?? []
    },
  })

  const expiringContracts = hotels?.filter(h => {
    if (!h.valid_to) return false
    const days = daysUntil(h.valid_to)
    return days >= 0 && days <= 90
  }) ?? []

  const pendingBookings = bookings?.filter(b => b.status === 'Availability pending') ?? []
  const confirmedBookings = bookings?.filter(b => b.status === 'Confirmed') ?? []

  // This month bookings
  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthBookings = bookings?.filter(b => b.created_at?.startsWith(thisMonth)) ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Contracts" value={hotels?.filter(h => h.contract_status === 'Active').length ?? 0} color="teal" />
        <StatCard label="Pending Bookings" value={pendingBookings.length} color="amber" />
        <StatCard label="Confirmed Bookings" value={confirmedBookings.length} color="green" />
        <StatCard label="Bookings This Month" value={thisMonthBookings.length} color="slate" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expiring contracts */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-700 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            Contracts Expiring Soon
          </h2>
          {expiringContracts.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-lg p-4">No contracts expiring in the next 90 days.</p>
          ) : (
            <div className="space-y-2">
              {expiringContracts.map(h => (
                <Link
                  key={h.id}
                  to={`/hms/rates/${h.id}`}
                  className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-4 py-3 hover:bg-amber-50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{h.name}</div>
                    <div className="text-xs text-slate-500">{h.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-amber-600">
                      {daysUntil(h.valid_to!)} days left
                    </div>
                    <div className="text-xs text-slate-400">{h.valid_to}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Follow-up reminders */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-700 mb-3">
            <Bell size={16} className="text-red-500" />
            Follow-up Reminders Due
          </h2>
          {(outreachHotels?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-lg p-4">No follow-ups due today.</p>
          ) : (
            <div className="space-y-2">
              {outreachHotels!.map(h => (
                <Link
                  key={h.id}
                  to={`/hms/outreach`}
                  className="flex items-center justify-between bg-white border border-red-200 rounded-lg px-4 py-3 hover:bg-red-50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{h.name}</div>
                    <div className="text-xs text-slate-500">{h.stage}</div>
                  </div>
                  <div className="text-xs font-medium text-red-600">
                    Due {h.follow_up_date}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Pending bookings */}
        <section className="md:col-span-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-700 mb-3">
            <CalendarCheck size={16} className="text-teal-500" />
            Upcoming Bookings Awaiting Availability
          </h2>
          {pendingBookings.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-lg p-4">No pending availability requests.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {pendingBookings.map(b => (
                <Link
                  key={b.id}
                  to={`/hms/reservations/${b.id}`}
                  className="bg-white border border-amber-200 rounded-lg px-4 py-3 hover:bg-amber-50 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-800">{b.client_name}</div>
                  <div className="text-xs text-slate-500">
                    {(b as any).hms_hotels?.name} · {b.checkin_date} → {b.checkout_date}
                  </div>
                  <span className="mt-1 inline-block text-xs font-medium text-amber-700 bg-amber-100 rounded px-2 py-0.5">
                    Availability pending
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  }
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-75">{label}</div>
    </div>
  )
}
