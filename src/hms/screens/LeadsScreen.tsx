import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { getSettings } from '../lib/settings'
import type { HmsSettings } from '../types'
import {
  Plus, Phone, Mail, Calendar, MessageCircle, Trash2,
  ChevronDown, ChevronUp, Check, X, Search, Bell, Send,
  Users, MapPin, Link, Edit2
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
  lead_type: 'honeymoon' | 'group'
  trip_id: string | null
  priority: 'hot' | 'warm' | 'cold' | 'on_hold' | null
  package_link: string | null
  created_at: string
  updated_at: string
}

interface Trip {
  id: string
  name: string
  destination: string
  departure_date: string | null
  return_date: string | null
  price_per_person: number | null
  currency: string
  capacity: number
  program_link: string | null
  description: string | null
  is_active: boolean
  created_at: string
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

const PRIORITIES = [
  { value: 'hot',     label: '🔥 Hot',     bg: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'warm',    label: '🌱 Warm',    bg: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'cold',    label: '❄️ Cold',    bg: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'on_hold', label: '⏸ On Hold', bg: 'bg-gray-100 text-gray-500 border-gray-200' },
] as const

const SOURCES = ['Marketing', 'Instagram', 'Facebook', 'Referral', 'Website', 'WhatsApp', 'Walk-in', 'Other']
const DESTINATIONS = ['Bali', 'Thailand', 'Vietnam', 'Maldives', 'Other']
const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'

// ─── WhatsApp message builders ────────────────────────────────────────────────

function buildGreetingMessage(lead: Lead): string {
  const name = lead.name.split(' ')[0]
  return `Hi ${name}! 👋😊

This is Ahmed from ITTravelers.

Congratulations on your upcoming wedding! 🎉❤️

Planning a honeymoon can honestly feel overwhelming... everyone recommends something different, Instagram makes everything look amazing, and it's hard to know what's actually worth it.

That's exactly why we only specialize in honeymoons. We don't believe in fixed packages — we design every trip from scratch around your budget, travel style, and everything you've been dreaming about.

I've personally explored Bali and many of the destinations we recommend, so you'll be getting advice based on real experience — not just hotel brochures or online reviews. 😊

Here's how our call works:
🗺 We walk you through each destination — city by city
🏨 You see the actual hotels and pick what feels right
🌴 We go through the tours and experiences available
💬 You ask anything, we answer from real experience

By the end of the call, you'll have a clear picture of exactly where you're going and what your honeymoon looks like — no pressure, no rush.

The easiest way to start is with a quick chat — either at our Cairo office or on Google Meet. ✈️🌴

Which would be easier for you?`
}

function buildGroupGreetingMessage(lead: Lead, trip: Trip | null): string {
  const name = lead.name.split(' ')[0]
  const depDate = trip?.departure_date ? format(parseISO(trip.departure_date), 'd MMM yyyy') : 'TBA'
  const retDate = trip?.return_date ? format(parseISO(trip.return_date), 'd MMM yyyy') : 'TBA'
  const price = trip?.price_per_person ? `${trip.price_per_person.toLocaleString()} ${trip.currency}` : 'TBA'
  const destination = trip?.destination ?? lead.destination
  const tripName = trip?.name ?? `${destination} Group Trip`

  return `Hi ${name}! 👋😊

This is Ahmed from ITTravelers.

I wanted to reach out personally about something exciting we have coming up — and I think it might be exactly what you're looking for! 🌴✈️

We're running a group trip to ${destination} and honestly, the itinerary for this one is really special. We've put together everything — hotels, tours, transfers — so you don't have to figure out a single thing. 😊

Here's what's included:

✈️ *${tripName}*
📍 ${destination}
🗓 Departure: ${depDate}
🏠 Return: ${retDate}
💰 ${price} per person — full program${trip?.description ? `\n\n${trip.description}` : ''}

📋 Full program & details:
${trip?.program_link ?? '[Program link coming soon]'}

Seats are limited and we're already getting interest — so if this looks like something you'd want to be part of, just reply *"I'm in"* and I'll reserve your spot right away.

Or if you'd like to know more before deciding, I'm happy to jump on a quick call and walk you through everything. No pressure at all. 🙏`
}

function buildGroupReminderMessage(lead: Lead, trip: Trip | null): string {
  const name = lead.name.split(' ')[0]
  return `Ahlan ${name}! 🌴

Just checking in — did you get a chance to check out the ${trip?.name ?? lead.destination + ' group trip'} details I sent?

We still have a few seats available but they're going fast! 😊

Would you like to book your seat, or shall I arrange a quick call to answer any questions?

Looking forward to hearing from you! 🙏`
}

function buildGroupDepositMessage(lead: Lead, trip: Trip | null): string {
  const name = lead.name.split(' ')[0]
  const price = trip?.price_per_person ? `${trip.price_per_person.toLocaleString()} ${trip.currency}` : 'TBA'
  return `Ahlan ${name}! 🎉

Amazing — so glad you're joining us on the ${trip?.name ?? lead.destination + ' trip'}!

To confirm your seat, we'll need a deposit to hold your place.

💰 Total price: ${price} per person
📲 Please contact us to arrange the deposit and we'll send you a confirmation right away!

Looking forward to an incredible trip together! 🌴✨`
}

function buildMeetingLinkMessage(lead: Lead, settings: HmsSettings): string {
  const name = lead.name.split(' ')[0]
  if (lead.meeting_type === 'Google Meet') {
    const link = (settings as any).google_meet_link || ''
    return `Ahlan ${name}! 😊

Perfect — let's do a quick call!

📅 Book a time that works for you here:
${link || '[Add your Meet/Calendly link in HMS Settings]'}

Looking forward to chatting! 🌴`
  }
  const address = (settings as any).office_address || '[Add your office address in HMS Settings]'
  return `Ahlan ${name}! 😊

Perfect — let's meet at our Cairo office!

📍 We're located at:
${address}

Please let me know which day works for you and I'll confirm the time. ☀️`
}

function buildHoneymoonReminderDay2(lead: Lead): string {
  const name = lead.name.split(' ')[0]
  return `Hi ${name}! 😊

I know wedding planning keeps everyone busy, so I just wanted to check in.

Whenever you start thinking about your honeymoon, I'd be happy to help you build a trip that's completely tailored to you — no fixed packages, just what fits your style and budget. 🤍

If you're still interested, just send me a quick "yes" and we'll continue from there.`
}

function buildHoneymoonReminderDay5(lead: Lead): string {
  const name = lead.name.split(' ')[0]
  const packageLink = (lead as any).package_link
  return `Hi ${name}! 😊

I know you may still be busy with wedding planning, so this will be my last message. 🤍

I wanted to share a real honeymoon package we've designed to give you some inspiration:
${packageLink || '[Add a package link to this lead]'}

Every couple is different, which is why we don't sell fixed packages — we build each honeymoon from scratch to match your travel style, budget, and the memories you want to create.

If it looks like the kind of trip you've been dreaming about, just let me know and we'll create your own version together. ✨`
}

function buildFollowUpAfterMeetingMessage(lead: Lead): string {
  const name = lead.name.split(' ')[0]
  return `Ahlan ${name}! 😊

It was great connecting with you! As discussed, I'm putting together a customized honeymoon proposal for ${lead.destination}. 🌴

I'll send you all the details very soon. Feel free to reach out if you have any questions!

Looking forward to making your honeymoon unforgettable 🌺`
}

function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const withCode = cleaned.startsWith('0') ? `20${cleaned.slice(1)}` : cleaned.startsWith('20') ? cleaned : `20${cleaned}`
  return `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeadsScreen() {
  const [tab, setTab] = useState<'honeymoon' | 'group' | 'trips'>('honeymoon')
  const [showNew, setShowNew] = useState(false)

  const { data: settings } = useQuery<HmsSettings>({
    queryKey: ['hms_settings'],
    queryFn: getSettings,
  })

  const { data: allLeads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['hms_leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hms_leads').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['hms_trips'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hms_trips').select('*').order('departure_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  const honeymoonLeads = allLeads.filter(l => l.lead_type === 'honeymoon' || !l.lead_type)
  const groupLeads = allLeads.filter(l => l.lead_type === 'group')

  const stats = {
    honeymoon: honeymoonLeads.length,
    group: groupLeads.length,
    bookedTotal: allLeads.filter(l => l.status === 'Booked').length,
    needsAttention: allLeads.filter(l => {
      const daysSince = differenceInDays(new Date(), parseISO(l.updated_at))
      return l.whatsapp_sent && l.status === 'Contacted' && daysSince >= 2
    }).length,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leads & Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Honeymoon enquiries and group trip bookings</p>
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
          { label: 'Honeymoon Leads', value: stats.honeymoon, color: 'text-pink-600' },
          { label: 'Group Trip Leads', value: stats.group, color: 'text-teal-600' },
          { label: 'Total Booked', value: stats.bookedTotal, color: 'text-green-600' },
          { label: 'Need Follow-up', value: stats.needsAttention, color: stats.needsAttention > 0 ? 'text-orange-500' : 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'honeymoon', label: `🌺 Honeymoon (${honeymoonLeads.length})` },
          { key: 'group', label: `🌴 Group Trips (${groupLeads.length})` },
          { key: 'trips', label: `📋 Trip Library (${trips.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'honeymoon' && (
        <HoneymoonTab leads={honeymoonLeads} settings={settings ?? null} isLoading={leadsLoading} />
      )}
      {tab === 'group' && (
        <GroupTab leads={groupLeads} trips={trips} settings={settings ?? null} isLoading={leadsLoading} />
      )}
      {tab === 'trips' && (
        <TripLibraryTab trips={trips} leads={groupLeads} isLoading={tripsLoading} />
      )}

      {showNew && (
        <NewLeadModal
          trips={trips}
          defaultType={tab === 'group' ? 'group' : 'honeymoon'}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}

// ─── Honeymoon Tab ────────────────────────────────────────────────────────────

function HoneymoonTab({ leads, settings, isLoading }: { leads: Lead[]; settings: HmsSettings | null; isLoading: boolean }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All')

  const filtered = useMemo(() => leads.filter(l => {
    if (filterStatus !== 'All' && l.status !== filterStatus) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false
    return true
  }), [leads, filterStatus, search])

  return (
    <div>
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(['All', ...STATUSES] as const).map(s => {
          const count = s === 'All' ? leads.length : leads.filter(l => l.status === s).length
          return (
            <button key={s} onClick={() => setFilterStatus(s as any)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
              {s}{count > 0 && ` (${count})`}
            </button>
          )
        })}
      </div>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      {isLoading ? <div className="text-slate-400 text-sm">Loading…</div>
        : !filtered.length ? (
          <div className="text-center py-20 text-slate-400">
            <span className="text-4xl block mb-3">🌺</span>
            <p className="text-lg mb-1">No honeymoon leads yet</p>
            <p className="text-sm">Click "Add Lead" and choose Honeymoon</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => <LeadCard key={lead.id} lead={lead} settings={settings} trip={null} />)}
          </div>
        )}
    </div>
  )
}

// ─── Group Tab ────────────────────────────────────────────────────────────────

function GroupTab({ leads, trips, settings, isLoading }: { leads: Lead[]; trips: Trip[]; settings: HmsSettings | null; isLoading: boolean }) {
  const [filterTrip, setFilterTrip] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => leads.filter(l => {
    if (filterTrip !== 'All' && l.trip_id !== filterTrip) return false
    if (filterStatus !== 'All' && l.status !== filterStatus) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false
    return true
  }), [leads, filterTrip, filterStatus, search])

  const tripMap = Object.fromEntries(trips.map(t => [t.id, t]))

  return (
    <div>
      {/* Trip filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilterTrip('All')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filterTrip === 'All' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
          All trips ({leads.length})
        </button>
        {trips.map(t => {
          const count = leads.filter(l => l.trip_id === t.id).length
          return (
            <button key={t.id} onClick={() => setFilterTrip(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filterTrip === t.id ? 'bg-teal-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
              {t.name} ({count})
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="All">All stages</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? <div className="text-slate-400 text-sm">Loading…</div>
        : !filtered.length ? (
          <div className="text-center py-20 text-slate-400">
            <span className="text-4xl block mb-3">🌴</span>
            <p className="text-lg mb-1">No group trip leads yet</p>
            <p className="text-sm">Click "Add Lead" and choose Group Trip</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => (
              <LeadCard key={lead.id} lead={lead} settings={settings} trip={lead.trip_id ? tripMap[lead.trip_id] ?? null : null} />
            ))}
          </div>
        )}
    </div>
  )
}

// ─── Trip Library Tab ─────────────────────────────────────────────────────────

function TripLibraryTab({ trips, leads, isLoading }: { trips: Trip[]; leads: Lead[]; isLoading: boolean }) {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', destination: 'Bali', departure_date: '', return_date: '', price_per_person: '', currency: 'EGP', capacity: '20', program_link: '', description: '' })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function saveTrip() {
    if (!form.name.trim()) return toast.error('Trip name required')
    setSaving(true)
    const { error } = await supabase.from('hms_trips').insert({
      name: form.name.trim(),
      destination: form.destination,
      departure_date: form.departure_date || null,
      return_date: form.return_date || null,
      price_per_person: form.price_per_person ? Number(form.price_per_person) : null,
      currency: form.currency,
      capacity: Number(form.capacity),
      program_link: form.program_link.trim() || null,
      description: form.description.trim() || null,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    qc.invalidateQueries({ queryKey: ['hms_trips'] })
    setShowNew(false)
    setForm({ name: '', destination: 'Bali', departure_date: '', return_date: '', price_per_person: '', currency: 'EGP', capacity: '20', program_link: '', description: '' })
    toast.success('Trip created!')
  }

  async function deleteTrip(id: string) {
    if (!confirm('Delete this trip?')) return
    await supabase.from('hms_trips').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['hms_trips'] })
    toast.success('Trip deleted')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">Create group trips — leads link to a trip and inherit its details in WhatsApp messages</p>
        <button onClick={() => setShowNew(s => !s)}
          className="flex items-center gap-2 border border-teal-600 text-teal-600 rounded-lg px-3 py-1.5 text-sm hover:bg-teal-50">
          <Plus size={14} /> New Trip
        </button>
      </div>

      {showNew && (
        <div className="border border-gray-200 rounded-xl bg-white p-5 mb-5 space-y-4">
          <h3 className="font-semibold text-slate-700">New Group Trip</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Trip Name *</label>
              <input value={form.name} onChange={set('name')} className={inp} placeholder="e.g. Bali Honeymoon Group — October 2025" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
              <select value={form.destination} onChange={set('destination')} className={inp}>
                {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Capacity (seats)</label>
              <input type="number" value={form.capacity} onChange={set('capacity')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Departure Date</label>
              <input type="date" value={form.departure_date} onChange={set('departure_date')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Return Date</label>
              <input type="date" value={form.return_date} onChange={set('return_date')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Price per person</label>
              <input type="number" value={form.price_per_person} onChange={set('price_per_person')} className={inp} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
              <select value={form.currency} onChange={set('currency')} className={inp}>
                <option>EGP</option><option>USD</option><option>EUR</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Program link (PDF / Google Drive / website)</label>
              <input value={form.program_link} onChange={set('program_link')} className={inp} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-600">Short description (shown in WhatsApp message)</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    description: `🌟 What's included:\n• {nights} nights accommodation at {hotel_type} hotel\n• {meals} meal plan\n• {tours_count} guided tours & day trips\n• Airport transfers (arrival & departure)\n• {extra}\n\n⚠️ Not included: International flights & visa fees`
                  }))}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium border border-teal-200 px-2 py-0.5 rounded"
                >
                  Use Template
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={5}
                className={`${inp} resize-none font-mono text-xs`}
                placeholder={`Write a description or click "Use Template" above.\n\nReplace {placeholders} with real values, e.g.:\n• {nights} → 7\n• {hotel_type} → 5-star\n• {meals} → breakfast & dinner\n• {tours_count} → 4\n• {extra} → Uluwatu sunset temple visit`}
              />
              {form.description && form.description.includes('{') && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Fill in all <span className="font-mono">{'{placeholders}'}</span> before saving</p>
              )}
              {form.description && !form.description.includes('{') && (
                <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 whitespace-pre-wrap">
                  <span className="text-slate-400 block mb-1 font-medium">Preview in WhatsApp:</span>
                  {form.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="text-sm text-slate-500 px-4 py-2">Cancel</button>
            <button onClick={saveTrip} disabled={saving} className="bg-teal-600 text-white text-sm rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Create Trip'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-slate-400 text-sm">Loading…</div>
        : !trips.length ? (
          <div className="text-center py-16 text-slate-400">
            <span className="text-4xl block mb-3">📋</span>
            <p className="text-lg mb-1">No trips yet</p>
            <p className="text-sm">Create your first group trip to start adding leads</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => {
              const tripLeads = leads.filter(l => l.trip_id === trip.id)
              const booked = tripLeads.filter(l => l.status === 'Booked').length
              const interested = tripLeads.filter(l => !['Lost'].includes(l.status)).length
              const depDate = trip.departure_date ? format(parseISO(trip.departure_date), 'd MMM yyyy') : '—'
              const retDate = trip.return_date ? format(parseISO(trip.return_date), 'd MMM yyyy') : '—'
              const daysUntil = trip.departure_date ? differenceInDays(parseISO(trip.departure_date), new Date()) : null

              return (
                <div key={trip.id} className="border border-gray-200 rounded-xl bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">🌴 {trip.name}</span>
                        {daysUntil !== null && daysUntil > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${daysUntil < 30 ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                            {daysUntil}d to go
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        <span>📍 {trip.destination}</span>
                        <span>✈️ {depDate} → {retDate}</span>
                        {trip.price_per_person && <span>💰 {trip.price_per_person.toLocaleString()} {trip.currency}/person</span>}
                        <span>💺 {booked}/{trip.capacity} booked · {interested} interested</span>
                      </div>
                      {trip.description && <p className="text-xs text-slate-400 mt-1">{trip.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {trip.program_link && (
                        <a href={trip.program_link} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-teal-600 border border-teal-200 px-2 py-1 rounded-lg hover:bg-teal-50">
                          <Link size={11} /> Program
                        </a>
                      )}
                      <button onClick={() => deleteTrip(trip.id)} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {/* Seat bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Seat capacity</span>
                      <span>{booked} confirmed / {trip.capacity} total</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${Math.min(100, (booked / trip.capacity) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, settings, trip }: { lead: Lead; settings: HmsSettings | null; trip: Trip | null }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [sending, setSending] = useState<string | null>(null)

  const isGroup = lead.lead_type === 'group'
  const daysAgo = differenceInDays(new Date(), parseISO(lead.created_at))
  const weddingDays = lead.wedding_date ? differenceInDays(parseISO(lead.wedding_date), new Date()) : null
  const daysSinceUpdate = differenceInDays(new Date(), parseISO(lead.updated_at))
  const needsFollowUp = lead.whatsapp_sent && lead.status === 'Contacted' && daysSinceUpdate >= 2
  const needsMeetingLink = lead.status === 'Replied' && lead.meeting_type

  const greeting = isGroup ? buildGroupGreetingMessage(lead, trip) : buildGreetingMessage(lead)
  const waLink = buildWhatsAppLink(lead.phone, greeting)

  async function setStatus(status: LeadStatus) {
    await supabase.from('hms_leads').update({ status }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
  }

  async function setPriority(priority: string | null) {
    await supabase.from('hms_leads').update({ priority }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
  }

  async function saveNotes() {
    await supabase.from('hms_leads').update({ notes }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    setEditNotes(false)
    toast.success('Notes saved')
  }

  async function sendViaAPI(message: string, label: string, updates: Record<string, any> = {}) {
    setSending(label)
    try {
      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: lead.phone, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')
      await supabase.from('hms_leads').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', lead.id)
      qc.invalidateQueries({ queryKey: ['hms_leads'] })
      toast.success(`${label} sent!`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send')
    } finally {
      setSending(null)
    }
  }

  const sendGreeting = () => sendViaAPI(greeting, 'Greeting', {
    whatsapp_sent: true, whatsapp_sent_at: new Date().toISOString(),
    status: lead.status === 'New' ? 'Contacted' : lead.status,
  })
  const sendReminder = () => sendViaAPI(
    isGroup ? buildGroupReminderMessage(lead, trip) : buildHoneymoonReminderDay2(lead),
    'Reminder Day 2'
  )
  const sendReminderDay5 = () => sendViaAPI(
    buildHoneymoonReminderDay5(lead),
    'Reminder Day 5'
  )
  const sendMeetingLink = () => settings && sendViaAPI(buildMeetingLinkMessage(lead, settings), 'Meeting link', { status: 'Meeting' })
  const sendDeposit = () => sendViaAPI(buildGroupDepositMessage(lead, trip), 'Deposit info', { status: 'Proposal Sent' })
  const sendFollowUpAfterMeeting = () => sendViaAPI(buildFollowUpAfterMeetingMessage(lead), 'Follow-up', { status: 'Proposal Sent' })
  const markSent = async () => {
    await supabase.from('hms_leads').update({ whatsapp_sent: true, whatsapp_sent_at: new Date().toISOString() }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    if (lead.status === 'New') setStatus('Contacted')
  }

  async function deleteLead() {
    if (!confirm(`Delete lead for ${lead.name}?`)) return
    await supabase.from('hms_leads').delete().eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    toast.success('Lead deleted')
  }

  // Smart action button
  let actionBtn
  if (!lead.whatsapp_sent) {
    actionBtn = <button onClick={sendGreeting} disabled={!!sending} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg font-medium">{sending ? 'Sending…' : isGroup ? '🌴 Send Program' : '🌺 Send Greeting'}</button>
  } else if (needsFollowUp) {
    actionBtn = <button onClick={sendReminder} disabled={!!sending} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg font-medium animate-pulse"><Bell size={13} /> {sending ? 'Sending…' : 'Send Reminder'}</button>
  } else if (isGroup && lead.status === 'Replied') {
    actionBtn = <button onClick={sendDeposit} disabled={!!sending} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg font-medium"><Send size={13} /> {sending ? 'Sending…' : 'Send Deposit Info'}</button>
  } else if (!isGroup && needsMeetingLink) {
    actionBtn = <button onClick={sendMeetingLink} disabled={!!sending} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg font-medium"><Send size={13} /> {sending ? 'Sending…' : 'Send Meeting Link'}</button>
  } else if (!isGroup && lead.status === 'Meeting') {
    actionBtn = <button onClick={sendFollowUpAfterMeeting} disabled={!!sending} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg font-medium"><Send size={13} /> {sending ? 'Sending…' : 'Send Follow-up'}</button>
  } else {
    actionBtn = <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg"><Check size={12} /> Contacted</span>
  }

  return (
    <div className={`border rounded-xl bg-white overflow-hidden ${lead.status === 'Lost' ? 'opacity-60' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isGroup ? 'bg-teal-100 text-teal-700' : 'bg-pink-100 text-pink-700'}`}>
          {lead.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{lead.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
            {lead.priority && (() => { const p = PRIORITIES.find(p => p.value === lead.priority); return p ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.bg}`}>{p.label}</span> : null })()}
            {isGroup && trip && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">🌴 {trip.name}</span>}
            {lead.status === 'New' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium animate-pulse">Not contacted</span>}
            {needsFollowUp && <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium animate-pulse"><Bell size={10} /> Follow up needed</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><Phone size={11} /> {lead.phone}</span>
            {lead.email && <span className="flex items-center gap-1"><Mail size={11} /> {lead.email}</span>}
            <span>🌍 {lead.destination}</span>
            <span>👥 {lead.pax} pax</span>
            {!isGroup && weddingDays !== null && (
              <span className={`flex items-center gap-1 ${weddingDays < 60 ? 'text-orange-500 font-medium' : ''}`}>
                <Calendar size={11} />{weddingDays > 0 ? `Wedding in ${weddingDays}d` : 'Wedding passed'}
              </span>
            )}
            {isGroup && trip?.departure_date && (
              <span className="flex items-center gap-1"><Calendar size={11} />
                {format(parseISO(trip.departure_date), 'd MMM yyyy')}
              </span>
            )}
            <span className="text-slate-400">Added {daysAgo === 0 ? 'today' : `${daysAgo}d ago`} · {lead.source}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionBtn}
          <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600 p-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Pipeline */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Move to stage:</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${lead.status === s ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-slate-600 hover:bg-gray-50'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Priority:</div>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map(p => (
                <button key={p.value} onClick={() => setPriority(lead.priority === p.value ? null : p.value)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${lead.priority === p.value ? p.bg : 'border-gray-200 text-slate-500 hover:bg-gray-50'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp messages */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">WhatsApp Messages</div>

            <MessageBlock step="1" label={isGroup ? 'Program & Trip Details' : 'Initial Greeting'} color="green"
              sent={lead.whatsapp_sent} sentAt={lead.whatsapp_sent_at} message={greeting}
              onSend={sendGreeting} onManual={() => { window.open(waLink, '_blank'); markSent() }}
              sending={sending === 'Greeting'} />

            {lead.whatsapp_sent && lead.status === 'Contacted' && !isGroup && (
              <MessageBlock step="2" label="Day 2 — Friendly Check-in" color="orange" sent={false}
                message={buildHoneymoonReminderDay2(lead)}
                onSend={sendReminder}
                onManual={() => window.open(buildWhatsAppLink(lead.phone, buildHoneymoonReminderDay2(lead)), '_blank')}
                sending={sending === 'Reminder Day 2'}
                hint={daysSinceUpdate >= 2 ? `⚠️ ${daysSinceUpdate}d no reply` : undefined} />
            )}

            {lead.whatsapp_sent && lead.status === 'Contacted' && !isGroup && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">📎 Sample package link (for Day 5 message)</span>
                </div>
                <PackageLinkField lead={lead} />
                <MessageBlock step="3" label="Day 5 — Sample Package" color="rose" sent={false}
                  message={buildHoneymoonReminderDay5(lead)}
                  onSend={sendReminderDay5}
                  onManual={() => window.open(buildWhatsAppLink(lead.phone, buildHoneymoonReminderDay5(lead)), '_blank')}
                  sending={sending === 'Reminder Day 5'}
                  hint={daysSinceUpdate >= 5 ? `⚠️ ${daysSinceUpdate}d no reply — last message` : 'Last message before stopping'} />
              </div>
            )}

            {lead.whatsapp_sent && lead.status === 'Contacted' && isGroup && (
              <MessageBlock step="2" label="Follow-up Reminder" color="orange" sent={false}
                message={buildGroupReminderMessage(lead, trip)}
                onSend={sendReminder}
                onManual={() => window.open(buildWhatsAppLink(lead.phone, buildGroupReminderMessage(lead, trip)), '_blank')}
                sending={sending === 'Reminder Day 2'}
                hint={daysSinceUpdate >= 2 ? `⚠️ ${daysSinceUpdate}d no reply` : undefined} />
            )}

            {isGroup && (lead.status === 'Replied' || lead.status === 'Proposal Sent' || lead.status === 'Booked') && (
              <MessageBlock step="3" label="Deposit & Seat Confirmation" color="teal"
                sent={['Proposal Sent', 'Booked'].includes(lead.status)}
                message={buildGroupDepositMessage(lead, trip)}
                onSend={sendDeposit}
                onManual={() => window.open(buildWhatsAppLink(lead.phone, buildGroupDepositMessage(lead, trip)), '_blank')}
                sending={sending === 'Deposit info'} />
            )}

            {!isGroup && settings && lead.status === 'Replied' && lead.meeting_type && (
              <MessageBlock step="2" label={`Meeting Link — ${lead.meeting_type}`} color="purple"
                sent={lead.status !== 'Replied'}
                message={buildMeetingLinkMessage(lead, settings)}
                onSend={sendMeetingLink}
                onManual={() => window.open(buildWhatsAppLink(lead.phone, buildMeetingLinkMessage(lead, settings)), '_blank')}
                sending={sending === 'Meeting link'} />
            )}

            {!isGroup && lead.status === 'Meeting' && (
              <MessageBlock step="3" label="After-Meeting Follow-up" color="indigo" sent={false}
                message={buildFollowUpAfterMeetingMessage(lead)}
                onSend={sendFollowUpAfterMeeting}
                onManual={() => window.open(buildWhatsAppLink(lead.phone, buildFollowUpAfterMeetingMessage(lead)), '_blank')}
                sending={sending === 'Follow-up'} />
            )}
          </div>

          {!isGroup && <MeetingSection lead={lead} />}

          {/* Notes */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Notes:</div>
            {editNotes ? (
              <div className="space-y-2">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`${inp} resize-none`} autoFocus />
                <div className="flex gap-2">
                  <button onClick={saveNotes} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Save</button>
                  <button onClick={() => setEditNotes(false)} className="text-xs text-slate-500 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditNotes(true)} className="text-sm text-slate-600 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 min-h-[36px]">
                {notes || <span className="text-slate-400 italic">Click to add notes…</span>}
              </div>
            )}
          </div>

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

// ─── Message Block ────────────────────────────────────────────────────────────

const COLOR_MAP = {
  green: { bg: 'bg-green-50', border: 'border-green-100', btn: 'bg-green-500 hover:bg-green-600', badge: 'bg-green-100 text-green-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-100', btn: 'bg-teal-600 hover:bg-teal-700', badge: 'bg-teal-100 text-teal-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', btn: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-100 text-purple-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-100', btn: 'bg-rose-500 hover:bg-rose-600', badge: 'bg-rose-100 text-rose-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-100', btn: 'bg-orange-500 hover:bg-orange-600', badge: 'bg-orange-100 text-orange-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', btn: 'bg-indigo-600 hover:bg-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
}

function PackageLinkField({ lead }: { lead: Lead }) {
  const qc = useQueryClient()
  const [link, setLink] = useState(lead.package_link ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('hms_leads').update({ package_link: link.trim() || null }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    setSaving(false)
    toast.success('Package link saved')
  }

  return (
    <div className="flex gap-2">
      <input
        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
        placeholder="Paste sample itinerary link (Google Drive, PDF, etc.)"
        value={link}
        onChange={e => setLink(e.target.value)}
      />
      <button onClick={save} disabled={saving} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function MessageBlock({ step, label, color, sent, sentAt, message, onSend, onManual, sending, hint }: {
  step: string; label: string; color: keyof typeof COLOR_MAP
  sent: boolean; sentAt?: string | null; message: string
  onSend: () => void; onManual: () => void; sending: boolean; hint?: string
}) {
  const [open, setOpen] = useState(false)
  const c = COLOR_MAP[color]
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>Step {step}</span>
        <span className="text-xs font-medium text-slate-700 flex-1">{label}</span>
        {hint && <span className="text-xs text-orange-500 font-medium">{hint}</span>}
        {sent && sentAt && <span className="text-xs text-slate-400">✓ {format(parseISO(sentAt), 'd MMM HH:mm')}</span>}
        {sent && !sentAt && <span className="text-xs text-slate-400">✓ Sent</span>}
        <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <pre className="text-xs whitespace-pre-wrap font-sans text-slate-700 bg-white rounded-lg p-2 border border-white/60">{message}</pre>
          <div className="flex gap-2">
            <button onClick={onSend} disabled={sending} className={`flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60 ${c.btn}`}>
              <MessageCircle size={12} /> {sending ? 'Sending…' : '⚡ Send automatically'}
            </button>
            <button onClick={onManual} className="flex items-center gap-1.5 border border-gray-300 text-slate-600 text-xs px-3 py-1.5 rounded-lg hover:bg-white">
              <MessageCircle size={12} /> Open in WhatsApp
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
    await supabase.from('hms_leads').update({ meeting_type: type, meeting_date: date || null, status: 'Meeting' }).eq('id', lead.id)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    setEditing(false)
    toast.success('Meeting saved')
  }

  if (!lead.meeting_type && !editing) return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1">Meeting:</div>
      <button onClick={() => setEditing(true)} className="text-xs text-teal-600 hover:underline">+ Schedule a meeting</button>
    </div>
  )

  if (editing) return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-500">Schedule meeting:</div>
      <div className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value as any)} className={`${inp} w-auto`}>
          <option>Office</option><option>Google Meet</option>
        </select>
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className={inp} />
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Save</button>
        <button onClick={() => setEditing(false)} className="text-xs text-slate-500">Cancel</button>
      </div>
    </div>
  )

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

function NewLeadModal({ trips, defaultType, onClose }: { trips: Trip[]; defaultType: 'honeymoon' | 'group'; onClose: () => void }) {
  const qc = useQueryClient()
  const [leadType, setLeadType] = useState<'honeymoon' | 'group'>(defaultType)
  const [form, setForm] = useState({ name: '', phone: '', email: '', wedding_date: '', pax: 2, destination: 'Bali', source: 'Marketing', notes: '', trip_id: '' })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const selectedTrip = trips.find(t => t.id === form.trip_id) ?? null

  async function save() {
    if (!form.name.trim()) return toast.error('Name required')
    if (!form.phone.trim()) return toast.error('Phone required')
    if (leadType === 'group' && !form.trip_id) return toast.error('Please select a trip')
    setSaving(true)
    const { error } = await supabase.from('hms_leads').insert({
      name: form.name.trim(), phone: form.phone.trim(),
      email: form.email.trim() || null,
      wedding_date: leadType === 'honeymoon' ? (form.wedding_date || null) : null,
      pax: Number(form.pax),
      destination: leadType === 'group' && selectedTrip ? selectedTrip.destination : form.destination,
      source: form.source, notes: form.notes.trim() || null,
      lead_type: leadType,
      trip_id: leadType === 'group' ? form.trip_id : null,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    qc.invalidateQueries({ queryKey: ['hms_leads'] })
    toast.success('Lead added!')
    onClose()
  }

  const previewMsg = form.name && form.phone
    ? (leadType === 'group' ? buildGroupGreetingMessage({ ...form, id: '', status: 'New', lead_type: 'group', trip_id: form.trip_id, whatsapp_sent: false, whatsapp_sent_at: null, meeting_type: null, meeting_date: null, assigned_to: null, created_at: '', updated_at: '' } as Lead, selectedTrip) : buildGreetingMessage({ ...form, id: '', status: 'New', lead_type: 'honeymoon', trip_id: null, whatsapp_sent: false, whatsapp_sent_at: null, meeting_type: null, meeting_date: null, assigned_to: null, created_at: '', updated_at: '' } as Lead))
    : null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">Add New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Lead type toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {(['honeymoon', 'group'] as const).map(t => (
              <button key={t} onClick={() => setLeadType(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${leadType === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {t === 'honeymoon' ? '🌺 Honeymoon' : '🌴 Group Trip'}
              </button>
            ))}
          </div>

          {/* Group: trip picker */}
          {leadType === 'group' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Select Trip *</label>
              {trips.length === 0 ? (
                <p className="text-xs text-orange-500">No trips yet — go to Trip Library tab to create one first</p>
              ) : (
                <select value={form.trip_id} onChange={e => setForm(f => ({ ...f, trip_id: e.target.value }))} className={inp}>
                  <option value="">Choose a trip…</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.departure_date ? `— ${format(parseISO(t.departure_date), 'd MMM yyyy')}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input value={form.name} onChange={set('name')} className={inp} placeholder={leadType === 'honeymoon' ? 'e.g. Ahmed & Sara Mohamed' : 'e.g. Mohamed Ali'} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone / WhatsApp *</label>
              <input value={form.phone} onChange={set('phone')} className={inp} placeholder="01012345678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pax</label>
              <input type="number" min={1} value={form.pax} onChange={set('pax')} className={inp} />
            </div>
            {leadType === 'honeymoon' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Wedding Date</label>
                  <input type="date" value={form.wedding_date} onChange={set('wedding_date')} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                  <select value={form.destination} onChange={set('destination')} className={inp}>
                    {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
              <select value={form.source} onChange={set('source')} className={inp}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inp} resize-none`} placeholder="Budget, special requests…" />
          </div>

          {previewMsg && (
            <div className={`rounded-xl p-3 border ${leadType === 'group' ? 'bg-teal-50 border-teal-100' : 'bg-green-50 border-green-100'}`}>
              <div className={`text-xs font-medium mb-1 ${leadType === 'group' ? 'text-teal-700' : 'text-green-700'}`}>📱 WhatsApp message preview:</div>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans line-clamp-5">{previewMsg}</pre>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 hover:text-slate-700">Cancel</button>
          <button onClick={save} disabled={saving} className="bg-teal-600 text-white text-sm rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
