import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isPro, isShopActive } from '@/lib/db'
import { getDict } from '@/lib/i18n'
import { setLang } from './actions'
import { CartLink } from './cart'
import { getShop } from './data'

export default async function ShopLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shop = await getShop(slug)
  if (!shop) notFound()
  const { lang, t } = await getDict()
  const active = isShopActive(shop)

  return (
    <div lang={lang}>
      <header className="site-header">
        <div className="wrap">
          <Link href={`/${slug}`} className="logo">
            {shop.logo_url && <img src={shop.logo_url} alt="" />}
            {shop.name}
          </Link>
          <div className="row">
            <form action={setLang} className="row" aria-label="Til / Язык">
              <button name="lang" value="uz" className="btn btn-small" aria-pressed={lang === 'uz'}>UZ</button>
              <button name="lang" value="ru" className="btn btn-small" aria-pressed={lang === 'ru'}>RU</button>
            </form>
            {active && <CartLink slug={slug} label={t.cart} />}
          </div>
        </div>
      </header>

      <main className="wrap">
        {active ? children : (
          <section className="closed">
            <h1>{t.closed}</h1>
            <p className="muted">{t.closedNote}</p>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="wrap row between">
          <span className="mono">©{new Date().getFullYear()} {shop.name}</span>
          {!isPro(shop) && <a href="/" className="mono">{t.madeWith} ↗</a>}
        </div>
      </footer>
    </div>
  )
}
