import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { setSession } from '@/lib/session'
import { verifyTelegramLogin } from '@/lib/telegram'

// Telegram Login Widget redirects here with the signed user fields as query params.
export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams)
  if (!verifyTelegramLogin(params, process.env.BOT_TOKEN!)) {
    return new Response("Kirish ma'lumotlari noto'g'ri yoki eskirgan. Qaytadan urinib ko'ring.", { status: 401 })
  }
  const telegramId = Number(params.id)
  const { error } = await db()
    .from('sellers')
    .upsert({
      telegram_id: telegramId,
      name: [params.first_name, params.last_name].filter(Boolean).join(' ') || 'Sotuvchi',
      username: params.username ?? null,
    })
  if (error) {
    console.error('seller upsert', error)
    return new Response('Server xatosi', { status: 500 })
  }
  await setSession(telegramId)
  redirect('/dashboard')
}
