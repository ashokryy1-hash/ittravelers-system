import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Search, ChevronDown, ChevronUp, Trash2, Calendar, Building2 } from 'lucide-react'
import { useBasePath } from '../context/TripExplorerContext'
import { format, parseISO } from 'date-fns'
import type { SessionSelection } from '../types'

interface HotelDates { checkIn: string; checkOut: string; roomType: string }

interface ExplorerSession {
  id: string
  client_name: string
  destination: string | null
  selections: SessionSelection[]
  hotel_dates: Record<string, HotelDates>
  notes: string | null
  created_at: string
  updated_at: string
}

function formatDate(d: string) {
  try { return format(parseISO(d), 'd MMM yyyy') } catch { return d }
}

export default function SessionsScreen() {
  const navigate = useNavigate()
  const basePath = useBasePath()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const { data: sessions = [], isLoading } = useQuery<ExplorerSession[]>({
    queryKey: ['explorer_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorer_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(s => ({
        ...s,
        selections: typeof s.selections === 'string' ? JSON.parse(s.selections) : s.selections,
        hotel_dates: typeof s.hotel_dates === 'string' ? JSON.parse(s.hotel_dates) : s.hotel_dates,
      }))
    },
  })

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('explorer_sessions').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['explorer_sessions'] }),
  })

  const filtered = sessions.filter(s =>
    !search.trim() || s.client_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-ivory-100">
      <div className="bg-white border-b border-ivory-300 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(basePath || '/')}
            className="flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-body text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="font-display text-2xl text-terracotta-800">Saved Sessions</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name…"
            className="w-full pl-9 pr-4 py-2.5 border border-ivory-300 rounded-xl font-body text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-200 bg-white"
          />
        </div>

        {isLoading && (
          <div className="text-center py-12 text-gray-400 font-body text-sm">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-2xl text-gray-300 italic">No sessions yet.</p>
            <p className="font-body text-gray-400 mt-1 text-sm">Save a session from the Summary page after each client meeting.</p>
          </div>
        )}

        {filtered.map(session => {
          const isOpen = open === session.id
          const hotels = session.selections.filter(s => s.type === 'hotel')
          const tours = session.selections.filter(s => s.type === 'tour')

          return (
            <div key={session.id} className="bg-white border border-ivory-200 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : session.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-ivory-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-terracotta-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {session.client_name.trim()[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-gray-800">{session.client_name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {session.destination && (
                      <span className="text-xs text-terracotta-600 font-body font-medium">{session.destination}</span>
                    )}
                    <span className="text-xs text-gray-400 font-body">
                      {hotels.length} hotel{hotels.length !== 1 ? 's' : ''}
                      {tours.length > 0 ? ` · ${tours.length} tour${tours.length !== 1 ? 's' : ''}` : ''}
                    </span>
                    <span className="text-xs text-gray-300 font-body">{formatDate(session.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (confirm(`Delete session for ${session.client_name}?`)) {
                        deleteSession.mutate(session.id)
                      }
                    }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-ivory-200 px-5 py-4 space-y-4">
                  {/* Hotels */}
                  {hotels.length > 0 && (
                    <div>
                      <p className="font-body text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                        <Building2 size={11} /> Hotels
                      </p>
                      <div className="space-y-2">
                        {hotels.map(h => {
                          const d = session.hotel_dates[h.id]
                          return (
                            <div key={h.id} className="bg-ivory-50 rounded-xl px-4 py-2.5">
                              <div className="font-body font-medium text-sm text-gray-800">{h.name}</div>
                              <div className="flex flex-wrap gap-3 mt-1">
                                <span className="text-xs text-gray-400 font-body">{h.cityName}</span>
                                {d?.checkIn && d?.checkOut && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 font-body">
                                    <Calendar size={10} className="text-terracotta-400" />
                                    {formatDate(d.checkIn)} → {formatDate(d.checkOut)}
                                  </span>
                                )}
                                {d?.roomType && (
                                  <span className="text-xs bg-terracotta-100 text-terracotta-700 rounded px-1.5 py-0.5 font-body font-medium">
                                    {d.roomType}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tours */}
                  {tours.length > 0 && (
                    <div>
                      <p className="font-body text-xs uppercase tracking-wider text-gray-400 mb-2">Tours</p>
                      <div className="flex flex-wrap gap-2">
                        {tours.map(t => (
                          <span key={t.id} className="text-xs bg-ivory-100 border border-ivory-300 text-gray-600 rounded-full px-3 py-1 font-body">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {session.notes && (
                    <div>
                      <p className="font-body text-xs uppercase tracking-wider text-gray-400 mb-1">Notes</p>
                      <p className="font-body text-sm text-gray-600 whitespace-pre-wrap">{session.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
