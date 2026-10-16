import { db } from '@/lib/db'
import { day } from '@/lib/format'
import { tg } from '@/lib/telegram'

const DAY = 86400_000

// Vercel Cron, once a day. shortcut: no "already reminded" flag; a manual re-run the same day sends the reminder twice.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('forbidden', { status: 403 })
  }
  const now = Date.now()
  const { data: shops, error } = await db()
    .from('shops')
    .select('seller_id, name, paid_until')
    .eq('plan', 'pro')
    .gt('paid_until', new Date(now).toISOString())
    .lte('paid_until', new Date(now + 3 * DAY).toISOString())
  if (error) return Response.json({ error: error.message }, { status: 500 })

  let sent = 0
  for (const s of shops ?? []) {
    const daysLeft = Math.ceil((new Date(s.paid_until).getTime() - now) / DAY)
    if (daysLeft !== 3 && daysLeft !== 1) continue
    const ok = await tg('sendMessage', {
      chat_id: s.seller_id,
      text: `⏰ "${s.name}" do'koni obunasi ${daysLeft} kundan keyin (${day(s.paid_until)}) tugaydi. Tugagach do'kon sahifasi mijozlarga yopiq ko'rinadi. Uzaytirish uchun administratorga yozing.`,
    })
    if (ok) sent++
  }
  return Response.json({ sent })
}
