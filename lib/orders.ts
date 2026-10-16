import { db, type Order, type OrderStatus, type Shop } from './db'
import { sum, STATUS_LABEL } from './format'
import { canTransition } from './order'
import { esc, tg } from './telegram'

// Shared by the dashboard and the Telegram buttons. Scoped by shopId, so a seller can only touch their own orders.
export async function changeOrderStatus(orderId: string, to: OrderStatus, shopId: string) {
  const { data: order } = await db().from('orders').select('id, status, public_id').eq('id', orderId).eq('shop_id', shopId).maybeSingle()
  if (!order) return { error: 'Buyurtma topilmadi' }
  if (!canTransition(order.status, to)) return { error: `Holat allaqachon: ${STATUS_LABEL[order.status as OrderStatus]}` }
  const { data: updated } = await db()
    .from('orders')
    .update({ status: to })
    .eq('id', orderId)
    .eq('status', order.status) // a concurrent click from Telegram and the dashboard can't both win
    .select('id')
  if (!updated?.length) return { error: "Holat o'zgargan, sahifani yangilang" }
  return { publicId: order.public_id as string }
}

export async function notifyNewOrder(shop: Shop, order: Order, items: { name: string; variant: string; price: number; qty: number }[]) {
  const lines = items.map((i) => `• ${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''} × ${i.qty} — ${sum(i.price * i.qty)}`)
  const text = [
    `🛒 <b>Yangi buyurtma #${order.public_id}</b>`,
    '',
    ...lines,
    '',
    `Jami: <b>${sum(order.total)}</b>`,
    '',
    `👤 ${esc(order.customer_name)}`,
    `📞 ${order.phone}`,
    `📍 ${esc(order.address)}`,
    order.comment ? `💬 ${esc(order.comment)}` : '',
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '')

  return tg('sendMessage', {
    chat_id: shop.seller_id,
    text: text.join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Tasdiqlash', callback_data: `ok:${order.id}` },
        { text: '❌ Bekor qilish', callback_data: `no:${order.id}` },
      ]],
    },
  }).catch((e) => console.error('notifyNewOrder', e))
}
