'use server'

import { createHash } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { db, isShopActive, type Order, type Product } from '@/lib/db'
import { calcOrder, newPublicId, type CartLine } from '@/lib/order'
import { notifyNewOrder } from '@/lib/orders'
import { normalizePhone, UUID } from '@/lib/validate'
import { getShop } from './data'

export async function setLang(formData: FormData) {
  ;(await cookies()).set('lang', formData.get('lang') === 'ru' ? 'ru' : 'uz', { maxAge: 365 * 24 * 3600, path: '/' })
}

export type OrderState = { error?: string; publicId?: string }

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000

export async function placeOrder(slug: string, _prev: OrderState, formData: FormData): Promise<OrderState> {
  if (formData.get('website')) return { error: "Buyurtma qabul qilinmadi" } // honeypot: humans never see this field

  const shop = await getShop(slug)
  if (!shop || !isShopActive(shop)) return { error: "Do'kon vaqtincha yopiq" }

  const str = (k: string) => String(formData.get(k) ?? '').trim()
  const name = str('name')
  const phone = normalizePhone(str('phone'))
  const address = str('address')
  const comment = str('comment')
  if (name.length < 2 || name.length > 100) return { error: 'Ismingizni kiriting' }
  if (!phone) return { error: "Telefon raqam +998 XX XXX XX XX formatida bo'lishi kerak" }
  if (address.length < 5 || address.length > 500) return { error: "Manzilni to'liq kiriting" }
  if (comment.length > 1000) return { error: 'Izoh juda uzun' }

  let lines: CartLine[]
  try {
    lines = JSON.parse(str('items'))
  } catch {
    return { error: "Savat ma'lumoti noto'g'ri" }
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  const ipHash = createHash('sha256').update(`ip:${ip}`).digest('hex')
  const { count } = await db()
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - RATE_WINDOW_MS).toISOString())
  if ((count ?? 0) >= RATE_LIMIT) return { error: "Juda ko'p buyurtma. 10 daqiqadan keyin urinib ko'ring." }

  const ids = Array.isArray(lines) ? [...new Set(lines.map((l) => String(l?.productId)).filter((id) => UUID.test(id)))] : []
  const { data: products } = ids.length
    ? await db().from('products').select('*').eq('shop_id', shop.id).in('id', ids)
    : { data: [] }

  let calc: ReturnType<typeof calcOrder>
  try {
    calc = calcOrder(lines, (products ?? []) as Product[])
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { data: order, error } = await db()
    .from('orders')
    .insert({ public_id: newPublicId(), shop_id: shop.id, customer_name: name, phone, address, comment, total: calc.total, ip_hash: ipHash })
    .select()
    .single()
  if (error || !order) {
    console.error('order insert', error)
    return { error: "Xatolik yuz berdi, qaytadan urinib ko'ring" }
  }
  const { error: itemsError } = await db().from('order_items').insert(calc.items.map((i) => ({ ...i, order_id: order.id })))
  if (itemsError) {
    console.error('order_items insert', itemsError)
    await db().from('orders').delete().eq('id', order.id)
    return { error: "Xatolik yuz berdi, qaytadan urinib ko'ring" }
  }

  await notifyNewOrder(shop, order as Order, calc.items)
  return { publicId: order.public_id }
}
