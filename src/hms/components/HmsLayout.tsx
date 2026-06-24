import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Search, GitMerge, Building2, CalendarCheck,
  Settings, LayoutDashboard, LogOut, Menu, X, Map, Users
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { to: '/hms', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/hms/leads', label: 'Leads', icon: Users },
  { to: '/hms/discovery', label: 'Discovery', icon: Search },
  { to: '/hms/outreach', label: 'Outreach', icon: GitMerge },
  { to: '/hms/rates', label: 'Rates', icon: Building2 },
  { to: '/hms/reservations', label: 'Reservations', icon: CalendarCheck },
  { to: '/hms/tours', label: 'Tours', icon: Map },
  { to: '/hms/settings', label: 'Settings', icon: Settings },
]

export default function HmsLayout() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    navigate('/hms/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 inset-y-0 left-0 w-60 bg-slate-900 text-white flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="text-teal-400 font-bold text-lg">ITTravelers</div>
          <div className="text-slate-400 text-xs mt-0.5">Hotel Management</div>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors
                 ${isActive
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-5 py-4 text-sm text-slate-400 hover:text-white border-t border-slate-700 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="text-slate-600">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-800">ITTravelers HMS</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
