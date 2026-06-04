import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function TopNavbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-[#050a15] border-b border-white/[0.06] flex items-center px-5 gap-4 shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden text-slate-500 hover:text-white transition-colors p-1"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 hover:bg-white/5 rounded-xl px-3 py-2 transition-colors"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200 leading-none">{user?.full_name}</p>
            <p className="text-xs text-slate-600 mt-0.5">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl overflow-hidden z-50 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-xs font-medium text-slate-300 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-600 mt-0.5 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => { navigate('/settings'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors rounded-lg"
              >
                <Settings size={14} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-lg"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
