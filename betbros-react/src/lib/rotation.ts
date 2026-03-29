import type { User } from '../types'

export function getSelectorForWeek(weekNumber: number, users: User[]): User {
  const ordered = [...users].sort((a, b) => a.rotation_order - b.rotation_order)
  const index = (weekNumber - 1) % ordered.length
  return ordered[index]
}

export function getWeekDates(weekNumber: number, baseDate: Date): { start: Date; end: Date } {
  const start = new Date(baseDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + (6 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59) * 1000)
  return { start, end }
}

export function getCurrentWeekNumber(baseDate: Date, now: Date = new Date()): number {
  const daysSinceBase = (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceBase < 0) return 1
  return Math.floor(daysSinceBase / 7) + 1
}
