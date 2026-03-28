import { useState } from 'react'
import { useGameWeeks } from '../hooks/use-game-weeks'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert } from '../components/ui/alert'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import type { User } from '../types'

export function AdminPage() {
  const { data: weeks = [], refetch: refetchWeeks } = useGameWeeks()
  const queryClient = useQueryClient()
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      return (data as User[]).sort((a, b) => a.rotation_order - b.rotation_order)
    },
  })

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleCreateGameWeek() {
    setMessage(null)
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', { body: { type: 'next' } })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: 'Ny vecka skapad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kunde inte skapa vecka' })
    }
  }

  async function handleCreateCancelledWeek() {
    const weekNumber = prompt('Veckonummer att ställa in:')
    if (!weekNumber) return
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', { body: { type: 'cancelled', week_number: parseInt(weekNumber) } })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: `Vecka ${weekNumber} inställd` })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  async function handleCreateCatchupWeek(userId: string) {
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', { body: { type: 'catchup', selector_id: userId } })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: 'Ikappvecka skapad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  async function handleCascadeSelector(weekId: string, selectorId: string) {
    try {
      const { error } = await supabase.functions.invoke('cascade-selector', { body: { week_id: weekId, selector_id: selectorId } })
      if (error) throw error
      await refetchWeeks()
      queryClient.invalidateQueries({ queryKey: queryKeys.gameWeeks.all })
      setMessage({ type: 'success', text: 'Väljare uppdaterad med kaskad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      {message && <Alert variant={message.type === 'error' ? 'destructive' : 'default'}><p>{message.text}</p></Alert>}
      <Card>
        <CardHeader><CardTitle>Åtgärder</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleCreateGameWeek}>Skapa nästa vecka</Button>
          <Button variant="outline" onClick={handleCreateCancelledWeek}>Ställ in vecka</Button>
          {users.map((u) => (
            <Button key={u.id} variant="outline" onClick={() => handleCreateCatchupWeek(u.id)}>Ikappvecka: {u.display_name}</Button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Veckor</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeks.map((week) => {
              const selector = users.find((u) => u.id === week.game_selector_id)
              return (
                <div key={week.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <span className="font-medium">{week.is_catchup ? 'Ikapp' : `V${week.week_number}`}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{selector?.display_name ?? 'Okänd'}</span>
                    {week.is_cancelled && <span className="ml-2 text-sm text-red-600">Inställd</span>}
                  </div>
                  <Select value={week.game_selector_id} onValueChange={(v) => handleCascadeSelector(week.id, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.display_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
