import { describe, it, expect } from 'vitest'
import { getSelectorForWeek, getWeekDates, getCurrentWeekNumber } from '../src/lib/rotation'
import type { User } from '../src/types'
import { BASE_DATE } from '../src/lib/constants'

const users: User[] = [
  { id: '3', username: 'danielsson', display_name: 'Danielsson', rotation_order: 0, is_admin: false, created_at: '' },
  { id: '1', username: 'gardelov', display_name: 'Gärdelöv', rotation_order: 1, is_admin: true, created_at: '' },
  { id: '2', username: 'carlsson', display_name: 'Carlsson', rotation_order: 2, is_admin: false, created_at: '' },
  { id: '4', username: 'seeger', display_name: 'Seeger', rotation_order: 3, is_admin: false, created_at: '' },
]

describe('getSelectorForWeek', () => {
  it('week 1 -> rotation_order 0 (Danielsson)', () => {
    expect(getSelectorForWeek(1, users).username).toBe('danielsson')
  })
  it('week 2 -> rotation_order 1 (Gardelov)', () => {
    expect(getSelectorForWeek(2, users).username).toBe('gardelov')
  })
  it('week 5 wraps back to Danielsson', () => {
    expect(getSelectorForWeek(5, users).username).toBe('danielsson')
  })
  it('handles unsorted users input', () => {
    const shuffled = [...users].reverse()
    expect(getSelectorForWeek(1, shuffled).username).toBe('danielsson')
  })
})

describe('getWeekDates', () => {
  it('week 1 starts on BASE_DATE', () => {
    const { start } = getWeekDates(1, BASE_DATE)
    expect(start.getTime()).toBe(BASE_DATE.getTime())
  })
  it('week 2 starts 7 days later', () => {
    const { start } = getWeekDates(2, BASE_DATE)
    const expected = new Date(BASE_DATE.getTime() + 7 * 24 * 60 * 60 * 1000)
    expect(start.getTime()).toBe(expected.getTime())
  })
  it('end is 6 days 23:59:59 after start', () => {
    const { start, end } = getWeekDates(1, BASE_DATE)
    const expectedEnd = new Date(start.getTime() + (6 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59) * 1000)
    expect(end.getTime()).toBe(expectedEnd.getTime())
  })
})

describe('getCurrentWeekNumber', () => {
  it('returns 1 before base date', () => {
    const before = new Date(Date.UTC(2025, 10, 20))
    expect(getCurrentWeekNumber(BASE_DATE, before)).toBe(1)
  })
  it('returns 1 on base date', () => {
    expect(getCurrentWeekNumber(BASE_DATE, BASE_DATE)).toBe(1)
  })
  it('returns 2 one week after base date', () => {
    const oneWeekLater = new Date(BASE_DATE.getTime() + 7 * 24 * 60 * 60 * 1000)
    expect(getCurrentWeekNumber(BASE_DATE, oneWeekLater)).toBe(2)
  })
})
