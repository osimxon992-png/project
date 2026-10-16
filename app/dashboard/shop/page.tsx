import { getMyShop, requireSeller } from '@/lib/session'
import { ShopForm } from './ShopForm'

export default async function ShopSettings() {
  const shop = await getMyShop(await requireSeller())
  return (
    <>
      <span className="label">{shop ? "Do'kon sozlamalari" : '[01] — Boshlash'}</span>
      <h1 className="page-title">{shop ? shop.name : "Do'koningizni yarating"}</h1>
      {!shop && <p className="muted">14 kunlik bepul sinov darhol boshlanadi.</p>}
      <ShopForm shop={shop} />
    </>
  )
}
