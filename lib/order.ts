import { randomBytes } from 'node:crypto'
import type { OrderStatus, Product } from './db'

export type CartLine = { productId: string; variant: string; qty: number }

export const MAX_QTY = 99

// Whatever the browser sends, prices come from the DB rows only.
export function calcOrder(lines: CartLine[], products: Product[]) {
  if (!Array.isArray(lines) || lines.length === 0) throw new Error("Savat bo'sh")
  if (lines.length > 50) throw new Error("Savatda juda ko'p mahsulot")
  const byId = new Map(products.map((p) => [p.id, p]))
  const items = lines.map((l) => {
    const p = byId.get(String(l?.productId))
    if (!p || !p.available) throw new Error('Mahsulot mavjud emas')
    const qty = Number(l.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new Error("Noto'g'ri miqdor")
    const variant = String(l.variant ?? '')
    if (p.variants.length ? !p.variants.includes(variant) : variant !== '') throw new Error("Noto'g'ri variant")
    return { product_id: p.id, name: p.name, variant, price: p.price, qty }
  })
  return { items, total: items.reduce((s, i) => s + i.price * i.qty, 0) }
}

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return NEXT[from]?.includes(to) ?? false
}

export function nextStatuses(from: OrderStatus) {
  return NEXT[from]
}

export function newPublicId() {
  return randomBytes(8).toString('base64url') // 11 chars, unguessable
}
