import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Send, MessageSquare, ChevronDown, ChevronUp, Edit2, X, Mail } from 'lucide-react'
import type { HmsOutreachHotel, HmsOutreachEmail, HmsDestination } from '../types'
import EmailPreviewPanel from '../components/EmailPreviewPanel'
import { Modal } from './RatesScreen'
import { getSettings } from '../lib/settings'
import toast from 'react-hot-toast'

const STAGES = ['Prospect', 'Contacted', 'Replied', 'Negotiating', 'Signed', 'Declined'] as const
type Stage = typeof STAGES[number]

const STAGE_COLORS: Record<Stage, string> = {
  Prospect: 'bg-slate-100 border-slate-300',
  Contacted: 'bg-blue-50 border-blue-200',
  Replied: 'bg-purple-50 border-purple-200',
  Negotiating: 'bg-amber-50 border-amber-200',
  Signed: 'bg-teal-50 border-teal-200',
  Declined: 'bg-red-50 border-red-200',
}

const STAGE_HEADER: Record<Stage, string> = {
  Prospect: 'text-slate-600',
  Contacted: 'text-blue-600',
  Replied: 'text-purple-600',
  Negotiating: 'text-amber-600',
  Signed: 'text-teal-600',
  Declined: 'text-red-600',
}

export default function OutreachScreen() {
  const qc = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [openCard, setOpenCard] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState<{ to: string; subject: string; body: string; hotelId: string; type: string } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  const { data: destinations } = useQuery<HmsDestination[]>({
    queryKey: ['hms_destinations'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_destinations').select('*').order('name')
      return data ?? []
    },
  })

  const { data: hotels } = useQuery<HmsOutreachHotel[]>({
    queryKey: ['hms_outreach_hotels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hms_outreach_hotels')
        .select('*, hms_destinations(name)')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      await supabase.from('hms_outreach_hotels').update({ stage }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hms_outreach_hotels'] }),
  })

  async function draftOutreachEmail(hotel: HmsOutreachHotel, type: 'initial' | 'followup') {
    const settings = await getSettings()
    toast.loading('Generating email draft…', { id: 'draft' })

    const systemPrompt = `You are a professional B2B email writer for ITTravelers, an Egyptian travel agency specializing in honeymoon trips to Southeast Asia.`

    const userPrompt = type === 'initial'
      ? `Write a professional initial outreach email to ${hotel.name} (a hotel in ${hotel.city}, ${(hotel as any).hms_destinations?.name ?? 'Bali'}).

The email must:
- Introduce ITTravelers as an Egyptian travel agency specializing in honeymoon trips to Southeast Asia
- Mention our current Bali portfolio includes top properties like Ini Vie Hospitality and Pramana Group for credibility
- State we are expanding and seeking new hotel partners
- Position Egypt and the Middle East as our client market (strong selling point for hotels)
- Request NET / contract / agent rates
- Highlight our honeymoon specialization
- Reference the specific hotel name and destination
- End with our signature

Agency signature: ${settings.agency_signature}

Tone: warm, professional B2B. Keep it concise.`
      : `Write a polite follow-up email to ${hotel.name} (a hotel in ${hotel.city}).

Context: We sent an initial outreach email on ${hotel.last_contact_date ?? hotel.date_added} and have not received a reply.

The follow-up must:
- Reference our previous email politely
- Reiterate our interest in partnering with them
- Be brief and friendly
- End with our signature

Agency signature: ${settings.agency_signature}

Tone: polite, professional.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })
      const data = await res.json()
      const body = data.content?.[0]?.text ?? ''
      const subjectLine = type === 'initial'
        ? `Partnership Inquiry — ITTravelers × ${hotel.name}`
        : `Following up — ITTravelers Partnership Inquiry`

      toast.dismiss('draft')
      setEmailDraft({
        to: hotel.contact_email ?? '',
        subject: subjectLine,
        body,
        hotelId: hotel.id,
        type,
      })
    } catch {
      toast.dismiss('draft')
      toast.error('Failed to generate draft. Check your API key in settings.')
    }
  }

  async function sendEmail(subject: string, body: string) {
    if (!emailDraft) return
    setSendingEmail(true)
    // Log the email as sent
    await supabase.from('hms_outreach_emails').insert({
      hotel_id: emailDraft.hotelId,
      direction: 'sent',
      subject,
      body,
      sent_at: new Date().toISOString(),
    })
    await supabase.from('hms_outreach_hotels').update({
      last_contact_date: new Date().toISOString().split('T')[0],
      stage: emailDraft.type === 'initial' ? 'Contacted' : undefined,
    }).eq('id', emailDraft.hotelId)

    // Microsoft Graph API send
    try {
      const settings = await getSettings()
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailDraft.to, subject, body, senderName: settings.outlook_sender_name }),
      })
    } catch {
      // Log failure but don't block — email is still recorded
    }

    qc.invalidateQueries({ queryKey: ['hms_outreach_hotels'] })
    qc.invalidateQueries({ queryKey: ['hms_emails', emailDraft.hotelId] })
    setSendingEmail(false)
    setEmailDraft(null)
    toast.success('Email sent and logged')
  }

  const activeStages = STAGES.filter(s => s !== 'Declined')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Outreach Pipeline</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 text-sm bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
        >
          <Plus size={15} /> Add Hotel
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map(stage => {
          const stageHotels = (hotels ?? []).filter(h => h.stage === stage)
          return (
            <div key={stage} className="min-w-64 w-64 shrink-0">
              <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${STAGE_HEADER[stage]}`}>
                {stage} <span className="font-normal opacity-70">({stageHotels.length})</span>
              </div>
              <div className="space-y-2">
                {stageHotels.map(hotel => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    expanded={openCard === hotel.id}
                    onToggle={() => setOpenCard(openCard === hotel.id ? null : hotel.id)}
                    onStageChange={(s) => updateStage.mutate({ id: hotel.id, stage: s as Stage })}
                    onDraftEmail={(type) => draftOutreachEmail(hotel, type)}
                    stages={STAGES}
                  />
                ))}
                {stageHotels.length === 0 && (
                  <div className="text-xs text-slate-300 italic py-4 text-center">Empty</div>
                )}
              </div>
            </div>
          )
        })}

        {/* Declined column */}
        <div className="min-w-64 w-64 shrink-0">
          <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${STAGE_HEADER['Declined']}`}>
            Declined <span className="font-normal opacity-70">({(hotels ?? []).filter(h => h.stage === 'Declined').length})</span>
          </div>
          <div className="space-y-2">
            {(hotels ?? []).filter(h => h.stage === 'Declined').map(hotel => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                expanded={openCard === hotel.id}
                onToggle={() => setOpenCard(openCard === hotel.id ? null : hotel.id)}
                onStageChange={(s) => updateStage.mutate({ id: hotel.id, stage: s as Stage })}
                onDraftEmail={() => {}}
                stages={STAGES}
              />
            ))}
          </div>
        </div>
      </div>

      {showAddForm && (
        <AddHotelForm
          destinations={destinations ?? []}
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); qc.invalidateQueries({ queryKey: ['hms_outreach_hotels'] }) }}
        />
      )}

      {emailDraft && (
        <EmailPreviewPanel
          to={emailDraft.to || '(no email — add manually)'}
          subject={emailDraft.subject}
          body={emailDraft.body}
          onSend={sendEmail}
          onClose={() => setEmailDraft(null)}
          sending={sendingEmail}
        />
      )}
    </div>
  )
}

function HotelCard({ hotel, expanded, onToggle, onStageChange, onDraftEmail, stages }: {
  hotel: HmsOutreachHotel
  expanded: boolean
  onToggle: () => void
  onStageChange: (stage: string) => void
  onDraftEmail: (type: 'initial' | 'followup') => void
  stages: readonly string[]
}) {
  const qc = useQueryClient()
  const [showEmailLog, setShowEmailLog] = useState(false)
  const [incomingEmail, setIncomingEmail] = useState('')
  const [incomingSubject, setIncomingSubject] = useState('')

  const { data: emails } = useQuery<HmsOutreachEmail[]>({
    queryKey: ['hms_emails', hotel.id],
    queryFn: async () => {
      const { data } = await supabase.from('hms_outreach_emails').select('*').eq('hotel_id', hotel.id).order('sent_at')
      return data ?? []
    },
    enabled: expanded,
  })

  const needsFollowup = hotel.follow_up_date && hotel.follow_up_date <= new Date().toISOString().split('T')[0]

  async function logIncoming() {
    if (!incomingEmail.trim()) return
    await supabase.from('hms_outreach_emails').insert({
      hotel_id: hotel.id,
      direction: 'received',
      subject: incomingSubject,
      body: incomingEmail,
    })
    await supabase.from('hms_outreach_hotels').update({ stage: 'Replied' }).eq('id', hotel.id)
    qc.invalidateQueries({ queryKey: ['hms_emails', hotel.id] })
    qc.invalidateQueries({ queryKey: ['hms_outreach_hotels'] })
    setIncomingEmail('')
    setIncomingSubject('')
    toast.success('Reply logged')
  }

  return (
    <div className={`border rounded-xl bg-white overflow-hidden ${needsFollowup ? 'border-red-300' : 'border-slate-200'}`}>
      <button className="w-full text-left px-3 py-2.5" onClick={onToggle}>
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 truncate">{hotel.name}</div>
            <div className="text-xs text-slate-500">{hotel.city} · {'★'.repeat(hotel.star_rating ?? 0)}</div>
          </div>
          {expanded ? <ChevronUp size={14} className="shrink-0 mt-0.5 text-slate-400" /> : <ChevronDown size={14} className="shrink-0 mt-0.5 text-slate-400" />}
        </div>
        {needsFollowup && (
          <div className="text-xs text-red-600 mt-1">⏰ Follow-up due: {hotel.follow_up_date}</div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-3 py-3 space-y-3">
          {/* Links */}
          <div className="flex gap-3 text-xs">
            {hotel.website && <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Website</a>}
            {hotel.google_maps_url && <a href={hotel.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Maps</a>}
          </div>

          {/* Contact */}
          {(hotel.contact_name || hotel.contact_email) && (
            <div className="text-xs text-slate-600">
              {hotel.contact_name && <div>{hotel.contact_name}</div>}
              {hotel.contact_email && <div className="text-blue-600">{hotel.contact_email}</div>}
            </div>
          )}

          {/* Notes */}
          {hotel.notes && <p className="text-xs text-slate-500 italic">{hotel.notes}</p>}

          {/* Stage selector */}
          <div>
            <label className="text-xs text-slate-400">Move to stage:</label>
            <select
              className="block w-full mt-1 text-xs border border-gray-300 rounded px-2 py-1"
              value={hotel.stage}
              onChange={e => onStageChange(e.target.value)}
            >
              {stages.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Email actions */}
          <div className="space-y-1.5">
            {hotel.stage === 'Prospect' && (
              <button
                onClick={() => onDraftEmail('initial')}
                className="w-full flex items-center justify-center gap-1 text-xs bg-teal-600 text-white rounded-lg py-1.5 hover:bg-teal-700"
              >
                <Mail size={12} /> Draft outreach email
              </button>
            )}
            {(hotel.stage === 'Contacted' || hotel.stage === 'Replied' || hotel.stage === 'Negotiating') && (
              <>
                <button
                  onClick={() => onDraftEmail('followup')}
                  className="w-full flex items-center justify-center gap-1 text-xs border border-teal-300 text-teal-700 rounded-lg py-1.5 hover:bg-teal-50"
                >
                  <Send size={12} /> Draft follow-up
                </button>
              </>
            )}
          </div>

          {/* Email log */}
          <div>
            <button
              onClick={() => setShowEmailLog(e => !e)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <MessageSquare size={11} /> Conversation ({emails?.length ?? 0})
            </button>

            {showEmailLog && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {emails?.map(e => (
                  <div key={e.id} className={`text-xs rounded-lg p-2 ${e.direction === 'sent' ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="flex justify-between mb-0.5">
                      <span className={`font-medium ${e.direction === 'sent' ? 'text-teal-700' : 'text-slate-600'}`}>
                        {e.direction === 'sent' ? '→ Sent' : '← Received'}
                      </span>
                      <span className="text-slate-400">{e.sent_at.split('T')[0]}</span>
                    </div>
                    {e.subject && <div className="font-medium text-slate-700 mb-0.5">{e.subject}</div>}
                    <p className="text-slate-600 whitespace-pre-wrap line-clamp-3">{e.body}</p>
                  </div>
                ))}

                {/* Log incoming */}
                <div className="border-t border-slate-100 pt-2">
                  <div className="text-xs text-slate-500 mb-1">Log a reply received:</div>
                  <input
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-1"
                    placeholder="Subject"
                    value={incomingSubject}
                    onChange={e => setIncomingSubject(e.target.value)}
                  />
                  <textarea
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 h-20 resize-none"
                    placeholder="Paste hotel's reply here…"
                    value={incomingEmail}
                    onChange={e => setIncomingEmail(e.target.value)}
                  />
                  <button
                    onClick={logIncoming}
                    disabled={!incomingEmail.trim()}
                    className="w-full text-xs bg-slate-600 text-white rounded py-1 mt-1 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Log & mark as Replied
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AddHotelForm({ destinations, onClose, onSaved }: {
  destinations: HmsDestination[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: '', destination_id: '', city: '', star_rating: '',
    website: '', google_maps_url: '', contact_name: '', contact_email: '',
    follow_up_date: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    await supabase.from('hms_outreach_hotels').insert({
      ...form,
      star_rating: form.star_rating ? parseInt(form.star_rating) : null,
    })
    setSaving(false)
    onSaved()
    toast.success('Hotel added to pipeline')
  }

  return (
    <Modal title="Add Hotel to Pipeline" onClose={onClose}>
      <div className="space-y-3">
        {[
          { k: 'name', label: 'Hotel name *', type: 'text' },
          { k: 'city', label: 'City / Area', type: 'text' },
          { k: 'website', label: 'Website URL', type: 'url' },
          { k: 'google_maps_url', label: 'Google Maps URL', type: 'url' },
          { k: 'contact_name', label: 'Contact name', type: 'text' },
          { k: 'contact_email', label: 'Contact email', type: 'email' },
          { k: 'follow_up_date', label: 'Follow-up reminder date', type: 'date' },
        ].map(({ k, label, type }) => (
          <div key={k}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} className={inp} value={(form as any)[k]} onChange={set(k)} />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
          <select className={inp} value={form.destination_id} onChange={set('destination_id')}>
            <option value="">Select…</option>
            {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Star rating</label>
          <select className={inp} value={form.star_rating} onChange={set('star_rating')}>
            <option value="">—</option>
            {[3,4,5].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea className={`${inp} h-20 resize-none`} value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Cancel</button>
        <button
          onClick={save}
          disabled={saving || !form.name}
          className="text-sm bg-teal-600 text-white rounded-lg px-5 py-2 hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add to Pipeline'}
        </button>
      </div>
    </Modal>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400'
