import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, BookOpen, X, Check, Users, List, ChevronRight, Car, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityItem {
  time: string
  description: string
  type?: 'stop' | 'transfer'
  from?: string
  to?: string
  flight?: string
}

interface TourActivity {
  id: string
  day_id: string
  time: string
  description: string
  sort_order: number
}

interface TourDay {
  id: string
  tour_id: string
  date: string | null
  sort_order: number
  hms_tour_activities: TourActivity[]
}

interface Tour {
  id: string
  client_name: string
  pax: number
  notes: string | null
  created_at: string
  hms_tour_days: TourDay[]
}

interface ActivityTemplate {
  id: string
  name: string
  icon: string
  activities: ActivityItem[]
}

interface Hotel {
  id: string
  name: string
  city?: string
}

// ─── Transfer encoding helpers ────────────────────────────────────────────────

const TRANSFER_PREFIX = '__transfer__:'
const TRANSFER_SEP = '|||'

function encodeTransfer(from: string, to: string, flight?: string): string {
  const base = `${TRANSFER_PREFIX}${from}${TRANSFER_SEP}${to}`
  return flight?.trim() ? `${base}${TRANSFER_SEP}flight:${flight.trim()}` : base
}

function parseTransfer(description: string): { isTransfer: boolean; from: string; to: string; flight: string } {
  if (description.startsWith(TRANSFER_PREFIX)) {
    const rest = description.slice(TRANSFER_PREFIX.length)
    const parts = rest.split(TRANSFER_SEP)
    if (parts.length >= 2) {
      const from = parts[0]
      const to = parts[1]
      const flight = parts[2]?.startsWith('flight:') ? parts[2].slice(7) : ''
      return { isTransfer: true, from, to, flight }
    }
  }
  return { isTransfer: false, from: '', to: '', flight: '' }
}

// Contact encoding stored in tour notes
const CONTACT_PREFIX = '__contact__:'
function encodeContact(name: string, phone: string): string {
  return `${CONTACT_PREFIX}${name.trim()}${TRANSFER_SEP}${phone.trim()}`
}
function parseContact(notes: string | null): { contactName: string; contactPhone: string; cleanNotes: string } {
  if (!notes) return { contactName: '', contactPhone: '', cleanNotes: '' }
  const lines = notes.split('\n')
  const contactLine = lines.find(l => l.startsWith(CONTACT_PREFIX))
  if (!contactLine) return { contactName: '', contactPhone: '', cleanNotes: notes }
  const rest = contactLine.slice(CONTACT_PREFIX.length)
  const idx = rest.indexOf(TRANSFER_SEP)
  const contactName = idx !== -1 ? rest.slice(0, idx) : rest
  const contactPhone = idx !== -1 ? rest.slice(idx + TRANSFER_SEP.length) : ''
  const cleanNotes = lines.filter(l => !l.startsWith(CONTACT_PREFIX)).join('\n').trim()
  return { contactName, contactPhone, cleanNotes }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDay(dateStr: string | null, dayNum: number) {
  if (!dateStr) return `Day ${dayNum}`
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return `Day ${dayNum}`
  }
}

function buildWhatsApp(tour: Tour): string {
  const days = [...(tour.hms_tour_days ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const { contactName, contactPhone, cleanNotes } = parseContact(tour.notes)
  const lines: string[] = []
  lines.push('🌼🌼')
  lines.push(tour.client_name)
  lines.push(`${tour.pax} pax`)
  if (contactName) lines.push(`📞 ${contactName}${contactPhone ? ` — ${contactPhone}` : ''}`)
  for (const day of days) {
    lines.push('')
    lines.push('🌴')
    lines.push(formatDay(day.date, day.sort_order + 1))
    const acts = [...(day.hms_tour_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    for (const act of acts) {
      const parsed = parseTransfer(act.description)
      if (parsed.isTransfer) {
        const flightNote = parsed.flight ? ` ✈️ ${parsed.flight}` : ''
        lines.push(`${act.time} 🚗 Transfer: ${parsed.from} → ${parsed.to}${flightNote}`)
      } else {
        lines.push(`${act.time} ${act.description}`)
      }
    }
    lines.push('End of program')
  }
  if (cleanNotes) {
    lines.push('')
    lines.push(cleanNotes)
  }
  return lines.join('\n')
}

function normalizeClientKey(name: string): string {
  return name.trim().toLowerCase()
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ToursScreen() {
  const [tab, setTab] = useState<'tours' | 'library'>('tours')
  const [showNew, setShowNew] = useState(false)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tours</h1>
        {tab === 'tours' && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-teal-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-700"
          >
            <Plus size={15} /> New Tour
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['tours', 'library'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'tours' ? 'Itineraries' : 'Activity Library'}
          </button>
        ))}
      </div>

      {tab === 'tours' && <ToursTab onNew={() => setShowNew(true)} />}
      {tab === 'library' && <LibraryTab />}

      {showNew && <NewTourModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

// ─── Tours Tab ────────────────────────────────────────────────────────────────

function ToursTab({ onNew }: { onNew: () => void }) {
  const [view, setView] = useState<'list' | 'clients'>('list')

  const { data: tours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ['hms_tours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hms_tours')
        .select('*, hms_tour_days(*, hms_tour_activities(*))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // Compute existing client names for autocomplete
  const existingClients = Array.from(
    new Map(tours.map(t => [normalizeClientKey(t.client_name), t.client_name])).values()
  ).sort((a, b) => a.localeCompare(b))

  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>

  return (
    <div>
      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <List size={13} /> All
          </button>
          <button
            onClick={() => setView('clients')}
            className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${view === 'clients' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users size={13} /> Clients
          </button>
        </div>
      </div>

      {!tours.length && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg mb-2">No tours yet</p>
          <p className="text-sm">Click "New Tour" to create your first itinerary</p>
        </div>
      )}

      {view === 'list' && tours.length > 0 && (
        <div className="space-y-4">
          {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
        </div>
      )}

      {view === 'clients' && tours.length > 0 && (
        <ClientsView tours={tours} />
      )}
    </div>
  )
}

// ─── Clients View ─────────────────────────────────────────────────────────────

function ClientsView({ tours }: { tours: Tour[] }) {
  const [openClients, setOpenClients] = useState<Set<string>>(new Set())

  // Group by normalized client key
  const grouped = new Map<string, { displayName: string; tours: Tour[] }>()
  for (const tour of tours) {
    const key = normalizeClientKey(tour.client_name)
    if (!grouped.has(key)) {
      grouped.set(key, { displayName: tour.client_name, tours: [] })
    }
    grouped.get(key)!.tours.push(tour)
  }

  const entries = Array.from(grouped.entries()).sort((a, b) => a[1].displayName.localeCompare(b[1].displayName))

  function toggleClient(key: string) {
    setOpenClients(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, { displayName, tours: clientTours }]) => {
        const isOpen = openClients.has(key)
        const initial = displayName.trim()[0]?.toUpperCase() ?? '?'
        return (
          <div key={key} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <button
              onClick={() => toggleClient(key)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {initial}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">{displayName}</div>
                <div className="text-xs text-slate-500">{clientTours.length} tour{clientTours.length !== 1 ? 's' : ''}</div>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                {clientTours.map(tour => <TourCard key={tour.id} tour={tour} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tour Card ────────────────────────────────────────────────────────────────

function TourCard({ tour }: { tour: Tour }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const days = [...(tour.hms_tour_days ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  async function deleteTour() {
    if (!confirm(`Delete tour for ${tour.client_name}?`)) return
    await supabase.from('hms_tours').delete().eq('id', tour.id)
    qc.invalidateQueries({ queryKey: ['hms_tours'] })
    toast.success('Tour deleted')
  }

  function copyWhatsApp() {
    navigator.clipboard.writeText(buildWhatsApp(tour))
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(e => !e)} className="flex-1 text-left flex items-center gap-3">
          <div>
            <div className="font-semibold text-slate-800">{tour.client_name}</div>
            <div className="text-xs text-slate-500">{tour.pax} pax · {days.length} day{days.length !== 1 ? 's' : ''}</div>
          </div>
          {expanded ? <ChevronUp size={16} className="ml-auto text-slate-400" /> : <ChevronDown size={16} className="ml-auto text-slate-400" />}
        </button>
        <button
          onClick={copyWhatsApp}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            copied ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-300 text-slate-600 hover:bg-gray-50'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'WhatsApp'}
        </button>
        <button onClick={deleteTour} className="text-slate-400 hover:text-red-500 transition-colors p-1">
          <Trash2 size={15} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {/* Contact info */}
          {(() => { const { contactName, contactPhone } = parseContact(tour.notes); return (contactName || contactPhone) ? (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              <span>📞</span>
              <span className="font-medium">{contactName}</span>
              {contactPhone && <span className="text-slate-400">— {contactPhone}</span>}
            </div>
          ) : null })()}

          {days.map((day, i) => {
            const acts = [...(day.hms_tour_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order)
            return (
              <div key={day.id}>
                <div className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">
                  🌴 {formatDay(day.date, i + 1)}
                </div>
                <div className="space-y-0.5 pl-2">
                  {acts.map(act => {
                    const parsed = parseTransfer(act.description)
                    if (parsed.isTransfer) {
                      return (
                        <div key={act.id} className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 font-mono">{act.time}</span>
                          <Car size={13} className="text-slate-400" />
                          <span className="italic">{parsed.from} → {parsed.to}</span>
                          {parsed.flight && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 not-italic">✈️ {parsed.flight}</span>}
                        </div>
                      )
                    }
                    return (
                      <div key={act.id} className="text-sm text-slate-700">
                        <span className="text-slate-400 font-mono mr-2">{act.time}</span>
                        {act.description}
                      </div>
                    )
                  })}
                  {!acts.length && <div className="text-xs text-slate-400">No activities</div>}
                </div>
              </div>
            )
          })}
          {(() => { const { cleanNotes } = parseContact(tour.notes); return cleanNotes ? (
            <div className="text-xs text-slate-500 border-t border-gray-100 pt-2 mt-2">{cleanNotes}</div>
          ) : null })()}
          {/* WhatsApp preview */}
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="text-xs font-medium text-slate-500 mb-2">WhatsApp preview</div>
            <pre className="text-xs bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans text-slate-700 border border-gray-200">
              {buildWhatsApp(tour)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Activity Library Tab ─────────────────────────────────────────────────────

function LibraryTab() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🌴')
  const [newActivities, setNewActivities] = useState<ActivityItem[]>([{ time: '', description: '' }])

  const { data: templates = [] } = useQuery<ActivityTemplate[]>({
    queryKey: ['hms_activity_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hms_activity_templates').select('*').order('created_at')
      if (error) throw error
      return (data ?? []).map(t => ({ ...t, activities: typeof t.activities === 'string' ? JSON.parse(t.activities) : t.activities }))
    },
  })

  async function saveTemplate() {
    if (!newName.trim()) return toast.error('Name required')
    const acts = newActivities.filter(a => a.description.trim())
    const { error } = await supabase.from('hms_activity_templates').insert({
      name: newName.trim(), icon: newIcon, activities: acts,
    })
    if (error) return toast.error(error.message)
    qc.invalidateQueries({ queryKey: ['hms_activity_templates'] })
    setShowNew(false)
    setNewName('')
    setNewIcon('🌴')
    setNewActivities([{ time: '', description: '' }])
    toast.success('Template saved')
  }

  async function deleteTemplate(id: string) {
    await supabase.from('hms_activity_templates').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['hms_activity_templates'] })
    toast.success('Template deleted')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">Reusable day programs you can insert when building a tour</p>
        <button
          onClick={() => setShowNew(s => !s)}
          className="flex items-center gap-2 border border-teal-600 text-teal-600 rounded-lg px-3 py-1.5 text-sm hover:bg-teal-50"
        >
          <Plus size={14} /> Add Template
        </button>
      </div>

      {showNew && (
        <div className="border border-gray-200 rounded-xl bg-white p-4 mb-4 space-y-3">
          <div className="flex gap-2">
            <input value={newIcon} onChange={e => setNewIcon(e.target.value)} className={`${inp} w-16 text-center`} placeholder="🌴" />
            <input value={newName} onChange={e => setNewName(e.target.value)} className={inp} placeholder="Template name (e.g. Nusa Penida Full Day)" />
          </div>
          <div className="space-y-2">
            {newActivities.map((act, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={act.time}
                  onChange={e => setNewActivities(a => a.map((x, j) => j === i ? { ...x, time: e.target.value } : x))}
                  className={`${inp} w-24`}
                  placeholder="09:00"
                />
                <input
                  value={act.description}
                  onChange={e => setNewActivities(a => a.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                  className={inp}
                  placeholder="Activity description"
                />
                <button onClick={() => setNewActivities(a => a.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setNewActivities(a => [...a, { time: '', description: '' }])}
              className="text-xs text-teal-600 hover:underline"
            >
              + Add activity
            </button>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="text-sm text-slate-500 px-3 py-1.5">Cancel</button>
            <button onClick={saveTemplate} className="bg-teal-600 text-white text-sm rounded-lg px-4 py-1.5 hover:bg-teal-700">Save</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="border border-gray-200 rounded-xl bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="font-semibold text-slate-700">{t.icon} {t.name}</div>
              <button onClick={() => deleteTemplate(t.id)} className="text-slate-400 hover:text-red-500 p-1">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="mt-2 space-y-0.5">
              {t.activities.map((act, i) => (
                <div key={i} className="text-sm text-slate-600">
                  <span className="font-mono text-slate-400 mr-2">{act.time}</span>{act.description}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── New Tour Modal ───────────────────────────────────────────────────────────

interface DayDraft {
  date: string
  activities: ActivityItem[]
}

function NewTourModal({ onClose, existingClients = [] }: { onClose: () => void; existingClients?: string[] }) {
  const qc = useQueryClient()
  const [clientName, setClientName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [pax, setPax] = useState(2)
  const [notes, setNotes] = useState('')
  const [days, setDays] = useState<DayDraft[]>([{ date: '', activities: [{ time: '', description: '', type: 'stop' }] }])
  const [saving, setSaving] = useState(false)
  const [showLibrary, setShowLibrary] = useState<number | null>(null)

  const { data: templates = [] } = useQuery<ActivityTemplate[]>({
    queryKey: ['hms_activity_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hms_activity_templates').select('*').order('created_at')
      if (error) throw error
      return (data ?? []).map(t => ({ ...t, activities: typeof t.activities === 'string' ? JSON.parse(t.activities) : t.activities }))
    },
  })

  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ['hms_hotels_names'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hms_hotels').select('id, name, city').order('name')
      if (error) throw error
      return data ?? []
    },
  })

  // Fetch this client's confirmed hotel names to prioritise in transfer dropdowns
  const { data: clientBookings = [] } = useQuery({
    queryKey: ['hms_bookings_client', clientName],
    queryFn: async () => {
      if (!clientName.trim()) return []
      const { data } = await supabase
        .from('hms_bookings')
        .select('hms_hotels(name, city)')
        .ilike('client_name', clientName.trim())
        .in('status', ['Confirmed', 'Paid'])
      return data ?? []
    },
    enabled: !!clientName.trim(),
  })

  const confirmedHotelNames: string[] = Array.from(new Set(
    clientBookings.map((b: any) => b.hms_hotels?.name).filter(Boolean)
  ))

  // Fetch existing tours for client autocomplete
  const { data: toursForClients = [] } = useQuery<Tour[]>({
    queryKey: ['hms_tours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hms_tours')
        .select('id, client_name, pax, notes, created_at, hms_tour_days(id, tour_id, date, sort_order, hms_tour_activities(id, day_id, time, description, sort_order))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const clientNames = Array.from(
    new Map(toursForClients.map(t => [normalizeClientKey(t.client_name), t.client_name])).values()
  ).sort((a, b) => a.localeCompare(b))

  // Confirmed hotels first, then all hotels (deduped)
  const allHotelNames = hotels.map(h => h.city ? `${h.name}, ${h.city}` : h.name)
  const hotelOptions = [
    ...confirmedHotelNames,
    ...allHotelNames.filter(n => !confirmedHotelNames.some(c => n.startsWith(c))),
  ]

  function addDay() {
    setDays(d => [...d, { date: '', activities: [{ time: '', description: '', type: 'stop' }] }])
  }

  function removeDay(i: number) {
    setDays(d => d.filter((_, j) => j !== i))
  }

  function setDayDate(i: number, date: string) {
    setDays(d => d.map((x, j) => j === i ? { ...x, date } : x))
  }

  function setActivity(dayIdx: number, actIdx: number, field: keyof ActivityItem, value: string) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day,
      activities: day.activities.map((a, k) => k !== actIdx ? a : { ...a, [field]: value }),
    }))
  }

  function toggleActivityType(dayIdx: number, actIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day,
      activities: day.activities.map((a, k) => k !== actIdx ? a : {
        ...a,
        type: a.type === 'transfer' ? 'stop' : 'transfer',
        description: '',
        from: '',
        to: '',
      }),
    }))
  }

  function addActivity(dayIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: '', type: 'stop' as const }],
    }))
  }

  function removeActivity(dayIdx: number, actIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: day.activities.filter((_, k) => k !== actIdx),
    }))
  }

  function applyTemplate(dayIdx: number, template: ActivityTemplate) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: template.activities.map(a => ({ ...a, type: 'stop' as const })),
    }))
    setShowLibrary(null)
  }

  async function save() {
    if (!clientName.trim()) return toast.error('Client name required')
    setSaving(true)
    try {
      const contactLine = (contactName.trim() || contactPhone.trim())
        ? encodeContact(contactName, contactPhone) + '\n'
        : ''
      const fullNotes = contactLine + (notes.trim() || '')
      const { data: tour, error: tErr } = await supabase
        .from('hms_tours')
        .insert({ client_name: clientName.trim(), pax, notes: fullNotes || null })
        .select()
        .single()
      if (tErr) throw tErr

      for (let i = 0; i < days.length; i++) {
        const day = days[i]
        const { data: dayRow, error: dErr } = await supabase
          .from('hms_tour_days')
          .insert({ tour_id: tour.id, date: day.date || null, sort_order: i })
          .select()
          .single()
        if (dErr) throw dErr

        // Convert UI state to DB description strings
        const acts = day.activities.filter(a => {
          if (a.type === 'transfer') return (a.from || '').trim() || (a.to || '').trim()
          return a.description.trim()
        })

        if (acts.length) {
          const { error: aErr } = await supabase.from('hms_tour_activities').insert(
            acts.map((a, k) => ({
              day_id: dayRow.id,
              time: a.time,
              description: a.type === 'transfer'
                ? encodeTransfer(a.from ?? '', a.to ?? '', a.flight)
                : a.description,
              sort_order: k,
            }))
          )
          if (aErr) throw aErr
        }
      }

      qc.invalidateQueries({ queryKey: ['hms_tours'] })
      toast.success('Tour created')
      onClose()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">New Tour Itinerary</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Client info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Client Name</label>
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className={inp}
                placeholder="e.g. Ahmed & Sara"
                list="client-names-list"
              />
              <datalist id="client-names-list">
                {clientNames.map(name => <option key={name} value={name} />)}
              </datalist>
              {confirmedHotelNames.length > 0 && (
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-slate-400">Confirmed hotels:</span>
                  {confirmedHotelNames.map(h => (
                    <span key={h} className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 rounded px-1.5 py-0.5">{h}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pax</label>
              <input type="number" min={1} value={pax} onChange={e => setPax(Number(e.target.value))} className={inp} />
            </div>
          </div>

          {/* Contact details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} className={inp} placeholder="e.g. Ahmed Mohamed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact phone</label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={inp} placeholder="+20 100 000 0000" />
            </div>
          </div>

          {/* Days */}
          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-teal-700">🌴 Day {dayIdx + 1}</span>
                  <input
                    type="date"
                    value={day.date}
                    onChange={e => setDayDate(dayIdx, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLibrary(showLibrary === dayIdx ? null : dayIdx)}
                    className="flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2 py-1 text-slate-600 hover:bg-gray-50"
                  >
                    <BookOpen size={12} /> Template
                  </button>
                  {days.length > 1 && (
                    <button onClick={() => removeDay(dayIdx)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Template picker */}
              {showLibrary === dayIdx && (
                <div className="bg-gray-50 rounded-lg p-2 space-y-1 border border-gray-200">
                  <div className="text-xs text-slate-500 px-1 mb-1">Pick a template</div>
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(dayIdx, t)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-700"
                    >
                      {t.icon} {t.name}
                      <span className="text-xs text-slate-400 ml-2">({t.activities.length} stops)</span>
                    </button>
                  ))}
                  {!templates.length && <div className="text-xs text-slate-400 px-2">No templates yet — add them in Activity Library</div>}
                </div>
              )}

              {/* Activities */}
              <div className="space-y-2">
                {day.activities.map((act, actIdx) => (
                  <div key={actIdx} className="flex gap-2 items-start">
                    {/* Type toggle */}
                    <button
                      type="button"
                      onClick={() => toggleActivityType(dayIdx, actIdx)}
                      title={act.type === 'transfer' ? 'Switch to stop' : 'Switch to transfer'}
                      className={`flex-shrink-0 mt-0.5 flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                        act.type === 'transfer'
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-teal-50 border-teal-200 text-teal-700'
                      }`}
                    >
                      {act.type === 'transfer' ? <><Car size={11} /> Transfer</> : <>🏖 Stop</>}
                    </button>

                    {/* Time field (always) */}
                    <input
                      value={act.time}
                      onChange={e => setActivity(dayIdx, actIdx, 'time', e.target.value)}
                      className={`${inp} w-24 flex-shrink-0`}
                      placeholder="09:00"
                    />

                    {act.type === 'transfer' ? (
                      <div className="flex-1 space-y-1.5">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              value={act.from ?? ''}
                              onChange={e => setActivity(dayIdx, actIdx, 'from', e.target.value)}
                              className={inp}
                              placeholder="From"
                              list={`hotels-from-${dayIdx}-${actIdx}`}
                            />
                            <datalist id={`hotels-from-${dayIdx}-${actIdx}`}>
                              {hotelOptions.map(h => <option key={h} value={h} />)}
                            </datalist>
                          </div>
                          <div className="flex items-center text-slate-400 flex-shrink-0 mt-2">→</div>
                          <div className="flex-1">
                            <input
                              value={act.to ?? ''}
                              onChange={e => setActivity(dayIdx, actIdx, 'to', e.target.value)}
                              className={inp}
                              placeholder="To"
                              list={`hotels-to-${dayIdx}-${actIdx}`}
                            />
                            <datalist id={`hotels-to-${dayIdx}-${actIdx}`}>
                              {hotelOptions.map(h => <option key={h} value={h} />)}
                            </datalist>
                          </div>
                        </div>
                        <input
                          value={act.flight ?? ''}
                          onChange={e => setActivity(dayIdx, actIdx, 'flight', e.target.value)}
                          className={inp}
                          placeholder="✈️ Flight number (optional, e.g. MS985)"
                        />
                      </div>
                    ) : (
                      /* Stop: description field */
                      <input
                        value={act.description}
                        onChange={e => setActivity(dayIdx, actIdx, 'description', e.target.value)}
                        className={inp}
                        placeholder="Activity / hotel check-in…"
                      />
                    )}

                    <button onClick={() => removeActivity(dayIdx, actIdx)} className="text-slate-300 hover:text-red-400 flex-shrink-0 mt-1.5">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addActivity(dayIdx)} className="text-xs text-teal-600 hover:underline">
                  + Add stop
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addDay}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
          >
            + Add Day
          </button>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className={`${inp} resize-none`}
              placeholder="Any extra notes appended at the bottom of the WhatsApp message…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 hover:text-slate-700">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-teal-600 text-white text-sm rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create Tour'}
          </button>
        </div>
      </div>
    </div>
  )
}
