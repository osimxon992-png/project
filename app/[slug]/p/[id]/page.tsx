import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { db, isShopActive } from '@/lib/db'
import { sum } from '@/lib/format'
import { getDict } from '@/lib/i18n'
import { AddToCart } from '../../cart'
import { getProduct, getShop } from '../../data'

type Props = { params: Promise<{ slug: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params
  const shop = await getShop(slug)
  const p = shop && (await getProduct(shop.id, id))
  if (!shop || !p) return {}
  const description = p.description.slice(0, 160) || `${sum(p.price)} — ${shop.name}`
  return {
    title: `${p.name} — ${shop.name}`,
    description,
    openGraph: { title: p.name, description, images: p.images[0] ? [p.images[0]] : shop.logo_url ? [shop.logo_url] : [] },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug, id } = await params
  const shop = await getShop(slug)
  if (!shop) notFound()
  if (!isShopActive(shop)) return null
  const p = await getProduct(shop.id, id)
  if (!p) notFound()
  const { t } = await getDict()
  after(() => db().rpc('increment_page_view', { p_shop: shop.id }))

  return (
    <article className="product">
      <div className="gallery">
        {p.images.length ? p.images.map((src, i) => <img key={src} src={src} alt={i === 0 ? p.name : ''} />) : <div className="img card" />}
      </div>
      <div className="stack">
        <Link href={`/${slug}`} className="mono small muted">{t.back}</Link>
        {p.category && <span className="tag">{p.category}</span>}
        <h1 className="page-title">{p.name}</h1>
        <p className="price price-lg">{sum(p.price, t.sum)}</p>
        {p.description && <p className="pre">{p.description}</p>}
        {p.available ? (
          <AddToCart slug={slug} t={t} product={{ id: p.id, name: p.name, price: p.price, image: p.images[0], variants: p.variants }} />
        ) : (
          <p className="tag tag-muted">{t.outOfStock}</p>
        )}
      </div>
    </article>
  )
}
