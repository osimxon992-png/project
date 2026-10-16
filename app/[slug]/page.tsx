import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { db, isShopActive } from '@/lib/db'
import { sum } from '@/lib/format'
import { getDict } from '@/lib/i18n'
import { getProducts, getShop } from './data'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getShop((await params).slug)
  if (!shop) return {}
  const description = shop.description || `${shop.name} — onlayn do'kon`
  return {
    title: shop.name,
    description,
    openGraph: { title: shop.name, description, url: `/${shop.slug}`, images: shop.logo_url ? [shop.logo_url] : [] },
  }
}

export default async function ShopPage({ params }: Props) {
  const shop = await getShop((await params).slug)
  if (!shop) notFound() // layout and page render in parallel, so both must guard
  if (!isShopActive(shop)) return null // layout shows the "closed" notice
  const { t } = await getDict()
  const products = await getProducts(shop)
  after(() => db().rpc('increment_page_view', { p_shop: shop.id })) // shortcut: counts bots and reloads too

  const groups = new Map<string, typeof products>()
  for (const p of products) {
    const c = p.category || t.other
    groups.set(c, [...(groups.get(c) ?? []), p])
  }
  const cats = [...groups.keys()]
  const anchor = (c: string) => `cat-${cats.indexOf(c)}`

  return (
    <>
      <section className="shop-hero gridbg">
        <div className="crosses" aria-hidden="true"><i /><i /><i /><i /></div>
        {shop.logo_url && <img className="shop-logo" src={shop.logo_url} alt={shop.name} />}
        <span className="label" style={{ margin: 0 }}><b>●</b> sahifa / {shop.slug}</span>
        <h1>{shop.name}</h1>
        {shop.description && <p className="pre muted">{shop.description}</p>}
      </section>

      <section aria-labelledby="products" style={{ paddingTop: 96 }}>
        <span className="label"><b>01</b> / {products.length}</span>
        <h2 id="products" className="page-title" style={{ marginBottom: 40 }}>{t.products}</h2>
        {cats.length > 1 && (
          <nav className="cats" aria-label={t.products}>
            {cats.map((c) => <a key={c} href={`#${anchor(c)}`} className="tag">{c}</a>)}
          </nav>
        )}
        {products.length === 0 && <p className="muted">{t.noProducts}</p>}
        {cats.map((c) => (
          <section key={c} id={anchor(c)} className="stack" style={{ marginBottom: 64 }}>
            {cats.length > 1 && <h3>{c}</h3>}
            <ul className="grid" role="list" style={{ padding: 0, listStyle: 'none' }}>
              {groups.get(c)!.map((p) => (
                <li key={p.id}>
                  <Link href={`/${shop.slug}/p/${p.id}`} className="card">
                    {p.images[0] ? <img className="img" src={p.images[0]} alt={p.name} loading="lazy" /> : <div className="img" />}
                    <h3>{p.name}</h3>
                    <span className="price">{sum(p.price, t.sum)}</span>{' '}
                    {!p.available && <span className="tag tag-muted">{t.outOfStock}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <section className="section info-grid">
        {(shop.phone || shop.instagram || shop.telegram) && (
          <div>
            <h2 className="label">{t.contacts}</h2>
            <ul className="stack" role="list" style={{ padding: 0, listStyle: 'none' }}>
              {shop.phone && <li><a href={`tel:${shop.phone}`}>{shop.phone}</a></li>}
              {shop.instagram && <li><a href={shop.instagram} rel="noopener" target="_blank">Instagram ↗</a></li>}
              {shop.telegram && <li><a href={shop.telegram} rel="noopener" target="_blank">Telegram ↗</a></li>}
            </ul>
          </div>
        )}
        {shop.delivery_info && (
          <div>
            <h2 className="label">{t.delivery}</h2>
            <p className="pre">{shop.delivery_info}</p>
          </div>
        )}
        {shop.payment_methods && (
          <div>
            <h2 className="label">{t.payment}</h2>
            <p className="pre">{shop.payment_methods}</p>
          </div>
        )}
      </section>
    </>
  )
}
