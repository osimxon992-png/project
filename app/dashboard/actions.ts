'use server'

import { randomUUID } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { writeDescription } from '@/lib/ai'
import { db, FREE_PRODUCT_LIMIT, isPro, type OrderStatus } from '@/lib/db'
import { parseProductsFile } from '@/lib/import'
import { changeOrderStatus } from '@/lib/orders'
import { clearSession, getMyShop, requireSeller, requireShop } from '@/lib/session'
import { normalizePhone, normalizeSocial, UUID, validateSlug } from '@/lib/validate'

export type FormState = { error?: string; errors?: string[]; ok?: string }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max)

// Uploaded files live under images/<seller telegram id>/, so a URL proves who uploaded it.
const isOwnImage = (url: string, sellerId: number) =>
  url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${sellerId}/`)

export async function logout() {
  await clearSession()
  redirect('/')
}

// ---------- Shop ----------

export async function checkSlug(slug: string) {
  const sellerId = await requireSeller()
  const err = validateSlug(slug)
  if (err) return err
  const { data } = await db().from('shops').select('seller_id').eq('slug', slug).maybeSingle()
  return data && data.seller_id !== sellerId ? 'Bu manzil band, boshqasini tanlang' : null
}

export async function saveShop(_: FormState, fd: FormData): Promise<FormState> {
  const sellerId = await requireSeller()
  const existing = await getMyShop(sellerId)

  const name = text(fd, 'name', 100)
  const slug = text(fd, 'slug', 60).toLowerCase()
  const phoneRaw = text(fd, 'phone', 30)
  const phone = phoneRaw ? normalizePhone(phoneRaw) : ''
  const instagram = normalizeSocial('instagram', text(fd, 'instagram', 200))
  const telegram = normalizeSocial('telegram', text(fd, 'telegram', 200))
  const logo = text(fd, 'logo_url', 500)

  if (!name) return { error: "Do'kon nomini kiriting" }
  const slugError = validateSlug(slug)
  if (slugError) return { error: slugError }
  if (phone === null) return { error: "Telefon +998 XX XXX XX XX formatida bo'lsin" }
  if (instagram === null) return { error: "Instagram: @username yoki havola kiriting" }
  if (telegram === null) return { error: "Telegram: @username yoki t.me havolasini kiriting" }
  if (logo && !isOwnImage(logo, sellerId)) return { error: "Logo noto'g'ri" }

  const fields = {
    name, slug, phone, instagram, telegram,
    logo_url: logo || null,
    description: text(fd, 'description', 500),
    delivery_info: text(fd, 'delivery_info', 1000),
    payment_methods: text(fd, 'payment_methods', 500),
  }
  const { error } = existing
    ? await db().from('shops').update(fields).eq('id', existing.id)
    : await db().from('shops').insert({
        ...fields,
        seller_id: sellerId,
        plan: 'pro',
        paid_until: new Date(Date.now() + 14 * 86400_000).toISOString(), // 14-day trial
      })
  if (error) {
    if (error.code === '23505') return { error: 'Bu manzil band, boshqasini tanlang' }
    console.error('saveShop', error)
    return { error: "Saqlab bo'lmadi, qaytadan urinib ko'ring" }
  }
  if (!existing) redirect('/dashboard')
  return { ok: 'Saqlandi' }
}

// ---------- Images ----------

function looksLikeImage(b: Uint8Array, type: string) {
  if (type === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (type === 'image/png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  return String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP'
}

// shortcut: files of deleted products / abandoned forms stay in storage; add a cleanup job if storage cost matters.
export async function uploadImage(fd: FormData): Promise<{ url?: string; error?: string }> {
  const sellerId = await requireSeller()
  const file = fd.get('file')
  if (!(file instanceof File)) return { error: 'Fayl tanlanmagan' }
  const ext = IMAGE_EXT[file.type]
  if (!ext) return { error: 'Faqat JPEG, PNG yoki WEBP' }
  if (file.size > MAX_IMAGE_BYTES) return { error: '5 MB dan katta rasm' }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!looksLikeImage(bytes, file.type)) return { error: "Fayl rasm emas" }

  const path = `${sellerId}/${randomUUID()}.${ext}`
  const { error } = await db().storage.from('images').upload(path, bytes, { contentType: file.type })
  if (error) {
    console.error('upload', error)
    return { error: "Rasmni yuklab bo'lmadi" }
  }
  return { url: db().storage.from('images').getPublicUrl(path).data.publicUrl }
}

// ---------- Products ----------

// Ownership check for every product mutation: load the row, compare with the session's shop.
async function ownedProduct(id: string, shopId: string) {
  if (!UUID.test(id)) return null
  const { data } = await db().from('products').select('id, shop_id, available').eq('id', id).maybeSingle()
  return data && data.shop_id === shopId ? data : null
}

async function productCount(shopId: string) {
  const { count } = await db().from('products').select('id', { count: 'exact', head: true }).eq('shop_id', shopId)
  return count ?? 0
}

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const shop = await requireShop()
  const id = text(fd, 'id', 60)

  if (id) {
    if (!(await ownedProduct(id, shop.id))) return { error: 'Mahsulot topilmadi' }
  } else if (!isPro(shop) && (await productCount(shop.id)) >= FREE_PRODUCT_LIMIT) {
    return { error: `Bepul tarifda ${FREE_PRODUCT_LIMIT} tagacha mahsulot. Obunani uzaytiring.` }
  }

  const name = text(fd, 'name', 200)
  const priceRaw = text(fd, 'price', 20).replace(/\s/g, '')
  const images = fd.getAll('images').map(String).filter(Boolean)
  if (!name) return { error: 'Mahsulot nomini kiriting' }
  if (!/^\d{1,10}$/.test(priceRaw)) return { error: "Narx butun son bo'lsin (so'mda)" }
  if (images.length > 5) return { error: '5 tagacha rasm' }
  if (images.some((u) => !isOwnImage(u, shop.seller_id))) return { error: "Rasm noto'g'ri" }

  const fields = {
    name,
    price: Number(priceRaw),
    category: text(fd, 'category', 100),
    variants: text(fd, 'variants', 500).split(',').map((v) => v.trim()).filter(Boolean).slice(0, 30),
    images,
    description: text(fd, 'description', 3000),
    available: fd.get('available') === 'on',
  }
  const { error } = id
    ? await db().from('products').update(fields).eq('id', id).eq('shop_id', shop.id)
    : await db().from('products').insert({ ...fields, shop_id: shop.id })
  if (error) {
    console.error('saveProduct', error)
    return { error: "Saqlab bo'lmadi" }
  }
  redirect('/dashboard/products')
}

export async function deleteProduct(id: string) {
  const shop = await requireShop()
  if (!(await ownedProduct(id, shop.id))) return
  await db().from('products').delete().eq('id', id).eq('shop_id', shop.id)
  revalidatePath('/dashboard/products')
}

export async function toggleAvailable(id: string) {
  const shop = await requireShop()
  const p = await ownedProduct(id, shop.id)
  if (!p) return
  await db().from('products').update({ available: !p.available }).eq('id', id).eq('shop_id', shop.id)
  revalidatePath('/dashboard/products')
}

export async function importProducts(_: FormState, fd: FormData): Promise<FormState> {
  const shop = await requireShop()
  const file = fd.get('file')
  if (!(file instanceof File) || !file.size) return { error: 'Fayl tanlanmagan' }
  if (!/\.(csv|xlsx|xls)$/i.test(file.name)) return { error: 'Faqat .csv, .xlsx yoki .xls' }
  if (file.size > 2 * 1024 * 1024) return { error: '2 MB dan katta fayl' }

  let parsed: ReturnType<typeof parseProductsFile>
  try {
    parsed = parseProductsFile(await file.arrayBuffer(), file.name)
  } catch {
    return { error: "Faylni o'qib bo'lmadi" }
  }
  if (parsed.errors.length) return { errors: parsed.errors }

  if (!isPro(shop) && (await productCount(shop.id)) + parsed.products.length > FREE_PRODUCT_LIMIT) {
    return { error: `Bepul tarifda ${FREE_PRODUCT_LIMIT} tagacha mahsulot` }
  }
  const { error } = await db().from('products').insert(parsed.products.map((p) => ({ ...p, shop_id: shop.id })))
  if (error) {
    console.error('import', error)
    return { error: "Saqlab bo'lmadi" }
  }
  revalidatePath('/dashboard/products')
  return { ok: `${parsed.products.length} ta mahsulot qo'shildi` }
}

export async function aiDescribe(name: string, hint: string): Promise<{ text?: string; error?: string }> {
  await requireSeller()
  const n = String(name).trim().slice(0, 200)
  if (!n) return { error: 'Avval mahsulot nomini kiriting' }
  try {
    return { text: await writeDescription(n, String(hint).trim().slice(0, 100)) }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { error: "AI band, bir daqiqadan keyin urinib ko'ring" }
    console.error('aiDescribe', e)
    return { error: "AI javob bermadi, qaytadan urinib ko'ring" }
  }
}

// ---------- Orders ----------

export async function setOrderStatus(orderId: string, to: OrderStatus) {
  const shop = await requireShop()
  if (!UUID.test(orderId)) return
  const res = await changeOrderStatus(orderId, to, shop.id)
  if (res.error) console.warn('setOrderStatus', res.error)
  revalidatePath('/dashboard/orders')
}
