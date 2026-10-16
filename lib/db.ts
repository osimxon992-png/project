import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

// Service-role client: server only, bypasses RLS. Lazy so builds work without env.
export function db() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
  return client
}

export type Shop = {
  id: string
  seller_id: number
  slug: string
  name: string
  description: string
  logo_url: string | null
  phone: string
  instagram: string
  telegram: string
  delivery_info: string
  payment_methods: string
  plan: 'free' | 'pro'
  paid_until: string | null
  created_at: string
}

export type Product = {
  id: string
  shop_id: string
  name: string
  price: number
  category: string
  variants: string[]
  images: string[]
  description: string
  available: boolean
}

export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled'

export type Order = {
  id: string
  public_id: string
  shop_id: string
  customer_name: string
  phone: string
  address: string
  comment: string
  total: number
  status: OrderStatus
  created_at: string
  order_items?: { name: string; variant: string; price: number; qty: number }[]
}

export const FREE_PRODUCT_LIMIT = 10

export function isShopActive(shop: Pick<Shop, 'plan' | 'paid_until'>, now = Date.now()) {
  return shop.plan === 'free' || (!!shop.paid_until && new Date(shop.paid_until).getTime() > now)
}

// Trial and paid shops count as "pro" while paid_until is in the future.
export function isPro(shop: Pick<Shop, 'plan' | 'paid_until'>, now = Date.now()) {
  return shop.plan === 'pro' && isShopActive(shop, now)
}
