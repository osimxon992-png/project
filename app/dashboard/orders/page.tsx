import { db, type Order } from '@/lib/db'
import { day, STATUS_LABEL, sum } from '@/lib/format'
import { nextStatuses } from '@/lib/order'
import { requireShop } from '@/lib/session'
import { setOrderStatus } from '../actions'

const ACTION_LABEL = { confirmed: 'Tasdiqlash', delivered: 'Yetkazildi', cancelled: 'Bekor qilish', new: '' } as const

export default async function Orders() {
  const shop = await requireShop()
  const { data } = await db()
    .from('orders')
    .select('*, order_items(name, variant, price, qty)')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(200) // shortcut: last 200 orders only, add pagination when a shop outgrows it
  const orders = (data ?? []) as Order[]

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      <div>
        <span className="label">Buyurtmalar · {orders.length}</span>
        <h1 className="page-title">Buyurtmalar</h1>
      </div>
      {orders.length === 0 && <p className="muted">Hali buyurtma yo&apos;q. Do&apos;kon havolasini mijozlarga ulashing.</p>}
      {orders.map((o) => (
        <article key={o.id} className="panel stack" aria-labelledby={`o-${o.id}`}>
          <div className="row between">
            <h2 id={`o-${o.id}`} className="mono" style={{ fontSize: 18, margin: 0 }}>
              #{o.public_id} <span className="muted small">· {day(o.created_at)}</span>
            </h2>
            <span className={`tag ${o.status === 'cancelled' ? 'tag-muted' : ''}`}>{STATUS_LABEL[o.status]}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {o.order_items?.map((i, k) => (
              <li key={k}>{i.name}{i.variant && ` (${i.variant})`} × {i.qty} — <span className="price">{sum(i.price * i.qty)}</span></li>
            ))}
          </ul>
          <p style={{ margin: 0 }}>Jami: <strong className="price">{sum(o.total)}</strong></p>
          <p className="small" style={{ margin: 0 }}>
            {o.customer_name} · <a href={`tel:${o.phone}`}>{o.phone}</a><br />
            <span className="muted">{o.address}</span>
            {o.comment && <><br /><span className="muted">💬 {o.comment}</span></>}
          </p>
          {nextStatuses(o.status).length > 0 && (
            <div className="row">
              {nextStatuses(o.status).map((s) => (
                <form key={s} action={setOrderStatus.bind(null, o.id, s)}>
                  <button className={`btn btn-small ${s === 'cancelled' ? 'btn-danger' : ''}`}>{ACTION_LABEL[s]}</button>
                </form>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
