import { STATUS_LABEL } from '@/lib/format'
import { changeOrderStatus } from '@/lib/orders'
import { getMyShop } from '@/lib/session'
import { tg } from '@/lib/telegram'
import { UUID } from '@/lib/validate'

type CallbackQuery = { id: string; from: { id: number }; data?: string; message?: { chat: { id: number }; message_id: number } }

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('forbidden', { status: 403 })
  }
  const update = await req.json().catch(() => ({}))
  if (update.callback_query) await onCallback(update.callback_query)
  return Response.json({ ok: true }) // always 200, otherwise Telegram retries the update
}

async function onCallback(cq: CallbackQuery) {
  const [action, orderId] = (cq.data ?? '').split(':')
  const to = action === 'ok' ? 'confirmed' : action === 'no' ? 'cancelled' : null
  // The pressing user's own shop scopes the update, so a forwarded button can't change someone else's order.
  const shop = await getMyShop(cq.from.id)
  if (!to || !UUID.test(orderId ?? '') || !shop) {
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Ruxsat yo\'q' })
    return
  }
  const res = await changeOrderStatus(orderId, to, shop.id)
  await tg('answerCallbackQuery', { callback_query_id: cq.id, text: res.error ?? `Holat: ${STATUS_LABEL[to]}` })
  if (!res.error && cq.message) {
    await tg('sendMessage', {
      chat_id: cq.message.chat.id,
      text: `${to === 'confirmed' ? '✅' : '❌'} Buyurtma #${res.publicId}: ${STATUS_LABEL[to]}`,
      reply_parameters: { message_id: cq.message.message_id },
    })
  }
}
