'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export async function extendSubscription(shopId: string, fd: FormData) {
  await requireAdmin()
  const days = Number(fd.get('days'))
  if (!Number.isInteger(days) || days < 1 || days > 3650) return
  const { data: shop } = await db().from('shops').select('paid_until').eq('id', shopId).maybeSingle()
  if (!shop) return
  // Extend from the later of today and the current end date, so early payments aren't lost.
  const from = Math.max(Date.now(), shop.paid_until ? new Date(shop.paid_until).getTime() : 0)
  await db()
    .from('shops')
    .update({ plan: 'pro', paid_until: new Date(from + days * 86400_000).toISOString() })
    .eq('id', shopId)
  revalidatePath('/admin')
}

// "Disable subscription": back to the free plan (10 products, badge), the shop stays open.
export async function disableSubscription(shopId: string) {
  await requireAdmin()
  await db().from('shops').update({ plan: 'free', paid_until: null }).eq('id', shopId)
  revalidatePath('/admin')
}
