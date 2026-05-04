import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { MessageSquare, Phone, Users, User, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore }  from '../../store/authStore.js'
import { useChatStore }  from '../../store/chatStore.js'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const NAV = [
  { to: '/',         icon: MessageSquare, label: 'Chats' },
  { to: '/contacts', icon: Users,         label: 'Contacts' },
  { to: '/calls',    icon: Phone,         label: 'Calls' },
  { to: '/profile',  icon: User,          label: 'Profile' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { chats }        = useChatStore()
  const navigate         = useNavigate()

  const totalUnseen = chats.reduce((n, c) => n + (c.chat.unseencount || 0), 0)

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast.success('Logged out securely')
  }

  return (
    <aside className="w-16 flex flex-col items-center py-4 bg-surface-900 border-r border-surface-800">
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-6">
        <ShieldCheck className="w-4 h-4 text-accent" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ to, icon: Icon, label }) => {
          const badge = label === 'Chats' && totalUnseen > 0
          return (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx(
                'relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150',
                isActive ? 'bg-accent/20 text-accent' : 'text-surface-200/40 hover:text-white hover:bg-surface-800'
              )}
              title={label}
            >
              <Icon className="w-5 h-5" />
              {badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
                  {totalUnseen > 9 ? '9+' : totalUnseen}
                </span>
              )}
              {/* Tooltip */}
              <span className="absolute left-12 bg-surface-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border border-surface-800">
                {label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* Avatar + Logout */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-sm font-bold text-accent uppercase">
          {user?.name?.[0] || '?'}
        </div>
        <button onClick={handleLogout} title="Logout"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-surface-200/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
