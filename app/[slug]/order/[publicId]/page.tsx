import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db, type Order } from '@/lib/db'
import { sum } from '@/lib/format'
import { getDict } from '@/lib/i18n'
import { getShop } from '../../data'

export const metadata: Metadata = { robots: { index: false } }

export default async function OrderPage({ params }: { params: Promise<{ slug: string; publicId: string }> }) {
  const { slug, publicId } = await params
  const shop = await getShop(slug)
  if (!shop) notFound()
  const { data } = await db()
    .from('orders')
    .select('*, order_items(name, variant, price, qty)')
    .eq('public_id', publicId)
    .eq('shop_id', shop.id)
    .maybeSingle()
  const order = data as Order | null
  if (!order) notFound()
  const { t } = await getDict()

  return (
    <section className="section stack" style={{ borderTop: 0, maxWidth: 640 }}>
      <span className="label"><b>●</b> {t.orderNo}: <span className="accent">#{order.public_id}</span></span>
      <h1 className="page-title">{t.orderReceived}</h1>
      <p className="muted">{t.orderNote}</p>
      <p>{t.status}: <span className="tag">{t[`st_${order.status}`]}</span></p>
      <ul role="list" style={{ padding: 0, listStyle: 'none' }}>
        {order.order_items?.map((i, k) => (
          <li key={k} className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <span>{i.name}{i.variant && <span className="muted"> · {i.variant}</span>} × {i.qty}</span>
            <span className="price">{sum(i.price * i.qty, t.sum)}</span>
          </li>
        ))}
      </ul>
      <p className="row between">
        <span className="label" style={{ margin: 0 }}>{t.total}</span>
        <strong className="price price-lg">{sum(order.total, t.sum)}</strong>
      </p>
    </section>
  )
}
