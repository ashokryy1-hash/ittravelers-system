import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import {
  Plus, Phone, Mail, Calendar, MessageCircle, Trash2,
  ChevronDown, ChevronUp, Check, X, Search, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO, differenceInDays } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  wedding_date: string | null
  pax: number
  destination: string
  source: string
  status: LeadStatus
  notes: string | null
  whatsapp_sent: boolean
  whatsapp_sent_at: string | null
  meeting_type: 'Office' | 'Google Meet' | null
  meeting_date: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

type LeadStatus = 'New' | 'Contacted' | 'Replied' | 'Meeting' | 'Proposal Sent' | 'Booked' | 'Lost'

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Replied', 'Meeting', 'Proposal Sent', 'Booked', 'Lost']

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-yellow-100 text-yellow-700',
  Replied: 'bg-orange-100 text-orange-700',
  Meeting: 'bg-purple-100 text-purple-700',
  'Proposal Sent': 'bg-indigo-100 text-indigo-700',
  Booked: 'bg-green-100 text-green-700',
  Lost: 'bg-gray-100 text-gray-500',
}

const SOURCES = ['Marketing', 'Instagram', 'Facebook', 'Referral', 'Website', 'WhatsApp', 'Walk-in', 'Other']
const DESTINATIONS = ['Bali', 'Thailand', 'Vietnam', 'Maldives', 'Other']

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'

// ─── WhatsApp message builder ─────────────────────────────────────────────────

function buildGreetingMessage(lead: Lead): string {
  const name = lead.name.split(' ')[0]
  return `Ahlan ${name}! 🌺

Mabrook on your upcoming wedding! I'm Ahmed from InterTeam Travel, Cairo's specialist in honeymoon packages.

We work differently from other agencies — instead of offering fixed packages, *we help you build and customize your own honeymoon* based on your dream, your dates, and your budget. 🌍

Here's how it works:
✅ You choose your destination (Bali, Thailand, Maldives...)
✅ We guide you through every city & area
✅ You pick the hotels, tours & experiences you love
✅ We handle everything — flights, transfers, hotels, tours

To get started, I'd love to show you what we can create for you.

Would you prefer to meet:
🏢 At our Cairo office
💻 Or a quick Google Meet call?

Just let me know what works for you and I'll arrange it! 🙏`
}

function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const withCode = cleaned.startsWith('0') ? `20${cleaned.slice(1)}` : cleaned.startsWith('20') ? cleaned : `20${cleaned}`
  return `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LeadsScreen() {
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All')
  const [filterSource, setFilterSource] = useState('All')

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['hms_leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hms_leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filterStatus !== 'All' && l.status !== filterStatus) return false
      if (filterSource !== 'All' && l.source !== filterSource) return false
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false
      return true
    })
  }, [leads, filterStatus, filterSource, search])

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    active: leads.filter(l => !['Booked', 'Lost'].includes(l.status)).length,
    booked: leads.filter(l => l.status === 'Booked').length,
    convRate: leads.length ? Math.round((leads.filter(l => l.status === 'Booked').length / leads.length) * 100) : 0,
  }), [leads])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leads & Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage honeymoon enquiries from your marketing team</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-teal-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={15} /> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-slate-700' },
          { label: 'New', value: stats.new, color: 'text-blue-600' },
          { label: 'Active', value: stats.active, color: 'text-teal-600' },
          { label: 'Booked', value: `${stats.booked} (${stats.convRate}%)`, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {(['All', ...STATUSES] as const).map(s => {
          const count = s === 'All' ? leads.length : leads.filter(l => l.status === s).length
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s as any)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              {s} {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="All">All sources</option>
          {SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Leads list */}
      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : !filtered.length ? (
        <div className="text-center py-20 text-slate-400">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">No leads yet</p>
          <p className="text-sm">Click "Add Lead" to start tracking your first enquiry</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      )}

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead }: { lead: Lead }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState(lead.notes ?? '')

  const daysAgo = differenceInDays(new Date(), parseISO(lead.created_at))
  const weddingDays = lead.wedding_date
    ? differenceInDays(parseISO(lead.wedding_date), new Date())
    : null

  async function setStatus(status: LeadStatus) {
    await supabase.from('hms_leads').update({ status }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
  }

  async function saveNotes() {
    await supabase.from('hms_leads').update({ notes }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    setEditNotes(false)
    toast.success('Notes saved')
  }

  async function markWhatsAppSent() {
    await supabase.from('hms_leads').update({ whatsapp_sent: true, whatsapp_sent_at: new Date().toISOString() }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    if (lead.status === 'New') setStatus('Contacted')
    toast.success('Marked as sent')
  }

  async function deleteLead() {
    if (!confirm(`Delete lead for ${lead.name}?`)) return
    await supabase.from('hms_leads').delete().eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    toast.success('Lead deleted')
  }

  const waMessage = buildGreetingMessage(lead)
  const waLink = buildWhatsAppLink(lead.phone, waMessage)

  return (
    <div className={`border rounded-xl bg-white overflow-hidden ${lead.status === 'Lost' ? 'opacity-60' : 'border-gray-200'}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
          {lead.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{lead.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
              {lead.status}
            </span>
            {lead.status === 'New' && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium animate-pulse">
                Not contacted
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><Phone size={11} /> {lead.phone}</span>
            {lead.email && <span className="flex items-center gap-1"><Mail size={11} /> {lead.email}</span>}
            <span>🌍 {lead.destination}</span>
            <span>👥 {lead.pax} pax</span>
            {weddingDays !== null && (
              <span className={`flex items-center gap-1 ${weddingDays < 60 ? 'text-orange-500 font-medium' : ''}`}>
                <Calendar size={11} />
                {weddingDays > 0 ? `Wedding in ${weddingDays}d` : 'Wedding passed'}
              </span>
            )}
            <span className="text-slate-400">Added {daysAgo === 0 ? 'today' : `${daysAgo}d ago`} · {lead.source}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* WhatsApp button */}
          {!lead.whatsapp_sent ? (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              onClick={markWhatsAppSent}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <MessageCircle size={13} /> Send WhatsApp
            </a>
          ) : (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              <Check size={12} /> Sent
            </span>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600 p-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Status pipeline */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Move to stage:</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    lead.status === s
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-300 text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp message preview */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">WhatsApp greeting message:</div>
            <pre className="text-xs bg-green-50 border border-green-100 rounded-lg p-3 whitespace-pre-wrap font-sans text-slate-700">
              {waMessage}
            </pre>
            <div className="flex gap-2 mt-2">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                onClick={markWhatsAppSent}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg"
              >
                <MessageCircle size={12} /> Open in WhatsApp
              </a>
              {lead.whatsapp_sent && lead.whatsapp_sent_at && (
                <span className="text-xs text-slate-400 self-center">
                  Sent {format(parseISO(lead.whatsapp_sent_at), 'd MMM, HH:mm')}
                </span>
              )}
            </div>
          </div>

          {/* Meeting */}
          <MeetingSection lead={lead} />

          {/* Notes */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Notes:</div>
            {editNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className={`${inp} resize-none`}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={saveNotes} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Save</button>
                  <button onClick={() => setEditNotes(false)} className="text-xs text-slate-500 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditNotes(true)}
                className="text-sm text-slate-600 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 min-h-[36px]"
              >
                {notes || <span className="text-slate-400 italic">Click to add notes…</span>}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="flex justify-end pt-1">
            <button onClick={deleteLead} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
              <Trash2 size={12} /> Delete lead
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Meeting Section ──────────────────────────────────────────────────────────

function MeetingSection({ lead }: { lead: Lead }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState<'Office' | 'Google Meet'>(lead.meeting_type ?? 'Office')
  const [date, setDate] = useState(lead.meeting_date ? lead.meeting_date.slice(0, 16) : '')

  async function save() {
    await supabase.from('hms_leads').update({
      meeting_type: type,
      meeting_date: date || null,
      status: 'Meeting',
    }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    setEditing(false)
    toast.success('Meeting saved')
  }

  if (!lead.meeting_type && !editing) {
    return (
      <div>
        <div className="text-xs font-medium text-slate-500 mb-1">Meeting:</div>
        <button onClick={() => setEditing(true)} className="text-xs text-teal-600 hover:underline">
          + Schedule a meeting
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-500">Schedule meeting:</div>
        <div className="flex gap-2">
          <select value={type} onChange={e => setType(e.target.value as any)} className={`${inp} w-auto`}>
            <option>Office</option>
            <option>Google Meet</option>
          </select>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className={inp} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Save</button>
          <button onClick={() => setEditing(false)} className="text-xs text-slate-500">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1">Meeting:</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700">
          {lead.meeting_type === 'Google Meet' ? '💻' : '🏢'} {lead.meeting_type}
          {lead.meeting_date && ` — ${format(parseISO(lead.meeting_date), 'd MMM yyyy, HH:mm')}`}
        </span>
        <button onClick={() => setEditing(true)} className="text-xs text-teal-600 hover:underline">Edit</button>
      </div>
    </div>
  )
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────

function NewLeadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', phone: '', email: '', wedding_date: '',
    pax: 2, destination: 'Bali', source: 'Marketing', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.name.trim()) return toast.error('Name required')
    if (!form.phone.trim()) return toast.error('Phone required')
    setSaving(true)
    const { error } = await supabase.from('hms_leads').insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      wedding_date: form.wedding_date || null,
      pax: Number(form.pax),
      destination: form.destination,
      source: form.source,
      notes: form.notes.trim() || null,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    toast.success('Lead added!')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">Add New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input value={form.name} onChange={set('name')} className={inp} placeholder="e.g. Ahmed & Sara Mohamed" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone / WhatsApp *</label>
              <input value={form.phone} onChange={set('phone')} className={inp} placeholder="e.g. 01012345678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className={inp} placeholder="optional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Wedding Date</label>
              <input type="date" value={form.wedding_date} onChange={set('wedding_date')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pax</label>
              <input type="number" min={1} value={form.pax} onChange={set('pax')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
              <select value={form.destination} onChange={set('destination')} className={inp}>
                {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
              <select value={form.source} onChange={set('source')} className={inp}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inp} resize-none`} placeholder="Budget, special requests, how they heard about you…" />
          </div>

          {/* Preview WhatsApp message */}
          {form.name && form.phone && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="text-xs font-medium text-green-700 mb-1">📱 WhatsApp greeting that will be ready to send:</div>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans line-clamp-4">
                {buildGreetingMessage({ ...form, id: '', status: 'New', whatsapp_sent: false, whatsapp_sent_at: null, meeting_type: null, meeting_date: null, assigned_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Lead)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 hover:text-slate-700">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-teal-600 text-white text-sm rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
