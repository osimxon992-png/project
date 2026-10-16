import { describe, expect, it } from 'vitest'
import { calcOrder, canTransition } from '@/lib/order'
import type { Product } from '@/lib/db'

const p = (over: Partial<Product>): Product => ({
  id: 'a', shop_id: 's1', name: 'Futbolka', price: 120000, category: '', variants: [], images: [],
  description: '', available: true, ...over,
})

const products = [p({ id: 'a', price: 120000, variants: ['S', 'M'] }), p({ id: 'b', name: 'Kepka', price: 50000 })]

describe('calcOrder', () => {
  it('sums DB prices × qty', () => {
    const r = calcOrder([{ productId: 'a', variant: 'M', qty: 2 }, { productId: 'b', variant: '', qty: 1 }], products)
    expect(r.total).toBe(290000)
    expect(r.items[0]).toMatchObject({ name: 'Futbolka', price: 120000, qty: 2, variant: 'M' })
  })

  it('ignores a price sent by the browser', () => {
    const tampered = [{ productId: 'b', variant: '', qty: 1, price: 1, total: 1 }] as never
    expect(calcOrder(tampered, products).total).toBe(50000)
  })

  it('rejects products from other shops / unknown ids', () => {
    expect(() => calcOrder([{ productId: 'zzz', variant: '', qty: 1 }], products)).toThrow()
  })

  it('rejects unavailable products', () => {
    expect(() => calcOrder([{ productId: 'a', variant: 'S', qty: 1 }], [p({ id: 'a', variants: ['S'], available: false })])).toThrow()
  })

  it('rejects bad quantities and variants', () => {
    expect(() => calcOrder([{ productId: 'b', variant: '', qty: 0 }], products)).toThrow()
    expect(() => calcOrder([{ productId: 'b', variant: '', qty: -3 }], products)).toThrow()
    expect(() => calcOrder([{ productId: 'b', variant: '', qty: 1.5 }], products)).toThrow()
    expect(() => calcOrder([{ productId: 'a', variant: 'XXL', qty: 1 }], products)).toThrow()
    expect(() => calcOrder([], products)).toThrow()
  })
})

describe('canTransition', () => {
  it('follows new → confirmed → delivered, cancel before delivery', () => {
    expect(canTransition('new', 'confirmed')).toBe(true)
    expect(canTransition('confirmed', 'delivered')).toBe(true)
    expect(canTransition('new', 'cancelled')).toBe(true)
    expect(canTransition('new', 'delivered')).toBe(false)
    expect(canTransition('cancelled', 'confirmed')).toBe(false)
    expect(canTransition('delivered', 'cancelled')).toBe(false)
  })
})
