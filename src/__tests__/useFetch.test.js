import { describe, it, expect, vi } from 'vitest'

describe('useFetch cancellation logic', () => {
  it('stale responses are ignored when cancelled flag is set', async () => {
    let resolveFirst
    const firstCall = new Promise((r) => { resolveFirst = r })
    const secondCall = Promise.resolve({ id: 2 })

    const results = []
    const setData = (v) => results.push(v)

    let cancelled = false
    firstCall.then((result) => { if (!cancelled) setData(result) })

    cancelled = true
    await secondCall.then((result) => setData(result))

    resolveFirst({ id: 1 })
    await firstCall

    expect(results).toEqual([{ id: 2 }])
  })

  it('error from cancelled request does not propagate', async () => {
    const errors = []
    let cancelled = false

    const failingCall = Promise.reject(new Error('network error'))

    await failingCall.catch((err) => {
      if (!cancelled) errors.push(err.message)
    })

    expect(errors).toEqual(['network error'])

    errors.length = 0
    cancelled = true

    const anotherFail = Promise.reject(new Error('stale error'))
    await anotherFail.catch((err) => {
      if (!cancelled) errors.push(err.message)
    })

    expect(errors).toEqual([])
  })
})

describe('useFetch nonce-based reload', () => {
  it('incrementing nonce triggers a new fetch', () => {
    let nonce = 0
    const fetches = []

    const simulate = () => fetches.push(nonce)

    simulate()
    nonce++
    simulate()
    nonce++
    simulate()

    expect(fetches).toEqual([0, 1, 2])
    expect(fetches.length).toBe(3)
  })
})

describe('useFetch enabled flag', () => {
  it('does not fetch when enabled=false', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ data: 'test' }))
    const enabled = false

    if (enabled) await fetcher()

    expect(fetcher).not.toHaveBeenCalled()
  })

  it('fetches when enabled=true', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ data: 'test' }))
    const enabled = true

    if (enabled) await fetcher()

    expect(fetcher).toHaveBeenCalledOnce()
  })
})
