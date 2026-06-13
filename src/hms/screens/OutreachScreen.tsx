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

  function buildOutreachTemplate(type: 'initial' | 'followup' | 'rate_received' | 'counter' | 'contract_request' | 'welcome', hotel: HmsOutreachHotel, sig: string) {
    const dest = (hotel as any).hms_destinations?.name ?? 'Bali'

    if (type === 'initial') return {
      subject: `Partnership Inquiry — ITTravelers × ${hotel.name}`,
      body: `Dear Sales Team,

I hope this message finds you well.

My name is Ahmed Shokry, Operations Manager at ITTravelers (InterTeam Travel), an Egyptian travel agency specialising exclusively in honeymoon trips to Southeast Asia.

We work with a growing portfolio of Egyptian and Middle Eastern couples planning their honeymoon in ${dest}, and we are currently expanding our preferred hotel partners in the region.

We already have strong partnerships with top properties through Ini Vie Hospitality and Pramana Group, and we believe ${hotel.name} would be an excellent addition to our collection.

We would love to explore a partnership and kindly request your NET / agent rates or contracted rates for our consideration.

Our clients are high-value honeymoon couples who typically book superior rooms and suites, and Egypt & the Middle East represent a strong and growing market for your property.

Please feel free to reply to this email or share your rate sheet at your convenience. We look forward to a long and fruitful partnership.

${sig}`,
    }

    if (type === 'followup') return {
      subject: `Following Up — ITTravelers Partnership Inquiry | ${hotel.name}`,
      body: `Dear Sales Team,

I hope you are doing well.

I am writing to follow up on my previous email regarding a potential partnership between ITTravelers and ${hotel.name}.

We remain very interested in featuring your property in our honeymoon packages for Egyptian and Middle Eastern clients, and would love to receive your agent / NET rates at your earliest convenience.

Please do not hesitate to reach out if you need any further information about our agency.

${sig}`,
    }

    if (type === 'rate_received') return {
      subject: `Re: Partnership Inquiry — ITTravelers × ${hotel.name}`,
      body: `Dear Sales Team,

Thank you for your reply and for sharing your rate information.

We have reviewed the details and are very interested in moving forward with ${hotel.name} as a preferred partner.

Could you please provide us with the following to proceed:
• Rate sheet or brochure for all room categories
• Meal plan inclusions and supplement costs
• Seasonality breakdown (low / high / peak)
• Honeymoon inclusions or complimentary benefits for our clients
• Cancellation and amendment policy

We look forward to your response and hope to finalise our partnership soon.

${sig}`,
    }

    if (type === 'counter') return {
      subject: `Rate Discussion — ITTravelers × ${hotel.name}`,
      body: `Dear Sales Team,

Thank you for your patience as we reviewed your rate proposal.

We appreciate the offer and are very interested in partnering with ${hotel.name}. To make this work within our pricing structure for Egyptian and Middle Eastern clients, we would like to kindly discuss the NET rates for selected room categories.

Our honeymoon clients typically look for the best value experience, and a competitive NET rate will allow us to actively promote your property across our portfolio.

Could we arrange a brief call or exchange to align on rates that work for both parties?

${sig}`,
    }

    if (type === 'contract_request') return {
      subject: `Contract Request — ITTravelers × ${hotel.name}`,
      body: `Dear Sales Team,

We are pleased to confirm our interest in formalising the partnership with ${hotel.name}.

Could you please share the agent contract or partnership agreement for our review and signature? Please include:
• Agreed NET rates per room category
• Valid period (dates)
• Payment terms and conditions
• Cancellation and no-show policy
• Commission or markup structure (if applicable)

Once we receive and review the contract, we will process the signing promptly and look forward to sending our first booking shortly.

${sig}`,
    }

    // welcome / signed
    return {
      subject: `Partnership Confirmed — ITTravelers × ${hotel.name}`,
      body: `Dear Sales Team,

We are delighted to confirm that ${hotel.name} is now an official partner of ITTravelers.

We look forward to sending our first honeymoon booking soon. Please send us the following to get started:
• Reservations email address
• Preferred booking format (email / booking form)
• Any seasonal promotions or honeymoon packages currently available

Thank you for the warm welcome. We are excited about this partnership and committed to growing together.

${sig}`,
    }
  }

  async function useOutreachTemplate(type: 'initial' | 'followup' | 'rate_received' | 'counter' | 'contract_request' | 'welcome', hotel: HmsOutreachHotel) {
    const settings = await getSettings()
    const sig = settings.agency_signature || 'ITTravelers\nAhmed Shokry – Operations Manager'
    const { subject, body } = buildOutreachTemplate(type, hotel, sig)
    setEmailDraft({ to: hotel.contact_email ?? '', subject, body, hotelId: hotel.id, type })
  }

  async function draftOutreachEmail(hotel: HmsOutreachHotel, type: 'initial' | 'followup') {
    const settings = await getSettings()
    toast.loading('Generating AI draft…', { id: 'draft' })

    const dest = (hotel as any).hms_destinations?.name ?? 'Bali'
    const prompt = type === 'initial'
      ? `Write a professional initial outreach email to ${hotel.name} (a hotel in ${hotel.city}, ${dest}).
The email must: introduce ITTravelers as an Egyptian honeymoon travel agency, mention our Bali portfolio (Ini Vie Hospitality and Pramana Group), request NET/agent rates, highlight our honeymoon specialisation and the Egypt/Middle East market as a strong client base. Be warm, professional, concise.
Agency signature: ${settings.agency_signature}`
      : `Write a polite follow-up email to ${hotel.name} (${hotel.city}). Reference our previous outreach. Reiterate interest in partnering. Brief and friendly.
Agency signature: ${settings.agency_signature}`

    try {
      const res = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const subject = type === 'initial'
        ? `Partnership Inquiry — ITTravelers × ${hotel.name}`
        : `Following Up — ITTravelers Partnership Inquiry | ${hotel.name}`
      toast.dismiss('draft')
      setEmailDraft({ to: hotel.contact_email ?? '', subject, body: data.text ?? '', hotelId: hotel.id, type })
    } catch {
      toast.dismiss('draft')
      toast.error('Failed to generate AI draft. Add Anthropic credits or use the template instead.')
    }
  }

  async function sendEmail(subject: string, body: string, to: string) {
    if (!emailDraft) return
    setSendingEmail(true)
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

    try {
      const settings = await getSettings()
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, senderName: settings.outlook_sender_name }),
      })
    } catch {}

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
                    onTemplate={(type: any) => useOutreachTemplate(type, hotel)}
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
                onTemplate={() => {}}
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

function HotelCard({ hotel, expanded, onToggle, onStageChange, onDraftEmail, onTemplate, stages }: {
  hotel: HmsOutreachHotel
  expanded: boolean
  onToggle: () => void
  onStageChange: (stage: string) => void
  onDraftEmail: (type: 'initial' | 'followup') => void
  onTemplate: (type: 'initial' | 'followup' | 'rate_received' | 'counter' | 'contract_request' | 'welcome') => void
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
            <div className="text-xs font-medium text-slate-400">Email templates (instant)</div>

            {hotel.stage === 'Prospect' && (
              <>
                <button onClick={() => onTemplate('initial')}
                  className="w-full flex items-center justify-center gap-1 text-xs bg-teal-600 text-white rounded-lg py-1.5 hover:bg-teal-700">
                  <Mail size={12} /> Partnership outreach
                </button>
                <button onClick={() => onDraftEmail('initial')}
                  className="w-full flex items-center justify-center gap-1 text-xs border border-slate-200 text-slate-500 rounded-lg py-1.5 hover:bg-slate-50">
                  <Mail size={12} /> AI draft (requires credits)
                </button>
              </>
            )}

            {hotel.stage === 'Contacted' && (
              <>
                <button onClick={() => onTemplate('followup')}
                  className="w-full flex items-center justify-center gap-1 text-xs bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-700">
                  <Send size={12} /> Follow-up (no reply yet)
                </button>
                <button onClick={() => onDraftEmail('followup')}
                  className="w-full flex items-center justify-center gap-1 text-xs border border-slate-200 text-slate-500 rounded-lg py-1.5 hover:bg-slate-50">
                  <Mail size={12} /> AI draft (requires credits)
                </button>
              </>
            )}

            {hotel.stage === 'Replied' && (
              <>
                <button onClick={() => onTemplate('rate_received')}
                  className="w-full flex items-center justify-center gap-1 text-xs bg-purple-600 text-white rounded-lg py-1.5 hover:bg-purple-700">
                  <Mail size={12} /> Thank you + request rate details
                </button>
                <button onClick={() => onTemplate('followup')}
                  className="w-full flex items-center justify-center gap-1 text-xs border border-purple-200 text-purple-700 rounded-lg py-1.5 hover:bg-purple-50">
                  <Send size={12} /> Chase for reply
                </button>
              </>
            )}

            {hotel.stage === 'Negotiating' && (
              <>
                <button onClick={() => onTemplate('counter')}
                  className="w-full flex items-center justify-center gap-1 text-xs bg-amber-600 text-white rounded-lg py-1.5 hover:bg-amber-700">
                  <Mail size={12} /> Rate negotiation
                </button>
                <button onClick={() => onTemplate('contract_request')}
                  className="w-full flex items-center justify-center gap-1 text-xs border border-amber-300 text-amber-700 rounded-lg py-1.5 hover:bg-amber-50">
                  <Mail size={12} /> Request contract
                </button>
              </>
            )}

            {hotel.stage === 'Signed' && (
              <button onClick={() => onTemplate('welcome')}
                className="w-full flex items-center justify-center gap-1 text-xs bg-teal-600 text-white rounded-lg py-1.5 hover:bg-teal-700">
                <Mail size={12} /> Welcome + first booking info
              </button>
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
