import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './components/protected-route'
import { AdminRoute } from './components/admin-route'
import { Layout } from './components/layout'
import { LoginPage } from './pages/login'
import { DashboardPage } from './pages/dashboard'
import { GameSelectionPage } from './pages/game-selection'
import { EnterResultsPage } from './pages/enter-results'
import { LeaderboardPage } from './pages/leaderboard'
import { StatisticsPage } from './pages/statistics'
import { HistoryPage } from './pages/history'
import { AdminPage } from './pages/admin'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/valj-matcher" element={<GameSelectionPage />} />
              <Route path="/resultat" element={<EnterResultsPage />} />
              <Route path="/tabell" element={<LeaderboardPage />} />
              <Route path="/statistik" element={<StatisticsPage />} />
              <Route path="/historik" element={<HistoryPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
