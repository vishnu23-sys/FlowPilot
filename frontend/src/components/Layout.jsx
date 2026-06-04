import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm px-3 py-1 rounded ${
        location.pathname === to
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-900 mr-2">FlowPilot</span>
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/expenses', 'Expenses')}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.full_name}</span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  )
}
