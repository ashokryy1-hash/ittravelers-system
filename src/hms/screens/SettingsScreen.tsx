import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, saveSetting } from '../lib/settings'
import type { HmsSettings } from '../types'
import { Save, Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { MODULE_KEYS } from '../components/HmsLayout'

const MODULE_LABELS: Record<string, string> = {
  dashboard:    '📊 Dashboard',
  leads:        '👥 Leads',
  discovery:    '🔍 Discovery',
  outreach:     '📨 Outreach',
  rates:        '🏨 Rates',
  reservations: '📅 Reservations',
  tours:        '🗺 Tours',
  'trip-explorer': '🌍 Trip Explorer',
  settings:     '⚙️ Settings',
}

interface UserPermission {
  id: string
  email: string
  allowed_modules: string[]
}

export default function SettingsScreen() {
  const { data, refetch } = useQuery<HmsSettings>({
    queryKey: ['hms_settings'],
    queryFn: getSettings,
  })

  const [form, setForm] = useState<HmsSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  async function save() {
    if (!form) return
    setSaving(true)
    for (const [key, value] of Object.entries(form)) {
      await saveSetting(key, value)
    }
    await refetch()
    setSaving(false)
    toast.success('Settings saved')
  }

  const set = (k: keyof HmsSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => f ? { ...f, [k]: e.target.value } : f)

  if (!form) return <div className="p-6 text-slate-400">Loading…</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      <Section title="Exchange Rates (to EGP)">
        <Field label="IDR → EGP" description="e.g. 0.0018 means 1 IDR = 0.0018 EGP">
          <input type="number" step="0.0001" className={inp} value={form.IDR_to_EGP} onChange={set('IDR_to_EGP')} />
        </Field>
        <Field label="THB → EGP">
          <input type="number" step="0.001" className={inp} value={form.THB_to_EGP} onChange={set('THB_to_EGP')} />
        </Field>
        <Field label="USD → EGP">
          <input type="number" step="0.1" className={inp} value={form.USD_to_EGP} onChange={set('USD_to_EGP')} />
        </Field>
      </Section>

      <Section title="Email — Microsoft Outlook">
        <Field label="Sender email address" description="Your Outlook business email">
          <input type="email" className={inp} value={form.outlook_sender_email} onChange={set('outlook_sender_email')} />
        </Field>
        <Field label="Sender display name">
          <input className={inp} value={form.outlook_sender_name} onChange={set('outlook_sender_name')} />
        </Field>
        <Field label="Agency email signature" description="Appended to every email">
          <textarea className={`${inp} h-24 resize-none`} value={form.agency_signature} onChange={set('agency_signature')} />
        </Field>
      </Section>

      <Section title="API Keys">
        <Field label="Google Places API Key" description="Used for hotel discovery in Module 0">
          <input className={inp} type="password" value={form.google_places_api_key} onChange={set('google_places_api_key')} />
        </Field>
      </Section>

      <Section title="Sales Portal">
        <Field label="Sales portal PIN" description={`Share the link ittravelers-system.vercel.app/sales with your sales team — they enter this PIN to access rates`}>
          <input type="text" maxLength={6} className={inp} value={form.sales_pin ?? ''} onChange={set('sales_pin' as any)} placeholder="e.g. 1234" />
        </Field>
      </Section>

      <Section title="Leads — Meeting Links">
        <Field label="Google Meet / Calendly link" description="Sent automatically when a lead chooses online meeting">
          <input className={inp} value={(form as any).google_meet_link ?? ''} onChange={set('google_meet_link' as any)} placeholder="https://calendly.com/yourname" />
        </Field>
        <Field label="Office address" description="Sent automatically when a lead chooses office meeting">
          <input className={inp} value={(form as any).office_address ?? ''} onChange={set('office_address' as any)} placeholder="e.g. 15 Tahrir St, Dokki, Cairo" />
        </Field>
        <Field label="Sample package link" description="Shared in the Day 5 WhatsApp message — set once, used for all clients automatically">
          <input className={inp} value={(form as any).sample_package_link ?? ''} onChange={set('sample_package_link' as any)} placeholder="https://drive.google.com/… or any link" />
        </Field>
      </Section>

      <Section title="Reminders">
        <Field label="Default follow-up reminder (days)" description="How many days after outreach to set a follow-up reminder">
          <input type="number" className={inp} value={form.followup_reminder_days} onChange={set('followup_reminder_days')} />
        </Field>
      </Section>

      <div className="mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-terracotta-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-terracotta-700 disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <TeamSection />

      {/* Setup guides */}
      <div className="mt-10 space-y-6">
        <SetupGuide
          title="How to get your Google Places API Key"
          steps={[
            'Go to console.cloud.google.com and sign in with your Google account',
            'Click "Select a project" at the top, then "New Project" — name it "ITTravelers"',
            'In the left menu, go to APIs & Services → Library',
            'Search for "Places API" and click Enable',
            'Go to APIs & Services → Credentials',
            'Click "Create Credentials" → "API Key"',
            'Copy the key and paste it in the Google Places API Key field above',
            'Optional but recommended: click "Restrict Key" and limit it to Places API only',
          ]}
        />
        <SetupGuide
          title="How to set up Microsoft Outlook email sending (Azure)"
          steps={[
            'Go to portal.azure.com and sign in with your Microsoft/Outlook account',
            'Click "Azure Active Directory" in the left menu (or search for it)',
            'Click "App registrations" → "New registration"',
            'Name: ITTravelers HMS · Supported account types: "Accounts in any organizational directory and personal Microsoft accounts" · Click Register',
            'Copy the "Application (client) ID" — this is your Client ID',
            'Copy the "Directory (tenant) ID" — this is your Tenant ID',
            'Click "Certificates & secrets" → "New client secret" → Add → Copy the Value immediately (it won\'t show again)',
            'Click "API permissions" → "Add a permission" → "Microsoft Graph" → "Delegated permissions" → search "Mail.Send" → check it → Add',
            'Click "Grant admin consent for [your org]" button',
            'Save your Client ID, Tenant ID, and Client Secret as environment variables in your Supabase project under Settings → Edge Functions',
          ]}
        />
        <SetupGuide
          title="How to add Anthropic API Key (for AI email drafting)"
          steps={[
            'Go to console.anthropic.com and sign in',
            'Click "API Keys" in the left menu',
            'Click "Create Key" — name it "ITTravelers HMS"',
            'Copy the key',
            'In your project, add it as VITE_ANTHROPIC_API_KEY in your .env file',
            'Note: For production, move this to a server-side API route for security',
          ]}
        />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-1">{description}</p>}
      {children}
    </div>
  )
}

function SetupGuide({ title, steps }: { title: string; steps: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-50"
      >
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ol className="px-4 pb-4 space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600">
              <span className="text-terracotta-600 font-bold shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function TeamSection() {
  const qc = useQueryClient()
  const [users, setUsers] = useState<UserPermission[]>([])
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<string[]>(['reservations'])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('hms_user_permissions').select('*').order('created_at')
      .then(({ data }) => { if (data) setUsers(data) })
  }, [])

  function toggleModule(key: string) {
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key])
  }

  async function addUser() {
    if (!email.trim()) return toast.error('Email required')
    if (selected.length === 0) return toast.error('Select at least one module')
    setSaving(true)
    const { data, error } = await supabase.from('hms_user_permissions')
      .upsert({ email: email.trim().toLowerCase(), allowed_modules: selected }, { onConflict: 'email' })
      .select().single()
    setSaving(false)
    if (error) return toast.error(error.message)
    setUsers(u => {
      const existing = u.findIndex(x => x.email === data.email)
      if (existing >= 0) { const copy = [...u]; copy[existing] = data; return copy }
      return [...u, data]
    })
    setEmail('')
    setSelected(['reservations'])
    toast.success('User saved!')
  }

  async function removeUser(id: string) {
    if (!confirm('Remove this user?')) return
    await supabase.from('hms_user_permissions').delete().eq('id', id)
    setUsers(u => u.filter(x => x.id !== id))
    toast.success('User removed')
  }

  async function updateModules(user: UserPermission, key: string) {
    const updated = user.allowed_modules.includes(key)
      ? user.allowed_modules.filter(k => k !== key)
      : [...user.allowed_modules, key]
    await supabase.from('hms_user_permissions').update({ allowed_modules: updated }).eq('id', user.id)
    setUsers(u => u.map(x => x.id === user.id ? { ...x, allowed_modules: updated } : x))
  }

  return (
    <div className="mt-10">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">Team — User Access</h2>
      <p className="text-xs text-slate-400 mb-4">Add team members and choose which modules they can see. Users not listed here have full admin access.</p>

      {/* Add user form */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">User email (must exist in Supabase Auth)</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="e.g. sara@ittravelers.com"
            className={inp}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Modules they can access:</label>
          <div className="flex flex-wrap gap-2">
            {MODULE_KEYS.map(key => (
              <button
                key={key}
                type="button"
                onClick={() => toggleModule(key)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  selected.includes(key)
                    ? 'bg-terracotta-600 text-white border-terracotta-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {MODULE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={addUser}
          disabled={saving}
          className="flex items-center gap-2 bg-terracotta-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-terracotta-700 disabled:opacity-50"
        >
          <UserPlus size={14} />
          {saving ? 'Saving…' : 'Add / Update User'}
        </button>
      </div>

      {/* Existing users */}
      {users.length === 0 ? (
        <p className="text-sm text-slate-400">No team users added yet.</p>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-800">{user.email}</span>
                <button onClick={() => removeUser(user.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {MODULE_KEYS.map(key => (
                  <button
                    key={key}
                    onClick={() => updateModules(user, key)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      user.allowed_modules.includes(key)
                        ? 'bg-terracotta-600 text-white border-terracotta-600'
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    {MODULE_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400'
