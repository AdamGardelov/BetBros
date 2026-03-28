import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: 'Hem' },
  { to: '/valj-matcher', label: 'Spel' },
  { to: '/resultat', label: 'Resultat' },
  { to: '/tabell', label: 'Tabell' },
  { to: '/statistik', label: 'Stats' },
  { to: '/historik', label: 'Historik' },
]

export function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Desktop header */}
      <header className="sticky top-0 z-50 hidden border-b border-border/40 bg-background/90 backdrop-blur-xl md:block">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">Bet</span><span className="text-foreground">Bros</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {navItems.map(({ to, label }) => (
              <Link key={to} to={to}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
                  location.pathname === to
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin"
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
                  location.pathname === '/admin'
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}>
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.display_name}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link to="/" className="text-lg font-bold tracking-tight">
            <span className="text-primary">Bet</span><span className="text-foreground">Bros</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{user?.display_name}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="h-7 px-2 text-xs text-muted-foreground">
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 pb-20 md:px-6 md:py-8 md:pb-8 animate-in relative z-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav - frosted glass */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/30 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex items-stretch">
          {navItems.map(({ to, label }) => (
            <Link key={to} to={to}
              className={cn(
                'flex flex-1 items-center justify-center py-3 text-[11px] font-medium tracking-wide transition-colors',
                location.pathname === to ? 'text-primary' : 'text-muted-foreground'
              )}>
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin"
              className={cn(
                'flex flex-1 items-center justify-center py-3 text-[11px] font-medium tracking-wide transition-colors',
                location.pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'
              )}>
              Admin
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
