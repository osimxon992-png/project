import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db, type Shop } from './db'

const COOKIE = 'sid'
const TTL_MS = 30 * 24 * 3600 * 1000

const sign = (v: string) => createHmac('sha256', `session:${process.env.BOT_TOKEN}`).update(v).digest('base64url')

// Cookie value: "<telegram_id>.<expires_ms>.<hmac>"
export function encodeSession(telegramId: number, now = Date.now()) {
  const v = `${telegramId}.${now + TTL_MS}`
  return `${v}.${sign(v)}`
}

export function decodeSession(token: string | undefined, now = Date.now()) {
  const [id, exp, sig] = token?.split('.') ?? []
  if (!id || !exp || !sig) return null
  const expected = sign(`${id}.${exp}`)
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  if (Number(exp) < now) return null
  return Number(id)
}

export async function setSession(telegramId: number) {
  ;(await cookies()).set(COOKIE, encodeSession(telegramId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_MS / 1000,
  })
}

export async function clearSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function getSellerId() {
  return decodeSession((await cookies()).get(COOKIE)?.value)
}

export async function requireSeller() {
  const id = await getSellerId()
  if (!id) redirect('/')
  return id
}

export async function getMyShop(sellerId: number) {
  const { data } = await db().from('shops').select('*').eq('seller_id', sellerId).maybeSingle()
  return data as Shop | null
}

// Every dashboard action starts here: the shop is derived from the session, never from client input.
export async function requireShop() {
  const shop = await getMyShop(await requireSeller())
  if (!shop) redirect('/dashboard/shop')
  return shop
}

export async function requireAdmin() {
  const id = await requireSeller()
  const admins = (process.env.ADMIN_TELEGRAM_IDS ?? '').split(',').map((s) => Number(s.trim()))
  if (!admins.includes(id)) redirect('/')
  return id
}
