import { useState, useMemo } from 'react'
import { useTeams } from '../hooks/use-teams'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface TeamAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TeamAutocomplete({ value, onChange, placeholder = 'Sök lag...' }: TeamAutocompleteProps) {
  const { data: teams = [] } = useTeams()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return teams.slice(0, 20)
    const lower = search.toLowerCase()
    return teams.filter((t) => t.name.toLowerCase().includes(lower)).slice(0, 20)
  }, [teams, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input placeholder="Sök..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
        <div className="max-h-60 overflow-y-auto">
          {filtered.map((team) => (
            <button key={team.id} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => { onChange(team.name); setOpen(false); setSearch('') }}>
              {team.name}
              <span className="ml-2 text-xs text-muted-foreground">{team.league}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
