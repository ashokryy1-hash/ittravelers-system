import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, BookOpen, X, Check, Users, List, ChevronRight, Car, PlaneLanding, PlaneTakeoff, Search, Pencil, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import type { Tour as ExplorerTour } from '../../types'

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType = 'stop' | 'transfer' | 'airport-pickup' | 'airport-dropoff'

interface ActivityItem {
  time: string
  description: string
  type: ActivityType
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

interface ReservationClient {
  name: string
  confirmedHotels: string[]
  totalBookings: number
}

// ─── Encoding helpers ─────────────────────────────────────────────────────────

const SEP = '|||'

function encode(type: ActivityType, data: Record<string, string>): string {
  return `__${type}__:` + Object.values(data).join(SEP)
}

function parseActivity(description: string): { type: ActivityType; from: string; to: string; flight: string; text: string } {
  const match = description.match(/^__([a-z-]+)__:(.*)$/)
  if (match) {
    const type = match[1] as ActivityType
    const parts = match[2].split(SEP)
    if (type === 'transfer') return { type, from: parts[0] ?? '', to: parts[1] ?? '', flight: parts[2] ?? '', text: '' }
    if (type === 'airport-pickup') return { type, from: '', to: parts[0] ?? '', flight: parts[1] ?? '', text: '' }
    if (type === 'airport-dropoff') return { type, from: parts[0] ?? '', to: '', flight: parts[1] ?? '', text: '' }
  }
  return { type: 'stop', from: '', to: '', flight: '', text: description }
}

// Contact stored in tour notes with prefix
const CONTACT_PREFIX = '__contact__:'
function encodeContact(name: string, phone: string): string {
  return `${CONTACT_PREFIX}${name.trim()}${SEP}${phone.trim()}`
}
function parseContact(notes: string | null): { contactName: string; contactPhone: string; cleanNotes: string } {
  if (!notes) return { contactName: '', contactPhone: '', cleanNotes: '' }
  const lines = notes.split('\n')
  const cl = lines.find(l => l.startsWith(CONTACT_PREFIX))
  if (!cl) return { contactName: '', contactPhone: '', cleanNotes: notes }
  const rest = cl.slice(CONTACT_PREFIX.length)
  const idx = rest.indexOf(SEP)
  return {
    contactName: idx !== -1 ? rest.slice(0, idx) : rest,
    contactPhone: idx !== -1 ? rest.slice(idx + SEP.length) : '',
    cleanNotes: lines.filter(l => !l.startsWith(CONTACT_PREFIX)).join('\n').trim(),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDay(dateStr: string | null, dayNum: number) {
  if (!dateStr) return `Day ${dayNum}`
  try { return format(parseISO(dateStr), 'd MMM yyyy') } catch { return `Day ${dayNum}` }
}

function buildWhatsApp(tour: Tour): string {
  const days = [...(tour.hms_tour_days ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const { contactName, contactPhone, cleanNotes } = parseContact(tour.notes)
  const lines: string[] = ['🌼🌼', tour.client_name, `${tour.pax} pax`]
  if (contactName) lines.push(`📞 ${contactName}${contactPhone ? ` — ${contactPhone}` : ''}`)
  for (const day of days) {
    lines.push('', `🌴 ${formatDay(day.date, day.sort_order + 1)}`)
    const acts = [...(day.hms_tour_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    const stops = acts.filter(a => parseActivity(a.description).type === 'stop')
    const transfers = acts.filter(a => parseActivity(a.description).type !== 'stop')
    // Tour stops — no time, bullet list
    for (const act of stops) {
      const p = parseActivity(act.description)
      if (p.text.trim()) lines.push(`• ${p.text}`)
    }
    // Transfers — with time
    if (transfers.length > 0) {
      if (stops.length > 0) lines.push('')
      for (const act of transfers) {
        const p = parseActivity(act.description)
        if (p.type === 'transfer') {
          lines.push(`${act.time} 🚗 Transfer: ${p.from} → ${p.to}${p.flight ? ` (Flight: ${p.flight})` : ''}`)
        } else if (p.type === 'airport-pickup') {
          lines.push(`${act.time} ✈️ Airport Pickup: Flight ${p.flight} → ${p.to}`)
        } else if (p.type === 'airport-dropoff') {
          lines.push(`${act.time} 🛫 Airport Drop-off: ${p.from} → Flight ${p.flight}`)
        }
      }
    }
    lines.push('End of program')
  }
  if (cleanNotes) lines.push('', cleanNotes)
  return lines.join('\n')
}

function normalizeClientKey(name: string): string {
  return name.trim().toLowerCase()
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400'
const inpSm = 'w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400'

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
            className="flex items-center gap-2 bg-terracotta-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-terracotta-700"
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
              tab === t ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-slate-500 hover:text-slate-700'
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
              <div className="w-9 h-9 rounded-full bg-terracotta-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
  const [editing, setEditing] = useState(false)

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
    <>
    {editing && <EditTourModal tour={tour} onClose={() => setEditing(false)} />}
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
        <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-terracotta-600 transition-colors p-1" title="Edit tour">
          <Pencil size={15} />
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
                <div className="text-xs font-bold text-terracotta-700 uppercase tracking-wide mb-1">
                  🌴 {formatDay(day.date, i + 1)}
                </div>
                <div className="space-y-2 pl-2">
                  {(() => {
                    const stops = acts.filter(a => parseActivity(a.description).type === 'stop')
                    const transfers = acts.filter(a => parseActivity(a.description).type !== 'stop')
                    return (
                      <>
                        {stops.length > 0 && (
                          <div>
                            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">🏖 Tour Activities</div>
                            <div className="space-y-0.5">
                              {stops.map(act => {
                                const p = parseActivity(act.description)
                                return (
                                  <div key={act.id} className="flex items-start gap-1.5 text-sm text-slate-700">
                                    <span className="text-slate-400 mt-px">•</span>
                                    <span>{p.text}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {transfers.length > 0 && (
                          <div>
                            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">🚗 Transfers</div>
                            <div className="space-y-0.5">
                              {transfers.map(act => {
                                const p = parseActivity(act.description)
                                if (p.type === 'transfer') return (
                                  <div key={act.id} className="flex items-center gap-1.5 text-sm text-slate-600 flex-wrap">
                                    <span className="font-mono text-slate-400 text-xs">{act.time}</span>
                                    <Car size={12} className="text-slate-400" />
                                    <span>{p.from} → {p.to}</span>
                                    {p.flight && <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">✈ {p.flight}</span>}
                                  </div>
                                )
                                if (p.type === 'airport-pickup') return (
                                  <div key={act.id} className="flex items-center gap-1.5 text-sm text-blue-700 flex-wrap">
                                    <span className="font-mono text-slate-400 text-xs">{act.time}</span>
                                    <PlaneLanding size={13} className="text-blue-500" />
                                    <span>Airport Pickup → {p.to}</span>
                                    {p.flight && <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded px-1.5 py-0.5 font-medium">{p.flight}</span>}
                                  </div>
                                )
                                if (p.type === 'airport-dropoff') return (
                                  <div key={act.id} className="flex items-center gap-1.5 text-sm text-purple-700 flex-wrap">
                                    <span className="font-mono text-slate-400 text-xs">{act.time}</span>
                                    <PlaneTakeoff size={13} className="text-purple-500" />
                                    <span>Airport Drop-off from {p.from}</span>
                                    {p.flight && <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded px-1.5 py-0.5 font-medium">{p.flight}</span>}
                                  </div>
                                )
                                return null
                              })}
                            </div>
                          </div>
                        )}
                        {!acts.length && <div className="text-xs text-slate-400">No activities</div>}
                      </>
                    )
                  })()}
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
    </>
  )
}

// ─── Activity Library Tab ─────────────────────────────────────────────────────

function LibraryTab() {
  const [libTab, setLibTab] = useState<'templates' | 'explorer'>('templates')

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        <button
          onClick={() => setLibTab('templates')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            libTab === 'templates' ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={14} /> Templates
        </button>
        <button
          onClick={() => setLibTab('explorer')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            libTab === 'explorer' ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe size={14} /> Explorer Tours
        </button>
      </div>

      {libTab === 'templates' && <TemplatesTab />}
      {libTab === 'explorer' && <ExplorerToursTab />}
    </div>
  )
}

function TemplatesTab() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🌴')
  const [newActivities, setNewActivities] = useState<ActivityItem[]>([{ time: '', description: '' }])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editActivities, setEditActivities] = useState<ActivityItem[]>([])

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

  function startEdit(t: ActivityTemplate) {
    setEditingId(t.id)
    setEditName(t.name)
    setEditIcon(t.icon)
    setEditActivities(t.activities.map(a => ({ ...a })))
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return toast.error('Name required')
    const acts = editActivities.filter(a => a.description.trim())
    const { error } = await supabase
      .from('hms_activity_templates')
      .update({ name: editName.trim(), icon: editIcon, activities: acts })
      .eq('id', id)
    if (error) return toast.error(error.message)
    qc.invalidateQueries({ queryKey: ['hms_activity_templates'] })
    setEditingId(null)
    toast.success('Template updated')
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
          className="flex items-center gap-2 border border-terracotta-600 text-terracotta-600 rounded-lg px-3 py-1.5 text-sm hover:bg-terracotta-50"
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
              className="text-xs text-terracotta-600 hover:underline"
            >
              + Add activity
            </button>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="text-sm text-slate-500 px-3 py-1.5">Cancel</button>
            <button onClick={saveTemplate} className="bg-terracotta-600 text-white text-sm rounded-lg px-4 py-1.5 hover:bg-terracotta-700">Save</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="border border-gray-200 rounded-xl bg-white p-4">
            {editingId === t.id ? (
              /* ── Edit mode ── */
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={editIcon} onChange={e => setEditIcon(e.target.value)} className={`${inp} w-16 text-center`} />
                  <input value={editName} onChange={e => setEditName(e.target.value)} className={inp} placeholder="Template name" />
                </div>
                <div className="space-y-2">
                  {editActivities.map((act, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={act.time}
                        onChange={e => setEditActivities(a => a.map((x, j) => j === i ? { ...x, time: e.target.value } : x))}
                        className={`${inp} w-24`}
                        placeholder="09:00"
                      />
                      <input
                        value={act.description}
                        onChange={e => setEditActivities(a => a.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                        className={inp}
                        placeholder="Activity description"
                      />
                      <button onClick={() => setEditActivities(a => a.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditActivities(a => [...a, { time: '', description: '' }])}
                    className="text-xs text-terracotta-600 hover:underline"
                  >
                    + Add activity
                  </button>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className="text-sm text-slate-500 px-3 py-1.5">Cancel</button>
                  <button onClick={() => saveEdit(t.id)} className="bg-terracotta-600 text-white text-sm rounded-lg px-4 py-1.5 hover:bg-terracotta-700">Save</button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <>
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-slate-700">{t.icon} {t.name}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(t)} className="text-slate-400 hover:text-terracotta-600 p-1" title="Edit template">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="text-slate-400 hover:text-red-500 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-0.5">
                  {t.activities.map((act, i) => (
                    <div key={i} className="text-sm text-slate-600">
                      <span className="font-mono text-slate-400 mr-2">{act.time}</span>{act.description}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Explorer Tours Tab ───────────────────────────────────────────────────────

interface ExplorerTourWithCities extends ExplorerTour {
  cities: { name: string; destination: string }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Romantic:    'bg-dusty-rose-100 text-dusty-rose-500 border-dusty-rose-200',
  Adventure:   'bg-terracotta-100 text-terracotta-600 border-terracotta-200',
  Cultural:    'bg-amber-50 text-amber-700 border-amber-200',
  Nature:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Water:       'bg-sky-50 text-sky-700 border-sky-200',
  Nightlife:   'bg-purple-50 text-purple-700 border-purple-200',
  'Beach Club':'bg-cyan-50 text-cyan-700 border-cyan-200',
}

const CATEGORY_PHOTOS: Record<string, string> = {
  Romantic:    'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=600&q=80',
  Adventure:   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  Cultural:    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80',
  Nature:      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80',
  Water:       'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  Nightlife:   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
  'Beach Club':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
}

const ALL_CATEGORIES = ['All', 'Romantic', 'Adventure', 'Cultural', 'Nature', 'Water', 'Nightlife', 'Beach Club']

function useExplorerTours() {
  return useQuery<ExplorerTourWithCities[]>({
    queryKey: ['explorer_tours_hms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorer_tours')
        .select(`*, tour_cities(cities(name, destinations(name)))`)
        .order('sort_order')
      if (error) throw error
      return (data ?? []).map((t: any) => ({
        ...t,
        cities: (t.tour_cities ?? []).map((tc: any) => ({
          name: tc.cities?.name ?? '',
          destination: tc.cities?.destinations?.name ?? '',
        })).filter((c: any) => c.name),
      }))
    },
  })
}

function ExplorerToursTab() {
  const [city, setCity] = useState('All')
  const [category, setCategory] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: tours = [], isLoading } = useExplorerTours()

  // Derive unique cities from data
  const allCities = useMemo(() => {
    const set = new Set<string>()
    tours.forEach(t => t.cities.forEach(c => set.add(c.name)))
    return ['All', ...Array.from(set).sort()]
  }, [tours])

  const filtered = tours.filter(t => {
    const matchCity = city === 'All' || t.cities.some(c => c.name === city)
    const matchCat = category === 'All' || t.category === category
    return matchCity && matchCat
  })

  if (isLoading) return <p className="text-sm text-slate-400">Loading tours…</p>

  return (
    <div>
      {/* City tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto pb-px">
        {allCities.map(c => (
          <button
            key={c}
            onClick={() => { setCity(c); setCategory('All') }}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              city === c ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              category === cat
                ? 'bg-terracotta-600 text-white border-terracotta-600'
                : 'bg-white text-slate-500 border-gray-300 hover:border-terracotta-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-10">No tours match your filter.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(tour => {
                const expanded = expandedId === tour.id
                const photo = tour.cover_image_url || CATEGORY_PHOTOS[tour.category]
                const tiktokLinks = [tour.tiktok_1, tour.tiktok_2, tour.tiktok_3, tour.tiktok_4].filter(Boolean)
                const hasDetails = (tour.inclusions?.length > 0) || (tour.exclusions?.length > 0)
                const cityNames = tour.cities.map(c => c.name).join(', ')

                return (
                  <div key={tour.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                    {/* Cover */}
                    <div className="relative h-36 w-full overflow-hidden">
                      <img src={photo} alt={tour.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <span className={`absolute top-2 left-2 text-xs font-medium px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[tour.category] ?? 'bg-ivory-100 text-slate-500 border-ivory-200'}`}>
                        {tour.category}
                      </span>
                      {cityNames && (
                        <span className="absolute bottom-2 left-3 text-xs text-white/80 font-medium">{cityNames}</span>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="font-semibold text-slate-800 text-sm">{tour.name}</p>
                      {tour.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tour.description}</p>
                      )}

                      {/* TikTok links */}
                      {tiktokLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tiktokLinks.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full hover:bg-slate-50 transition-colors"
                            >
                              TikTok {tiktokLinks.length > 1 ? i + 1 : ''}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Tour link */}
                      {tour.tour_link_url && (
                        <a
                          href={tour.tour_link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-terracotta-600 hover:underline"
                        >
                          View tour page →
                        </a>
                      )}

                      {/* Inclusions / Exclusions toggle */}
                      {hasDetails && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : tour.id)}
                          className="mt-2 flex items-center gap-1 text-xs text-terracotta-600 hover:text-terracotta-700 font-medium"
                        >
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {expanded ? 'Hide details' : 'Show inclusions / exclusions'}
                        </button>
                      )}

                      {expanded && (
                        <div className="mt-3 space-y-2">
                          {tour.inclusions?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Included</p>
                              {tour.inclusions.map((item, i) => (
                                <div key={i} className="flex items-start gap-1.5 mb-0.5">
                                  <Check size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-slate-600">{item}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {tour.exclusions?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Not Included</p>
                              {tour.exclusions.map((item, i) => (
                                <div key={i} className="flex items-start gap-1.5 mb-0.5">
                                  <X size={11} className="text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-slate-600">{item}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
        })}
      </div>
    </div>
  )
}

// ─── Day Library Picker (Templates + Explorer Tours) ──────────────────────────

function DayLibraryPicker({
  templates,
  onApplyTemplate,
  onAddTour,
}: {
  templates: ActivityTemplate[]
  onApplyTemplate: (t: ActivityTemplate) => void
  onAddTour: (name: string) => void
}) {
  const [pickerTab, setPickerTab] = useState<'templates' | 'tours'>('templates')
  const [tourCity, setTourCity] = useState('All')
  const { data: explorerTours = [] } = useExplorerTours()

  const allCities = useMemo(() => {
    const set = new Set<string>()
    explorerTours.forEach(t => t.cities.forEach(c => set.add(c.name)))
    return ['All', ...Array.from(set).sort()]
  }, [explorerTours])

  const visibleTours = tourCity === 'All'
    ? explorerTours
    : explorerTours.filter(t => t.cities.some(c => c.name === tourCity))

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Picker sub-tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setPickerTab('templates')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 font-medium transition-colors ${
            pickerTab === 'templates' ? 'bg-white text-terracotta-600 border-b-2 border-terracotta-500 -mb-px' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={12} /> Templates
        </button>
        <button
          onClick={() => setPickerTab('tours')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 font-medium transition-colors ${
            pickerTab === 'tours' ? 'bg-white text-terracotta-600 border-b-2 border-terracotta-500 -mb-px' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe size={12} /> Explorer Tours
        </button>
      </div>

      <div className="p-2 max-h-64 overflow-y-auto space-y-1">
        {pickerTab === 'templates' && (
          <>
            {templates.map(t => (
              <button key={t.id} onClick={() => onApplyTemplate(t)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-700">
                {t.icon} {t.name} <span className="text-xs text-slate-400 ml-1">({t.activities.length} stops)</span>
              </button>
            ))}
            {!templates.length && <div className="text-xs text-slate-400 px-2 py-1">No templates yet</div>}
          </>
        )}

        {pickerTab === 'tours' && (
          <>
            {/* City tabs */}
            <div className="flex gap-1 flex-wrap pb-1 mb-1 border-b border-gray-200">
              {allCities.map(c => (
                <button
                  key={c}
                  onClick={() => setTourCity(c)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    tourCity === c ? 'bg-terracotta-600 text-white border-terracotta-600' : 'bg-white text-slate-500 border-gray-200 hover:border-terracotta-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {visibleTours.map(t => (
              <button key={t.id} onClick={() => onAddTour(t.name)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-700 flex items-center justify-between">
                <span>{t.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[t.category] ?? ''}`}>{t.category}</span>
              </button>
            ))}
            {!visibleTours.length && <div className="text-xs text-slate-400 px-2 py-1">No tours for this city</div>}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Edit Tour Modal ──────────────────────────────────────────────────────────

function EditTourModal({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const qc = useQueryClient()

  const { contactName: initCN, contactPhone: initCP, cleanNotes: initNotes } = parseContact(tour.notes)

  const sortedDays = [...(tour.hms_tour_days ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  const [clientName, setClientName] = useState(tour.client_name)
  const [pax, setPax] = useState(tour.pax)
  const [contactName, setContactName] = useState(initCN)
  const [contactPhone, setContactPhone] = useState(initCP)
  const [notes, setNotes] = useState(initNotes)
  const [days, setDays] = useState<DayDraft[]>(() =>
    sortedDays.map(day => ({
      date: day.date ?? '',
      activities: [...(day.hms_tour_activities ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(act => {
          const p = parseActivity(act.description)
          return { time: act.time, description: p.text, type: p.type, from: p.from, to: p.to, flight: p.flight }
        }),
    }))
  )
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

  const { data: clientBookings = [] } = useQuery({
    queryKey: ['hms_bookings_client_edit', clientName],
    queryFn: async () => {
      if (!clientName.trim()) return []
      const { data } = await supabase
        .from('hms_bookings')
        .select('hms_hotels(name)')
        .ilike('client_name', clientName.trim())
        .in('status', ['Confirmed', 'Paid'])
      return data ?? []
    },
    enabled: !!clientName.trim(),
  })

  const confirmedHotels: string[] = Array.from(new Set(
    clientBookings.map((b: any) => b.hms_hotels?.name).filter(Boolean)
  ))
  const allHotelNames = hotels.map(h => h.city ? `${h.name}, ${h.city}` : h.name)
  const hotelOptions = [...confirmedHotels, ...allHotelNames.filter(n => !confirmedHotels.some(c => n.startsWith(c)))]

  function setActivity(dayIdx: number, actIdx: number, field: keyof ActivityItem, value: string) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: day.activities.map((a, k) => k !== actIdx ? a : { ...a, [field]: value }),
    }))
  }

  function cycleActivityType(dayIdx: number, actIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: day.activities.map((a, k) => k !== actIdx ? a : {
        ...a,
        type: ACTIVITY_TYPES[(ACTIVITY_TYPES.indexOf(a.type) + 1) % ACTIVITY_TYPES.length],
        description: '', from: '', to: '', flight: '',
      }),
    }))
  }

  function addActivity(dayIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: '', type: 'stop' as const }],
    }))
  }

  function addTransfer(dayIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: '', type: 'transfer' as const, from: '', to: '', flight: '' }],
    }))
  }

  function removeActivity(dayIdx: number, actIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: day.activities.filter((_, k) => k !== actIdx),
    }))
  }

  function addDay() {
    setDays(d => [...d, { date: '', activities: [{ time: '', description: '', type: 'stop' }] }])
  }

  function removeDay(i: number) {
    setDays(d => d.filter((_, j) => j !== i))
  }

  function setDayDate(i: number, date: string) {
    setDays(d => d.map((x, j) => j === i ? { ...x, date } : x))
  }

  function applyTemplate(dayIdx: number, template: ActivityTemplate) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: template.activities.map(a => ({ ...a, type: 'stop' as const })),
    }))
    setShowLibrary(null)
  }

  function addExplorerTour(dayIdx: number, tourName: string) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: tourName, type: 'stop' as const }],
    }))
    setShowLibrary(null)
  }

  async function save() {
    if (!clientName.trim()) return toast.error('Client name required')
    setSaving(true)
    try {
      const contactLine = (contactName.trim() || contactPhone.trim())
        ? encodeContact(contactName, contactPhone) + '\n' : ''
      const fullNotes = contactLine + (notes.trim() || '')

      const { error: tErr } = await supabase
        .from('hms_tours')
        .update({ client_name: clientName.trim(), pax, notes: fullNotes || null })
        .eq('id', tour.id)
      if (tErr) throw tErr

      // Delete existing days (cascade deletes activities)
      await supabase.from('hms_tour_days').delete().eq('tour_id', tour.id)

      for (let i = 0; i < days.length; i++) {
        const day = days[i]
        const { data: dayRow, error: dErr } = await supabase
          .from('hms_tour_days')
          .insert({ tour_id: tour.id, date: day.date || null, sort_order: i })
          .select().single()
        if (dErr) throw dErr

        const acts = day.activities.filter(a => {
          if (a.type === 'transfer') return (a.from || '').trim() || (a.to || '').trim()
          if (a.type === 'airport-pickup') return (a.to || '').trim()
          if (a.type === 'airport-dropoff') return (a.from || '').trim()
          return a.description.trim()
        })

        if (acts.length) {
          const { error: aErr } = await supabase.from('hms_tour_activities').insert(
            acts.map((a, k) => {
              let description = a.description
              if (a.type === 'transfer') description = encode('transfer', { from: a.from ?? '', to: a.to ?? '', flight: a.flight ?? '' })
              else if (a.type === 'airport-pickup') description = encode('airport-pickup', { to: a.to ?? '', flight: a.flight ?? '' })
              else if (a.type === 'airport-dropoff') description = encode('airport-dropoff', { from: a.from ?? '', flight: a.flight ?? '' })
              return { day_id: dayRow.id, time: a.time, description, sort_order: k }
            })
          )
          if (aErr) throw aErr
        }
      }

      qc.invalidateQueries({ queryKey: ['hms_tours'] })
      toast.success('Tour updated')
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
          <h2 className="text-lg font-bold text-slate-800">Edit Tour — {tour.client_name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Client + Pax */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Client Name</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pax</label>
              <input type="number" min={1} value={pax} onChange={e => setPax(Number(e.target.value))} className={inp} />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} className={inp} placeholder="Ahmed Mohamed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact phone</label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={inp} placeholder="+20 100…" />
            </div>
          </div>

          {/* Confirmed hotel chips */}
          {confirmedHotels.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[10px] text-slate-400">Confirmed hotels:</span>
              {confirmedHotels.map(h => (
                <span key={h} className="text-[10px] bg-terracotta-100 text-terracotta-700 border border-terracotta-200 rounded px-1.5 py-0.5 font-medium">{h}</span>
              ))}
            </div>
          )}

          {/* Days */}
          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-terracotta-700">🌴 Day {dayIdx + 1}</span>
                  <input
                    type="date"
                    value={day.date}
                    onChange={e => setDayDate(dayIdx, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
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

              {showLibrary === dayIdx && (
                <DayLibraryPicker
                  templates={templates}
                  onApplyTemplate={t => applyTemplate(dayIdx, t)}
                  onAddTour={name => addExplorerTour(dayIdx, name)}
                />
              )}

              <div className="space-y-4">
                {/* ── Tour Activities ── */}
                <div>
                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-2">🏖 Tour Activities</div>
                  <div className="space-y-2">
                    {day.activities.map((act, actIdx) => act.type !== 'stop' ? null : (
                      <div key={actIdx} className="flex gap-2 items-center">
                        <input value={act.description} onChange={e => setActivity(dayIdx, actIdx, 'description', e.target.value)}
                          className={inp} placeholder="Activity or stop description…" />
                        <button onClick={() => removeActivity(dayIdx, actIdx)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addActivity(dayIdx)} className="text-xs text-terracotta-600 hover:underline">+ Add activity</button>
                  </div>
                </div>

                {/* ── Transfers ── */}
                <div>
                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-2">🚗 Transfers</div>
                  <div className="space-y-3">
                    {day.activities.map((act, actIdx) => {
                      if (act.type === 'stop') return null
                      const cfg = TYPE_CONFIG[act.type]
                      return (
                        <div key={actIdx} className="space-y-1.5">
                          <div className="flex gap-2 items-center">
                            <button type="button" onClick={() => cycleActivityType(dayIdx, actIdx)}
                              className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors ${cfg.bg}`}>
                              {cfg.label}
                            </button>
                            <input value={act.time} onChange={e => setActivity(dayIdx, actIdx, 'time', e.target.value)}
                              className={`${inp} w-24 flex-shrink-0`} placeholder="09:00" />
                            <button onClick={() => removeActivity(dayIdx, actIdx)} className="text-slate-300 hover:text-red-400 flex-shrink-0 ml-auto">
                              <X size={14} />
                            </button>
                          </div>

                          {act.type === 'transfer' && (
                            <div className="space-y-1.5 pl-1">
                              <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                  <input value={act.from ?? ''} onChange={e => setActivity(dayIdx, actIdx, 'from', e.target.value)}
                                    className={inp} placeholder="From" list={`e-from-${dayIdx}-${actIdx}`} />
                                  <datalist id={`e-from-${dayIdx}-${actIdx}`}>{hotelOptions.map(h => <option key={h} value={h} />)}</datalist>
                                </div>
                                <span className="text-slate-400 text-xs flex-shrink-0">→</span>
                                <div className="flex-1">
                                  <input value={act.to ?? ''} onChange={e => setActivity(dayIdx, actIdx, 'to', e.target.value)}
                                    className={inp} placeholder="To" list={`e-to-${dayIdx}-${actIdx}`} />
                                  <datalist id={`e-to-${dayIdx}-${actIdx}`}>{hotelOptions.map(h => <option key={h} value={h} />)}</datalist>
                                </div>
                              </div>
                              {confirmedHotels.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {confirmedHotels.map(h => (
                                    <button key={h} type="button" onClick={() => setActivity(dayIdx, actIdx, 'to', h)}
                                      className="text-[10px] bg-slate-100 hover:bg-terracotta-100 text-slate-600 hover:text-terracotta-800 border border-slate-200 rounded px-1.5 py-0.5">→ {h}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {act.type === 'airport-pickup' && (
                            <div className="space-y-1.5 pl-1">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-blue-600 font-medium mb-0.5 block">✈️ Arrival Flight</label>
                                  <input value={act.flight ?? ''} onChange={e => setActivity(dayIdx, actIdx, 'flight', e.target.value)}
                                    className={inp} placeholder="e.g. MS985" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-blue-600 font-medium mb-0.5 block">Drop to hotel</label>
                                  <input value={act.to ?? ''} onChange={e => setActivity(dayIdx, actIdx, 'to', e.target.value)}
                                    className={inp} placeholder="Hotel / destination" list={`e-pickup-to-${dayIdx}-${actIdx}`} />
                                  <datalist id={`e-pickup-to-${dayIdx}-${actIdx}`}>{hotelOptions.map(h => <option key={h} value={h} />)}</datalist>
                                </div>
                              </div>
                              {confirmedHotels.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[10px] text-slate-400 self-center">Quick fill:</span>
                                  {confirmedHotels.map(h => (
                                    <button key={h} type="button" onClick={() => setActivity(dayIdx, actIdx, 'to', h)}
                                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">{h}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {act.type === 'airport-dropoff' && (
                            <div className="space-y-1.5 pl-1">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-purple-600 font-medium mb-0.5 block">Pick up from hotel</label>
                                  <input value={act.from ?? ''} onChange={e => setActivity(dayIdx, actIdx, 'from', e.target.value)}
                                    className={inp} placeholder="Hotel / pickup location" list={`e-dropoff-from-${dayIdx}-${actIdx}`} />
                                  <datalist id={`e-dropoff-from-${dayIdx}-${actIdx}`}>{hotelOptions.map(h => <option key={h} value={h} />)}</datalist>
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-purple-600 font-medium mb-0.5 block">🛫 Departure Flight</label>
                                  <input value={act.flight ?? ''} onChange={e => setActivity(dayIdx, actIdx, 'flight', e.target.value)}
                                    className={inp} placeholder="e.g. MS986" />
                                </div>
                              </div>
                              {confirmedHotels.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[10px] text-slate-400 self-center">Quick fill:</span>
                                  {confirmedHotels.map(h => (
                                    <button key={h} type="button" onClick={() => setActivity(dayIdx, actIdx, 'from', h)}
                                      className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5">{h}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <button onClick={() => addTransfer(dayIdx)} className="text-xs text-slate-500 hover:text-slate-700 hover:underline">+ Add transfer</button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addDay}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-slate-500 hover:border-terracotta-400 hover:text-terracotta-600 transition-colors">
            + Add Day
          </button>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className={`${inp} resize-none`} placeholder="Any extra notes…" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 hover:text-slate-700">Cancel</button>
          <button onClick={save} disabled={saving}
            className="bg-terracotta-600 text-white text-sm rounded-lg px-5 py-2 hover:bg-terracotta-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New Tour Modal ───────────────────────────────────────────────────────────

interface DayDraft {
  date: string
  activities: ActivityItem[]
}

const TYPE_CONFIG = {
  stop:           { label: '🏖 Tour Stop',       bg: 'bg-terracotta-50 border-terracotta-200 text-terracotta-700' },
  transfer:       { label: '🚗 Transfer',         bg: 'bg-slate-100 border-slate-300 text-slate-700' },
  'airport-pickup':  { label: '✈️ Airport Pickup',  bg: 'bg-blue-50 border-blue-300 text-blue-700' },
  'airport-dropoff': { label: '🛫 Airport Drop-off', bg: 'bg-purple-50 border-purple-300 text-purple-700' },
}
const ACTIVITY_TYPES: ActivityType[] = ['stop', 'transfer', 'airport-pickup', 'airport-dropoff']

function NewTourModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [step, setStep] = useState<'pick-client' | 'build'>('pick-client')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ReservationClient | null>(null)
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

  // Fetch reservation clients (hms_bookings grouped by client name)
  const { data: reservationClients = [] } = useQuery<ReservationClient[]>({
    queryKey: ['hms_reservation_clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hms_bookings')
        .select('client_name, status, hms_hotels(name)')
      if (error) throw error
      const map = new Map<string, { displayName: string; hotels: Set<string>; count: number }>()
      for (const b of data ?? []) {
        const key = normalizeClientKey(b.client_name)
        if (!map.has(key)) map.set(key, { displayName: b.client_name, hotels: new Set(), count: 0 })
        const entry = map.get(key)!
        entry.count++
        if ((b.status === 'Confirmed' || b.status === 'Paid') && (b as any).hms_hotels?.name) {
          entry.hotels.add((b as any).hms_hotels.name)
        }
      }
      return Array.from(map.values())
        .map(e => ({ name: e.displayName, confirmedHotels: Array.from(e.hotels), totalBookings: e.count }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
  })

  const confirmedHotels: string[] = selectedClient?.confirmedHotels ?? []
  const allHotelNames = hotels.map(h => h.city ? `${h.name}, ${h.city}` : h.name)
  const hotelOptions = [
    ...confirmedHotels,
    ...allHotelNames.filter(n => !confirmedHotels.some(c => n.startsWith(c))),
  ]

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reservationClients
    return reservationClients.filter(c => c.name.toLowerCase().includes(q))
  }, [reservationClients, search])

  function pickClient(client: ReservationClient) {
    setSelectedClient(client)
    setClientName(client.name)
    setStep('build')
  }

  function pickNewClient() {
    setSelectedClient(null)
    setClientName(search.trim())
    setStep('build')
  }

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

  function cycleActivityType(dayIdx: number, actIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day,
      activities: day.activities.map((a, k) => k !== actIdx ? a : {
        ...a,
        type: ACTIVITY_TYPES[(ACTIVITY_TYPES.indexOf(a.type) + 1) % ACTIVITY_TYPES.length],
        description: '',
        from: '',
        to: '',
        flight: '',
      }),
    }))
  }

  function addActivity(dayIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: '', type: 'stop' as const }],
    }))
  }

  function addTransfer(dayIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: '', type: 'transfer' as const, from: '', to: '', flight: '' }],
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

  function addExplorerTour(dayIdx: number, tourName: string) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: tourName, type: 'stop' as const }],
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

        const acts = day.activities.filter(a => {
          if (a.type === 'transfer') return (a.from || '').trim() || (a.to || '').trim()
          if (a.type === 'airport-pickup') return (a.to || '').trim()
          if (a.type === 'airport-dropoff') return (a.from || '').trim()
          return a.description.trim()
        })

        if (acts.length) {
          const { error: aErr } = await supabase.from('hms_tour_activities').insert(
            acts.map((a, k) => {
              let description = a.description
              if (a.type === 'transfer') description = encode('transfer', { from: a.from ?? '', to: a.to ?? '', flight: a.flight ?? '' })
              else if (a.type === 'airport-pickup') description = encode('airport-pickup', { to: a.to ?? '', flight: a.flight ?? '' })
              else if (a.type === 'airport-dropoff') description = encode('airport-dropoff', { from: a.from ?? '', flight: a.flight ?? '' })
              return { day_id: dayRow.id, time: a.time, description, sort_order: k }
            })
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
          <div className="flex items-center gap-3">
            {step === 'build' && (
              <button onClick={() => setStep('pick-client')} className="text-slate-400 hover:text-slate-600">
                <ChevronRight size={16} className="rotate-180" />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-800">
              {step === 'pick-client' ? 'Select Client' : 'Build Itinerary'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {/* ── Step 1: Client Picker ── */}
        {step === 'pick-client' && (
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`${inp} pl-9`}
                placeholder="Search reservation clients…"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredClients.map(client => (
                <button
                  key={normalizeClientKey(client.name)}
                  onClick={() => pickClient(client)}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-terracotta-400 hover:bg-terracotta-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-terracotta-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {client.name.trim()[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 group-hover:text-terracotta-800">{client.name}</div>
                    <div className="text-xs text-slate-500">{client.totalBookings} booking{client.totalBookings !== 1 ? 's' : ''}</div>
                    {client.confirmedHotels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {client.confirmedHotels.map(h => (
                          <span key={h} className="text-[10px] bg-terracotta-100 text-terracotta-700 rounded px-1.5 py-0.5">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-terracotta-500 flex-shrink-0" />
                </button>
              ))}

              {/* New client option */}
              <button
                onClick={pickNewClient}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-dashed border-gray-300 hover:border-terracotta-400 hover:bg-terracotta-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <Plus size={16} />
                </div>
                <div>
                  <div className="font-medium text-slate-600">
                    {search.trim() ? `New client: "${search.trim()}"` : 'New client (not in reservations)'}
                  </div>
                  <div className="text-xs text-slate-400">Enter name on next step</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Build Itinerary ── */}
        {step === 'build' && (
          <>
            <div className="p-6 space-y-5">
              {/* Selected client card */}
              <div className="flex items-center gap-3 bg-terracotta-50 border border-terracotta-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-terracotta-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(clientName || '?').trim()[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="font-semibold text-slate-800 bg-transparent w-full focus:outline-none focus:underline text-sm"
                    placeholder="Client name"
                  />
                  {confirmedHotels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {confirmedHotels.map(h => (
                        <span key={h} className="text-[10px] bg-terracotta-200 text-terracotta-800 rounded px-1.5 py-0.5 font-medium">{h}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setStep('pick-client')} className="text-xs text-terracotta-600 hover:underline flex-shrink-0">Change</button>
              </div>

              {/* Pax + contact */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pax</label>
                  <input type="number" min={1} value={pax} onChange={e => setPax(Number(e.target.value))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contact name</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} className={inp} placeholder="Ahmed Mohamed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contact phone</label>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={inp} placeholder="+20 100…" />
                </div>
              </div>

              {/* Days */}
              {days.map((day, dayIdx) => (
                <div key={dayIdx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-terracotta-700">🌴 Day {dayIdx + 1}</span>
                      <input
                        type="date"
                        value={day.date}
                        onChange={e => setDayDate(dayIdx, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
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

                  {showLibrary === dayIdx && (
                    <DayLibraryPicker
                      templates={templates}
                      onApplyTemplate={t => applyTemplate(dayIdx, t)}
                      onAddTour={name => addExplorerTour(dayIdx, name)}
                    />
                  )}

                  <div className="space-y-4">
                    {/* ── Tour Activities ── */}
                    <div>
                      <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-2">🏖 Tour Activities</div>
                      <div className="space-y-2">
                        {day.activities.map((act, actIdx) => act.type !== 'stop' ? null : (
                          <div key={actIdx} className="flex gap-2 items-center">
                            <input
                              value={act.description}
                              onChange={e => setActivity(dayIdx, actIdx, 'description', e.target.value)}
                              className={inp}
                              placeholder="Activity or stop description…"
                            />
                            <button onClick={() => removeActivity(dayIdx, actIdx)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addActivity(dayIdx)} className="text-xs text-terracotta-600 hover:underline">
                          + Add activity
                        </button>
                      </div>
                    </div>

                    {/* ── Transfers ── */}
                    <div>
                      <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-2">🚗 Transfers</div>
                      <div className="space-y-3">
                        {day.activities.map((act, actIdx) => {
                          if (act.type === 'stop') return null
                          const cfg = TYPE_CONFIG[act.type]
                          return (
                            <div key={actIdx} className="space-y-1.5">
                              <div className="flex gap-2 items-center">
                                <button
                                  type="button"
                                  onClick={() => cycleActivityType(dayIdx, actIdx)}
                                  className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors ${cfg.bg}`}
                                >
                                  {cfg.label}
                                </button>
                                <input
                                  value={act.time}
                                  onChange={e => setActivity(dayIdx, actIdx, 'time', e.target.value)}
                                  className={`${inp} w-24 flex-shrink-0`}
                                  placeholder="09:00"
                                />
                                <button onClick={() => removeActivity(dayIdx, actIdx)} className="text-slate-300 hover:text-red-400 flex-shrink-0 ml-auto">
                                  <X size={14} />
                                </button>
                              </div>

                              {act.type === 'transfer' && (
                                <div className="space-y-1.5 pl-1">
                                  <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                      <input
                                        value={act.from ?? ''}
                                        onChange={e => setActivity(dayIdx, actIdx, 'from', e.target.value)}
                                        className={inp}
                                        placeholder="From hotel / location"
                                        list={`from-${dayIdx}-${actIdx}`}
                                      />
                                      <datalist id={`from-${dayIdx}-${actIdx}`}>
                                        {hotelOptions.map(h => <option key={h} value={h} />)}
                                      </datalist>
                                    </div>
                                    <span className="text-slate-400 text-xs flex-shrink-0">→</span>
                                    <div className="flex-1">
                                      <input
                                        value={act.to ?? ''}
                                        onChange={e => setActivity(dayIdx, actIdx, 'to', e.target.value)}
                                        className={inp}
                                        placeholder="To hotel / location"
                                        list={`to-${dayIdx}-${actIdx}`}
                                      />
                                      <datalist id={`to-${dayIdx}-${actIdx}`}>
                                        {hotelOptions.map(h => <option key={h} value={h} />)}
                                      </datalist>
                                    </div>
                                  </div>
                                  {confirmedHotels.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {confirmedHotels.map(h => (
                                        <button key={h} type="button" onClick={() => setActivity(dayIdx, actIdx, 'to', h)}
                                          className="text-[10px] bg-slate-100 hover:bg-terracotta-100 text-slate-600 hover:text-terracotta-800 border border-slate-200 rounded px-1.5 py-0.5 transition-colors">
                                          → {h}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {act.type === 'airport-pickup' && (
                                <div className="space-y-1.5 pl-1">
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[10px] text-blue-600 font-medium mb-0.5 block">✈️ Arrival Flight</label>
                                      <input
                                        value={act.flight ?? ''}
                                        onChange={e => setActivity(dayIdx, actIdx, 'flight', e.target.value)}
                                        className={inp}
                                        placeholder="e.g. MS985"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[10px] text-blue-600 font-medium mb-0.5 block">Drop to hotel</label>
                                      <input
                                        value={act.to ?? ''}
                                        onChange={e => setActivity(dayIdx, actIdx, 'to', e.target.value)}
                                        className={inp}
                                        placeholder="Hotel / destination"
                                        list={`pickup-to-${dayIdx}-${actIdx}`}
                                      />
                                      <datalist id={`pickup-to-${dayIdx}-${actIdx}`}>
                                        {hotelOptions.map(h => <option key={h} value={h} />)}
                                      </datalist>
                                    </div>
                                  </div>
                                  {confirmedHotels.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      <span className="text-[10px] text-slate-400 self-center">Quick fill:</span>
                                      {confirmedHotels.map(h => (
                                        <button key={h} type="button" onClick={() => setActivity(dayIdx, actIdx, 'to', h)}
                                          className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 transition-colors">
                                          {h}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {act.type === 'airport-dropoff' && (
                                <div className="space-y-1.5 pl-1">
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[10px] text-purple-600 font-medium mb-0.5 block">Pick up from hotel</label>
                                      <input
                                        value={act.from ?? ''}
                                        onChange={e => setActivity(dayIdx, actIdx, 'from', e.target.value)}
                                        className={inp}
                                        placeholder="Hotel / pickup location"
                                        list={`dropoff-from-${dayIdx}-${actIdx}`}
                                      />
                                      <datalist id={`dropoff-from-${dayIdx}-${actIdx}`}>
                                        {hotelOptions.map(h => <option key={h} value={h} />)}
                                      </datalist>
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[10px] text-purple-600 font-medium mb-0.5 block">🛫 Departure Flight</label>
                                      <input
                                        value={act.flight ?? ''}
                                        onChange={e => setActivity(dayIdx, actIdx, 'flight', e.target.value)}
                                        className={inp}
                                        placeholder="e.g. MS986"
                                      />
                                    </div>
                                  </div>
                                  {confirmedHotels.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      <span className="text-[10px] text-slate-400 self-center">Quick fill:</span>
                                      {confirmedHotels.map(h => (
                                        <button key={h} type="button" onClick={() => setActivity(dayIdx, actIdx, 'from', h)}
                                          className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5 transition-colors">
                                          {h}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <button onClick={() => addTransfer(dayIdx)} className="text-xs text-slate-500 hover:text-slate-700 hover:underline">
                          + Add transfer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addDay}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-slate-500 hover:border-terracotta-400 hover:text-terracotta-600 transition-colors"
              >
                + Add Day
              </button>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className={`${inp} resize-none`}
                  placeholder="Any extra notes…"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 hover:text-slate-700">Cancel</button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-terracotta-600 text-white text-sm rounded-lg px-5 py-2 hover:bg-terracotta-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Create Tour'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
