import Link from 'next/link'
import { db, FREE_PRODUCT_LIMIT, isPro, isShopActive } from '@/lib/db'
import { day } from '@/lib/format'
import { requireShop } from '@/lib/session'

const DAY = 86400_000

export default async function Overview() {
  const shop = await requireShop()
  const now = Date.now()
  const since = (days: number) => new Date(now - days * DAY).toISOString()

  const [{ data: views }, orders7, orders30] = await Promise.all([
    db().from('page_views').select('day, count').eq('shop_id', shop.id).gte('day', since(29).slice(0, 10)),
    db().from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).gte('created_at', since(7)),
    db().from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).gte('created_at', since(30)),
  ])
  const viewsSince = (days: number) =>
    (views ?? []).filter((v) => v.day >= since(days - 1).slice(0, 10)).reduce((s, v) => s + v.count, 0)

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${shop.slug}`
  const active = isShopActive(shop)
  const daysLeft = shop.paid_until ? Math.ceil((new Date(shop.paid_until).getTime() - now) / DAY) : 0

  return (
    <div className="stack" style={{ display: 'grid', gap: 48 }}>
      <section>
        <span className="label">Do&apos;koningiz manzili</span>
        <h1 className="page-title" style={{ wordBreak: 'break-all' }}>
          <a href={url} target="_blank" rel="noopener">{url.replace(/^https?:\/\//, '')} ↗</a>
        </h1>
        <p className="muted">Shu havolani Instagram bio yoki Telegram kanalingizga qo&apos;ying.</p>
      </section>

      <section aria-labelledby="sub">
        <h2 id="sub" className="label">Obuna</h2>
        <div className="panel stack">
          {shop.plan === 'free' ? (
            <p><span className="tag">Bepul tarif</span> {FREE_PRODUCT_LIMIT} tagacha mahsulot, sahifa pastida &quot;Sahifa&apos;da yaratilgan&quot; yozuvi.</p>
          ) : active ? (
            <p>
              <span className="tag">Pro</span> {day(shop.paid_until!)} gacha faol
              <span className="muted"> ({daysLeft} kun qoldi)</span>
            </p>
          ) : (
            <p className="error">Obuna {day(shop.paid_until!)} da tugagan. Do&apos;kon sahifasi mijozlarga &quot;vaqtincha yopiq&quot; deb ko&apos;rinmoqda.</p>
          )}
          {!isPro(shop) || daysLeft <= 3 ? (
            <p className="hint">Uzaytirish uchun administratorga yozing. To&apos;lov qo&apos;lda qabul qilinadi.</p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="stats">
        <h2 id="stats" className="label">Statistika</h2>
        <div className="stats">
          <div><span className="label">Ko&apos;rishlar · 7 kun</span><strong>{viewsSince(7)}</strong></div>
          <div><span className="label">Ko&apos;rishlar · 30 kun</span><strong>{viewsSince(30)}</strong></div>
          <div><span className="label">Buyurtmalar · 7 kun</span><strong>{orders7.count ?? 0}</strong></div>
          <div><span className="label">Buyurtmalar · 30 kun</span><strong>{orders30.count ?? 0}</strong></div>
        </div>
      </section>

      <section className="row">
        <Link href="/dashboard/products/new" className="btn btn-accent">+ Mahsulot qo&apos;shish</Link>
        <Link href="/dashboard/orders" className="btn">Buyurtmalar →</Link>
      </section>
    </div>
  )
}
