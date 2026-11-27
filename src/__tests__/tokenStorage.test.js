import { describe, it, expect, beforeEach, vi } from 'vitest'

const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = String(val) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { for (const k in store) delete store[k] }),
}
vi.stubGlobal('localStorage', mockLocalStorage)

const { tokenStorage } = await import('../api/tokenStorage.js')

beforeEach(() => {
  mockLocalStorage.clear()
  vi.clearAllMocks()
})

describe('tokenStorage — tokens', () => {
  it('stores and retrieves access + refresh tokens', () => {
    tokenStorage.setTokens({ accessToken: 'a1', refreshToken: 'r1' })
    expect(tokenStorage.getAccessToken()).toBe('a1')
    expect(tokenStorage.getRefreshToken()).toBe('r1')
  })

  it('updates only access token', () => {
    tokenStorage.setTokens({ accessToken: 'a1', refreshToken: 'r1' })
    tokenStorage.setAccessToken('a2')
    expect(tokenStorage.getAccessToken()).toBe('a2')
    expect(tokenStorage.getRefreshToken()).toBe('r1')
  })

  it('skips refresh token when not provided', () => {
    tokenStorage.setTokens({ accessToken: 'a1' })
    expect(tokenStorage.getAccessToken()).toBe('a1')
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })
})

describe('tokenStorage — user', () => {
  it('stores and retrieves user object', () => {
    const user = { id: '1', name: 'Admin', role: 'ADMIN' }
    tokenStorage.setUser(user)
    expect(tokenStorage.getUser()).toEqual(user)
  })

  it('returns null when no user stored', () => {
    expect(tokenStorage.getUser()).toBeNull()
  })

  it('returns null for corrupted JSON', () => {
    store['sa_user'] = '{invalid'
    expect(tokenStorage.getUser()).toBeNull()
  })
})

describe('tokenStorage — permission cache', () => {
  it('stores and retrieves permission cache', () => {
    const cache = { permissions: { feesView: true }, isSuperAdmin: false, userId: '1', fetchedAt: Date.now() }
    tokenStorage.setPermissionCache(cache)
    expect(tokenStorage.getPermissionCache()).toEqual(cache)
  })

  it('returns null when no cache', () => {
    expect(tokenStorage.getPermissionCache()).toBeNull()
  })

  it('returns null and cleans up corrupted cache', () => {
    store['arise.permissions'] = 'broken{json'
    expect(tokenStorage.getPermissionCache()).toBeNull()
    expect(store['arise.permissions']).toBeUndefined()
  })

  it('clears permission cache', () => {
    tokenStorage.setPermissionCache({ permissions: {} })
    tokenStorage.clearPermissionCache()
    expect(tokenStorage.getPermissionCache()).toBeNull()
  })
})

describe('tokenStorage — clear', () => {
  it('removes all stored items', () => {
    tokenStorage.setTokens({ accessToken: 'a1', refreshToken: 'r1' })
    tokenStorage.setUser({ id: '1' })
    tokenStorage.setPermissionCache({ permissions: {} })
    tokenStorage.clear()
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
    expect(tokenStorage.getUser()).toBeNull()
    expect(tokenStorage.getPermissionCache()).toBeNull()
  })
})
