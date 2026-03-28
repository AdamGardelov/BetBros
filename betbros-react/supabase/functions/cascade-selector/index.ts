import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { week_id, selector_id } = await req.json()

  const { data: week } = await supabase.from('game_weeks').select('*').eq('id', week_id).single()
  if (!week) return new Response(JSON.stringify({ error: 'Week not found' }), { status: 404 })

  const { data: users } = await supabase.from('users').select('*').order('rotation_order')
  const selector = users?.find((u) => u.id === selector_id)
  if (!selector) return new Response(JSON.stringify({ error: 'Selector not found' }), { status: 404 })

  await supabase.from('game_weeks').update({ game_selector_id: selector_id }).eq('id', week_id)

  const { data: futureWeeks } = await supabase.from('game_weeks').select('*').gt('week_number', week.week_number).order('week_number')
  const ordered = [...(users ?? [])].sort((a, b) => a.rotation_order - b.rotation_order)

  for (const fw of futureWeeks ?? []) {
    const { data: games } = await supabase.from('games').select('id').eq('game_week_id', fw.id).limit(1)
    if (games && games.length > 0) break
    const nextOrder = (selector.rotation_order + (fw.week_number - week.week_number)) % ordered.length
    await supabase.from('game_weeks').update({ game_selector_id: ordered[nextOrder].id }).eq('id', fw.id)
  }

  return new Response(JSON.stringify({ success: true }))
})
