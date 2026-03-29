import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scoreBet, GameStatus } from '../_shared/scoring.ts'

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Get the calling user via their JWT
  const authHeader = req.headers.get('Authorization')!
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { game_id, home_score, away_score } = await req.json()

  // Fetch game and its week
  const { data: game } = await supabaseAdmin.from('games').select('*, game_weeks(*)').eq('id', game_id).single()
  if (!game) return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 })

  // Check authorization
  const { data: callerUser } = await supabaseAdmin.from('users').select('*').eq('id', user.id).single()
  const isSelector = game.game_weeks.game_selector_id === user.id
  const isAdmin = callerUser?.is_admin ?? false
  if (!isSelector && !isAdmin) return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 })

  // Update game
  const { error: updateError } = await supabaseAdmin
    .from('games').update({ home_score, away_score, status: 'completed' }).eq('id', game_id)
  if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })

  // Score all bets
  const { data: bets } = await supabaseAdmin.from('bets').select('*').eq('game_id', game_id)
  const updatedGame = { ...game, home_score, away_score, status: GameStatus.Completed }

  for (const bet of bets ?? []) {
    const status = scoreBet(bet, updatedGame)
    await supabaseAdmin.from('bets').update({ status, scored_at: new Date().toISOString() }).eq('id', bet.id)
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
