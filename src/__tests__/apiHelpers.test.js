import { describe, it, expect } from 'vitest'
import { unwrap, normalizePage } from '../api/apiHelpers.js'

describe('unwrap', () => {
  it('returns res.data.data', () => {
    expect(unwrap({ data: { data: { id: 1 } } })).toEqual({ id: 1 })
  })

  it('returns undefined when nested data is missing', () => {
    expect(unwrap({ data: {} })).toBeUndefined()
  })
})

describe('normalizePage', () => {
  it('normalizes items-based payload', () => {
    const result = normalizePage({
      items: [{ id: 1 }, { id: 2 }],
      page: 2,
      pageSize: 20,
      total: 50,
      totalPages: 3,
    })
    expect(result.items).toHaveLength(2)
    expect(result.page).toBe(2)
    expect(result.total).toBe(50)
    expect(result.totalPages).toBe(3)
  })

  it('normalizes data-based payload (alternative key)', () => {
    const result = normalizePage({
      data: [{ id: 1 }],
      total: 1,
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe(1)
  })

  it('prefers items over data when both present', () => {
    const result = normalizePage({
      items: [{ from: 'items' }],
      data: [{ from: 'data' }],
    })
    expect(result.items[0].from).toBe('items')
  })

  it('defaults empty when payload is null/undefined', () => {
    const result = normalizePage(null)
    expect(result.items).toEqual([])
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(result.total).toBe(0)
  })

  it('defaults totalPages to 1 when missing', () => {
    const result = normalizePage({ items: [] })
    expect(result.totalPages).toBe(1)
  })

  it('preserves extra fields like maxMarks', () => {
    const result = normalizePage({ items: [], maxMarks: 100, gradeScale: 'A-F' })
    expect(result.maxMarks).toBe(100)
    expect(result.gradeScale).toBe('A-F')
  })

  it('defaults total to items length when total is missing', () => {
    const result = normalizePage({ items: [{ id: 1 }, { id: 2 }, { id: 3 }] })
    expect(result.total).toBe(3)
  })
})
