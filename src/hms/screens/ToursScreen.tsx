import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, BookOpen, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityItem {
  time: string
  description: string
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
  const lines: string[] = []
  lines.push('🌼🌼')
  lines.push(tour.client_name)
  lines.push(`${tour.pax} pax`)
  for (const day of days) {
    lines.push('')
    lines.push('🌴')
    lines.push(formatDay(day.date, day.sort_order + 1))
    const acts = [...(day.hms_tour_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    for (const act of acts) {
      lines.push(`${act.time} ${act.description}`)
    }
    lines.push('End of program')
  }
  if (tour.notes) {
    lines.push('')
    lines.push(tour.notes)
  }
  return lines.join('\n')
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

      {tab === 'tours' && <ToursTab />}
      {tab === 'library' && <LibraryTab />}

      {showNew && <NewTourModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

// ─── Tours Tab ────────────────────────────────────────────────────────────────

function ToursTab() {
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

  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>
  if (!tours.length) return (
    <div className="text-center py-20 text-slate-400">
      <p className="text-lg mb-2">No tours yet</p>
      <p className="text-sm">Click "New Tour" to create your first itinerary</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
    </div>
  )
}

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
          {days.map((day, i) => {
            const acts = [...(day.hms_tour_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order)
            return (
              <div key={day.id}>
                <div className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">
                  🌴 {formatDay(day.date, i + 1)}
                </div>
                <div className="space-y-0.5 pl-2">
                  {acts.map(act => (
                    <div key={act.id} className="text-sm text-slate-700">
                      <span className="text-slate-400 font-mono mr-2">{act.time}</span>
                      {act.description}
                    </div>
                  ))}
                  {!acts.length && <div className="text-xs text-slate-400">No activities</div>}
                </div>
              </div>
            )
          })}
          {tour.notes && (
            <div className="text-xs text-slate-500 border-t border-gray-100 pt-2 mt-2">
              {tour.notes}
            </div>
          )}
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

function NewTourModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [clientName, setClientName] = useState('')
  const [pax, setPax] = useState(2)
  const [notes, setNotes] = useState('')
  const [days, setDays] = useState<DayDraft[]>([{ date: '', activities: [{ time: '', description: '' }] }])
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

  function addDay() {
    setDays(d => [...d, { date: '', activities: [{ time: '', description: '' }] }])
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

  function addActivity(dayIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: [...day.activities, { time: '', description: '' }],
    }))
  }

  function removeActivity(dayIdx: number, actIdx: number) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: day.activities.filter((_, k) => k !== actIdx),
    }))
  }

  function applyTemplate(dayIdx: number, template: ActivityTemplate) {
    setDays(d => d.map((day, j) => j !== dayIdx ? day : {
      ...day, activities: template.activities.map(a => ({ ...a })),
    }))
    setShowLibrary(null)
  }

  async function save() {
    if (!clientName.trim()) return toast.error('Client name required')
    setSaving(true)
    try {
      const { data: tour, error: tErr } = await supabase
        .from('hms_tours')
        .insert({ client_name: clientName.trim(), pax, notes: notes.trim() || null })
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

        const acts = day.activities.filter(a => a.description.trim())
        if (acts.length) {
          const { error: aErr } = await supabase.from('hms_tour_activities').insert(
            acts.map((a, k) => ({ day_id: dayRow.id, time: a.time, description: a.description, sort_order: k }))
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
              <input value={clientName} onChange={e => setClientName(e.target.value)} className={inp} placeholder="e.g. Ahmed & Sara" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pax</label>
              <input type="number" min={1} value={pax} onChange={e => setPax(Number(e.target.value))} className={inp} />
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
                  <div key={actIdx} className="flex gap-2">
                    <input
                      value={act.time}
                      onChange={e => setActivity(dayIdx, actIdx, 'time', e.target.value)}
                      className={`${inp} w-24`}
                      placeholder="09:00"
                    />
                    <input
                      value={act.description}
                      onChange={e => setActivity(dayIdx, actIdx, 'description', e.target.value)}
                      className={inp}
                      placeholder="Activity / transfer / hotel check-in…"
                    />
                    <button onClick={() => removeActivity(dayIdx, actIdx)} className="text-slate-300 hover:text-red-400">
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
