import { beforeEach, describe, expect, it, vi } from 'vitest'

// Minimal in-memory stand-in for the supabase query builder: filters with eq(), records writes.
type Row = Record<string, unknown>
const tables: Record<string, Row[]> = {}
const writes: { table: string; op: string; payload?: unknown; filters: [string, unknown][] }[] = []

function from(table: string) {
  const filters: [string, unknown][] = []
  let op = 'select'
  let payload: unknown
  const rows = () => (tables[table] ?? []).filter((r) => filters.every(([k, v]) => r[k] === v))
  const q = {
    select: () => q,
    eq: (k: string, v: unknown) => (filters.push([k, v]), q),
    update: (p: unknown) => ((op = 'update'), (payload = p), q),
    insert: (p: unknown) => ((op = 'insert'), (payload = p), q),
    delete: () => ((op = 'delete'), q),
    maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => void) => {
      if (op !== 'select') writes.push({ table, op, payload, filters })
      resolve({ data: rows(), error: null, count: rows().length })
    },
  }
  return q
}

vi.mock('@/lib/db', async (orig) => ({ ...(await orig<typeof import('@/lib/db')>()), db: () => ({ from }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`)
  },
}))

const SHOP_A = { id: 'shop-a', seller_id: 1, plan: 'pro', paid_until: '2999-01-01T00:00:00Z' }
vi.mock('@/lib/session', () => ({
  requireShop: async () => SHOP_A,
  requireSeller: async () => 1,
  getMyShop: async () => SHOP_A,
  clearSession: async () => {},
}))

const { saveProduct, deleteProduct, toggleAvailable } = await import('@/app/dashboard/actions')

const MINE = '11111111-1111-4111-8111-111111111111'
const THEIRS = '22222222-2222-4222-8222-222222222222'

function form(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  writes.length = 0
  tables.products = [
    { id: MINE, shop_id: 'shop-a', name: 'Mine', available: true },
    { id: THEIRS, shop_id: 'shop-b', name: 'Theirs', available: true },
  ]
})

describe("a seller cannot touch another seller's product", () => {
  it('rejects editing', async () => {
    const res = await saveProduct({}, form({ id: THEIRS, name: 'Hacked', price: '1' }))
    expect(res.error).toBe('Mahsulot topilmadi')
    expect(writes).toEqual([])
  })

  it('ignores delete and availability toggle', async () => {
    await deleteProduct(THEIRS)
    await toggleAvailable(THEIRS)
    expect(writes).toEqual([])
  })

  it('still lets the owner edit, scoped to their shop', async () => {
    await expect(saveProduct({}, form({ id: MINE, name: 'Yangi nom', price: '1000' }))).rejects.toThrow('REDIRECT /dashboard/products')
    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatchObject({ table: 'products', op: 'update', payload: { name: 'Yangi nom', price: 1000 } })
    expect(writes[0].filters).toContainEqual(['shop_id', 'shop-a'])
  })
})
