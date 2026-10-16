import type { Metadata } from 'next'
import Link from 'next/link'
import { db, isShopActive, type Shop } from '@/lib/db'
import { day } from '@/lib/format'
import { requireAdmin } from '@/lib/session'
import { disableSubscription, extendSubscription } from './actions'

export const metadata: Metadata = { title: 'Admin — Sahifa', robots: { index: false } }

type Row = Shop & { sellers: { name: string; username: string | null } | null; orders: { count: number }[] }

export default async function Admin() {
  await requireAdmin()
  const { data } = await db()
    .from('shops')
    .select('*, sellers(name, username), orders(count)')
    .order('created_at', { ascending: false })
  const shops = (data ?? []) as Row[]

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/admin" className="logo">Sahifa · Admin</Link>
          <nav aria-label="Admin"><Link href="/dashboard">Panel</Link></nav>
        </div>
      </header>
      <main className="wrap" style={{ padding: '48px var(--gutter) 96px' }}>
        <span className="label">Do&apos;konlar · {shops.length}</span>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Do&apos;kon</th><th scope="col">Sotuvchi</th><th scope="col">Tarif</th>
                <th scope="col">Tugash sanasi</th><th scope="col">Buyurtmalar</th><th scope="col">Obuna</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id}>
                  <td><a href={`/${s.slug}`} target="_blank" rel="noopener">{s.name}</a><div className="hint">/{s.slug}</div></td>
                  <td>
                    {s.sellers?.name}
                    {s.sellers?.username && <div className="hint"><a href={`https://t.me/${s.sellers.username}`} target="_blank" rel="noopener">@{s.sellers.username}</a></div>}
                    <div className="hint mono">{s.seller_id}</div>
                  </td>
                  <td>
                    <span className={`tag ${isShopActive(s) ? '' : 'tag-muted'}`}>
                      {s.plan === 'free' ? 'Bepul' : isShopActive(s) ? 'Pro' : 'Tugagan'}
                    </span>
                  </td>
                  <td className="mono">{s.paid_until ? day(s.paid_until) : '—'}</td>
                  <td className="mono">{s.orders[0]?.count ?? 0}</td>
                  <td>
                    <div className="row">
                      <form action={extendSubscription.bind(null, s.id)} className="row">
                        <label className="hp" htmlFor={`d-${s.id}`}>Kun</label>
                        <input id={`d-${s.id}`} name="days" type="number" min={1} max={3650} defaultValue={30} style={{ width: 80, padding: '6px 8px' }} />
                        <button className="btn btn-small">+ kun</button>
                      </form>
                      {s.plan === 'pro' && (
                        <form action={disableSubscription.bind(null, s.id)}>
                          <button className="btn btn-small btn-danger">O&apos;chirish</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
