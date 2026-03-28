import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BASE_DATE = new Date(Date.UTC(2025, 10, 24))

function getSelectorForWeek(weekNumber: number, users: { id: string; rotation_order: number }[]) {
  const ordered = [...users].sort((a, b) => a.rotation_order - b.rotation_order)
  return ordered[(weekNumber - 1) % ordered.length]
}

function getWeekDates(weekNumber: number) {
  const start = new Date(BASE_DATE.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + (6 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59) * 1000)
  return { start, end }
}

function getCurrentWeekNumber() {
  const days = (Date.now() - BASE_DATE.getTime()) / (1000 * 60 * 60 * 24)
  return days < 0 ? 1 : Math.floor(days / 7) + 1
}

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { type, week_number, selector_id } = await req.json()

  const { data: users } = await supabase.from('users').select('id, rotation_order').order('rotation_order')
  if (!users?.length) return new Response(JSON.stringify({ error: 'No users found' }), { status: 500 })

  if (type === 'next') {
    const currentWeekNumber = getCurrentWeekNumber()
    const nextWeekNumber = currentWeekNumber + 1
    const { data: currentWeek } = await supabase
      .from('game_weeks').select('game_selector_id').eq('week_number', currentWeekNumber).eq('is_catchup', false).maybeSingle()

    let selector
    if (currentWeek) {
      const currentSelector = users.find(u => u.id === currentWeek.game_selector_id)
      if (currentSelector) {
        const ordered = [...users].sort((a, b) => a.rotation_order - b.rotation_order)
        selector = ordered[(currentSelector.rotation_order + 1) % ordered.length]
      } else {
        selector = getSelectorForWeek(nextWeekNumber, users)
      }
    } else {
      selector = getSelectorForWeek(nextWeekNumber, users)
    }

    const { start, end } = getWeekDates(nextWeekNumber)
    const { data, error } = await supabase.from('game_weeks').insert({
      week_number: nextWeekNumber, start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0], game_selector_id: selector.id,
    }).select().single()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify(data))
  }

  if (type === 'cancelled') {
    const { start, end } = getWeekDates(week_number)
    const selector = getSelectorForWeek(week_number, users)
    const { data: existing } = await supabase.from('game_weeks').select('*').eq('week_number', week_number).maybeSingle()

    if (existing) {
      const { data, error } = await supabase.from('game_weeks')
        .update({ is_cancelled: true, is_complete: true }).eq('id', existing.id).select().single()
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      return new Response(JSON.stringify(data))
    }

    const { data, error } = await supabase.from('game_weeks').insert({
      week_number, start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0],
      game_selector_id: selector.id, is_cancelled: true, is_complete: true,
    }).select().single()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify(data))
  }

  if (type === 'catchup') {
    const now = new Date()
    const day = now.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    const weekStart = new Date(now); weekStart.setUTCDate(now.getUTCDate() + diff); weekStart.setUTCHours(0,0,0,0)
    const weekEnd = new Date(weekStart.getTime() + (6*24*60*60 + 23*60*60 + 59*60 + 59) * 1000)

    const { data, error } = await supabase.from('game_weeks').insert({
      week_number: 0, start_date: weekStart.toISOString().split('T')[0],
      end_date: weekEnd.toISOString().split('T')[0], game_selector_id: selector_id, is_catchup: true,
    }).select().single()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify(data))
  }

  return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 })
})
