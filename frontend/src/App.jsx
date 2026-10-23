import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PreferencesProvider, usePreferences } from './lib/preferences'
import { SheetsProvider } from './lib/sheets'
import { queryClient } from './api/queries'
import { TooltipProvider } from './components/ui/Controls'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/shell/AppShell'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Income = lazy(() => import('./pages/Income'))
const Budgets = lazy(() => import('./pages/Budgets'))
const Debts = lazy(() => import('./pages/Debts'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Goals = lazy(() => import('./pages/Goals'))
const Settings = lazy(() => import('./pages/Settings'))

function Motion({ children }) {
  const { reduceMotion } = usePreferences()
  return <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>{children}</MotionConfig>
}

/** Logged-in visitors skip the marketing and auth pages. */
function PublicOnly({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/dashboard" replace /> : children
}

const toastOptions = {
  className: '!bg-raised !text-fg !border !border-line !rounded-[10px] !shadow-pop !text-sm !px-3 !py-2',
  success: { iconTheme: { primary: 'rgb(var(--success))', secondary: 'rgb(var(--raised))' } },
  error: { iconTheme: { primary: 'rgb(var(--danger))', secondary: 'rgb(var(--raised))' } },
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <Motion>
          <AuthProvider>
            <TooltipProvider>
              <BrowserRouter>
                <SheetsProvider>
                  <Suspense fallback={null}>
                    <Routes>
                      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
                      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
                      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
                      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/income" element={<Income />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="/subscriptions" element={<Subscriptions />} />
                        <Route path="/debts" element={<Debts />} />
                        <Route path="/goals" element={<Goals />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<Settings />} />
                      </Route>
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </SheetsProvider>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </Motion>
      </PreferencesProvider>
      <Toaster position="bottom-center" toastOptions={toastOptions} />
    </QueryClientProvider>
  )
}
