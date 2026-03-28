import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inloggning misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">BetBros</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><p>{error}</p></Alert>}
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loggar in...' : 'Logga in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
