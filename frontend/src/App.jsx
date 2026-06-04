import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Debts from './pages/Debts'
import Subscriptions from './pages/Subscriptions'
import Analytics from './pages/Analytics'
import Goals from './pages/Goals'
import Settings from './pages/Settings'

const TOAST_STYLE = {
  style: {
    background: '#0c1325',
    color: '#f1f5f9',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    fontSize: '13px',
    padding: '10px 14px',
  },
  success: { iconTheme: { primary: '#10b981', secondary: '#0c1325' } },
  error:   { iconTheme: { primary: '#ef4444', secondary: '#0c1325' } },
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/expenses"      element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/debts"         element={<ProtectedRoute><Debts /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
          <Route path="/analytics"     element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/goals"         element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" toastOptions={TOAST_STYLE} />
    </AuthProvider>
  )
}

export default App
