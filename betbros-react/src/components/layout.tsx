import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: 'Hem' },
  { to: '/valj-matcher', label: 'Matcher' },
  { to: '/resultat', label: 'Resultat' },
  { to: '/tabell', label: 'Tabell' },
  { to: '/statistik', label: 'Statistik' },
  { to: '/historik', label: 'Historik' },
]

export function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold">BetBros</Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <Link key={to} to={to}
                className={cn('rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent', location.pathname === to && 'bg-accent')}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin"
                className={cn('rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent', location.pathname === '/admin' && 'bg-accent')}>
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.display_name}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>Logga ut</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
