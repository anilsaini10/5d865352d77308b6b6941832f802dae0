import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate, formatDay, addDays, formatDateTime, formatDateRange,
  formatTime, formatCurrency, formatNumber, toDateInput, toDateTimeInput,
  fromDateTimeInput, experienceLabel, titleCase, cleanParams, timeAgo,
} from '../utils/format.js'

describe('cleanParams', () => {
  it('removes undefined, null, and empty string values', () => {
    expect(cleanParams({ a: 1, b: undefined, c: '', d: null, e: 'ok' }))
      .toEqual({ a: 1, e: 'ok' })
  })

  it('keeps zero and false', () => {
    expect(cleanParams({ a: 0, b: false })).toEqual({ a: 0, b: false })
  })

  it('returns empty object for all-empty input', () => {
    expect(cleanParams({ a: undefined, b: null, c: '' })).toEqual({})
  })
})

describe('formatDate', () => {
  it('returns dash for falsy input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('formats a valid ISO string', () => {
    const result = formatDate('2024-03-15T00:00:00Z')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatDay', () => {
  it('returns dash for falsy input', () => {
    expect(formatDay(null)).toBe('—')
  })

  it('formats YYYY-MM-DD without timezone shift', () => {
    const result = formatDay('2024-01-05')
    expect(result).toMatch(/05/)
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })
})

describe('addDays', () => {
  it('adds days correctly', () => {
    expect(addDays('2024-01-01', 5)).toBe('2024-01-06')
  })

  it('crosses month boundary', () => {
    expect(addDays('2024-01-30', 3)).toBe('2024-02-02')
  })

  it('subtracts days with negative n', () => {
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
  })
})

describe('formatTime', () => {
  it('returns dash for falsy input', () => {
    expect(formatTime(null)).toBe('—')
    expect(formatTime('')).toBe('—')
  })

  it('converts 24h to 12h format', () => {
    expect(formatTime('14:05')).toBe('2:05 PM')
    expect(formatTime('09:30')).toBe('9:30 AM')
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
  })
})

describe('formatCurrency', () => {
  it('returns dash for null/undefined/empty', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
    expect(formatCurrency('')).toBe('—')
  })

  it('formats as INR', () => {
    const result = formatCurrency(1500)
    expect(result).toMatch(/1,500/)
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toMatch(/0/)
  })
})

describe('formatNumber', () => {
  it('formats with Indian locale', () => {
    expect(formatNumber(100000)).toMatch(/1,00,000/)
  })

  it('defaults to 0 for null/undefined', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })
})

describe('formatDateRange', () => {
  it('shows single date when to is falsy', () => {
    const result = formatDateRange('2024-03-15T00:00:00Z', null)
    expect(result).toMatch(/15/)
  })

  it('shows single date when from and to are the same day', () => {
    const result = formatDateRange('2024-03-15T10:00:00Z', '2024-03-15T18:00:00Z')
    expect(result).toMatch(/15/)
    expect(result).not.toMatch(/–/)
  })

  it('shows range when dates differ', () => {
    const result = formatDateRange('2024-03-15T00:00:00Z', '2024-03-20T00:00:00Z')
    expect(result).toMatch(/–/)
  })
})

describe('toDateInput', () => {
  it('returns empty string for falsy', () => {
    expect(toDateInput(null)).toBe('')
    expect(toDateInput('')).toBe('')
  })

  it('returns empty for invalid date', () => {
    expect(toDateInput('not-a-date')).toBe('')
  })

  it('formats as YYYY-MM-DD', () => {
    const result = toDateInput(new Date(2024, 2, 15))
    expect(result).toBe('2024-03-15')
  })
})

describe('toDateTimeInput / fromDateTimeInput', () => {
  it('returns empty for falsy', () => {
    expect(toDateTimeInput(null)).toBe('')
  })

  it('returns undefined for empty', () => {
    expect(fromDateTimeInput('')).toBeUndefined()
  })

  it('round-trips correctly', () => {
    const iso = new Date(2024, 2, 15, 14, 30).toISOString()
    const local = toDateTimeInput(iso)
    expect(local).toMatch(/2024-03-15T14:30/)
    const back = fromDateTimeInput(local)
    expect(back).toBeTruthy()
  })
})

describe('experienceLabel', () => {
  it('returns Fresher for zero', () => {
    expect(experienceLabel(0, 0)).toBe('Fresher')
  })

  it('formats years and months', () => {
    expect(experienceLabel(2, 6)).toBe('2 yrs 6 mo')
    expect(experienceLabel(1, 0)).toBe('1 yr')
    expect(experienceLabel(0, 3)).toBe('3 mo')
  })
})

describe('titleCase', () => {
  it('returns empty for falsy', () => {
    expect(titleCase('')).toBe('')
    expect(titleCase(null)).toBe('')
  })

  it('capitalizes first letter and lowercases rest', () => {
    expect(titleCase('HELLO')).toBe('Hello')
  })

  it('replaces underscores with spaces', () => {
    expect(titleCase('SOME_STATUS')).toBe('Some status')
  })
})

describe('timeAgo', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns dash for falsy', () => {
    expect(timeAgo(null)).toBe('—')
    expect(timeAgo('')).toBe('—')
  })

  it('returns "just now" for < 1 min', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    vi.setSystemTime(now)
    expect(timeAgo(new Date(now - 30000).toISOString())).toBe('just now')
  })

  it('returns minutes ago', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    vi.setSystemTime(now)
    expect(timeAgo(new Date(now - 5 * 60000).toISOString())).toBe('5m ago')
  })

  it('returns hours ago', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    vi.setSystemTime(now)
    expect(timeAgo(new Date(now - 3 * 3600000).toISOString())).toBe('3h ago')
  })

  it('returns days ago', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    vi.setSystemTime(now)
    expect(timeAgo(new Date(now - 7 * 86400000).toISOString())).toBe('7d ago')
  })

  it('falls back to formatted date after 30 days', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    vi.setSystemTime(now)
    const result = timeAgo(new Date(now - 45 * 86400000).toISOString())
    expect(result).not.toMatch(/ago/)
    expect(result).toMatch(/2024/)
  })
})
