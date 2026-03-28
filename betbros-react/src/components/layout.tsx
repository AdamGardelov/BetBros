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
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold tracking-tight text-primary">
            BetBros
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label }) => (
              <Link key={to} to={to}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  location.pathname === to ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin"
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  location.pathname === '/admin' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}>
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{user?.display_name}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              Logga ut
            </Button>
          </div>
        </div>
      </header>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(({ to, label }) => (
            <Link key={to} to={to}
              className={cn(
                'flex flex-col items-center px-2 py-1 text-xs font-medium transition-colors',
                location.pathname === to ? 'text-primary' : 'text-muted-foreground'
              )}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
