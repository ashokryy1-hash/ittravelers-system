import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Search, GitMerge, Building2, CalendarCheck,
  Settings, LayoutDashboard, LogOut, Menu, Map, Users, Globe, Inbox
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const ALL_NAV = [
  { to: '/hms',              label: 'Dashboard',    icon: LayoutDashboard, end: true,  key: 'dashboard' },
  { to: '/hms/leads',        label: 'Leads',        icon: Users,                        key: 'leads' },
  { to: '/hms/discovery',    label: 'Discovery',    icon: Search,                       key: 'discovery' },
  { to: '/hms/outreach',     label: 'Outreach',     icon: GitMerge,                     key: 'outreach' },
  { to: '/hms/rates',        label: 'Rates',        icon: Building2,                    key: 'rates' },
  { to: '/hms/reservations', label: 'Reservations', icon: CalendarCheck,                key: 'reservations' },
  { to: '/hms/tours',        label: 'Tours',        icon: Map,                          key: 'tours' },
  { to: '/hms/trip-explorer', label: 'Trip Explorer', icon: Globe,                       key: 'trip-explorer' },
  { to: '/hms/inbox',        label: 'Inbox',        icon: Inbox,                        key: 'inbox' },
  { to: '/hms/settings',     label: 'Settings',     icon: Settings,                     key: 'settings' },
]

export const MODULE_KEYS = ALL_NAV.map(n => n.key)

export default function HmsLayout() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null) // null = admin (all)

  useEffect(() => {
    async function loadPermissions() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('hms_user_permissions')
        .select('allowed_modules')
        .eq('email', user.email)
        .single()
      // If no row found → admin, sees everything
      setAllowedModules(data ? data.allowed_modules : null)
    }
    loadPermissions()
  }, [])

  const nav = allowedModules === null
    ? ALL_NAV
    : ALL_NAV.filter(n => allowedModules.includes(n.key))

  async function logout() {
    await supabase.auth.signOut()
    navigate('/hms/login')
  }

  return (
    <div className="flex h-screen bg-ivory-100 font-sans">
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed md:static z-30 inset-y-0 left-0 w-60 bg-terracotta-900 text-white flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-terracotta-800">
          <div className="text-terracotta-300 font-bold text-lg">ITTravelers</div>
          <div className="text-ivory-400 text-xs mt-0.5">Hotel Management</div>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors
                 ${isActive ? 'bg-terracotta-600 text-white font-medium' : 'text-ivory-200 hover:bg-terracotta-800 hover:text-white'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-5 py-4 text-sm text-ivory-400 hover:text-white border-t border-terracotta-800 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-ivory-300">
          <button onClick={() => setOpen(true)} className="text-terracotta-700">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-terracotta-800">ITTravelers HMS</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
