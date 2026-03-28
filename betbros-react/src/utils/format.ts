export function formatCurrency(amount: number): string {
  return `${amount.toFixed(0)} kr`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE')
}

export function betTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    home_win: '1', draw: 'X', away_win: '2',
    over: 'Över', under: 'Under', over_or_under: 'Över/Under',
    exact_score: 'Exakt resultat',
    home_win_to_nil: '1 till noll', away_win_to_nil: '2 till noll',
    home_win_dnb: '1 DNB', away_win_dnb: '2 DNB',
    home_win_ah: '1 AH', away_win_ah: '2 AH',
    home_win_h3w: '1 H3W', draw_h3w: 'X H3W', away_win_h3w: '2 H3W',
  }
  return labels[type] ?? type
}

export function betStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Väntar', won: 'Vunnen', lost: 'Förlorad', refunded: 'Återbetald',
  }
  return labels[status] ?? status
}

export function gameKindLabel(betKind: string): string {
  const labels: Record<string, string> = {
    home_win: '1X2', draw: '1X2', away_win: '1X2',
    over_or_under: 'Över/Under', exact_score: 'Exakt resultat',
    home_win_ah: 'Asian Handicap', away_win_ah: 'Asian Handicap',
    home_win_h3w: 'Handicap 3-vägs', draw_h3w: 'Handicap 3-vägs', away_win_h3w: 'Handicap 3-vägs',
  }
  return labels[betKind] ?? betKind
}
