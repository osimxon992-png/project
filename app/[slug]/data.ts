import { cache } from 'react'
import { db, isPro, FREE_PRODUCT_LIMIT, type Product, type Shop } from '@/lib/db'
import { UUID, validateSlug } from '@/lib/validate'

// cache(): layout, page and generateMetadata share one query per request.
export const getShop = cache(async (slug: string) => {
  if (validateSlug(slug)) return null
  const { data } = await db().from('shops').select('*').eq('slug', slug).maybeSingle()
  return data as Shop | null
})

export async function getProducts(shop: Shop) {
  const { data } = await db()
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at')
    .limit(isPro(shop) ? 1000 : FREE_PRODUCT_LIMIT) // shortcut: no pagination, fine below ~1000 products
  return (data ?? []) as Product[]
}

export const getProduct = cache(async (shopId: string, id: string) => {
  if (!UUID.test(id)) return null
  const { data } = await db().from('products').select('*').eq('id', id).eq('shop_id', shopId).maybeSingle()
  return data as Product | null
})
