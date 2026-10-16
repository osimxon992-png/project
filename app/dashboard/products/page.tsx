import Link from 'next/link'
import { db, FREE_PRODUCT_LIMIT, isPro, type Product } from '@/lib/db'
import { sum } from '@/lib/format'
import { requireShop } from '@/lib/session'
import { deleteProduct, toggleAvailable } from '../actions'
import { ImportForm } from './ImportForm'

export default async function Products() {
  const shop = await requireShop()
  const { data } = await db().from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false })
  const products = (data ?? []) as Product[]
  const pro = isPro(shop)

  return (
    <div style={{ display: 'grid', gap: 48 }}>
      <section className="row between">
        <div>
          <span className="label">Mahsulotlar · {products.length}{pro ? '' : ` / ${FREE_PRODUCT_LIMIT}`}</span>
          <h1 className="page-title">Katalog</h1>
        </div>
        <Link href="/dashboard/products/new" className="btn btn-accent">+ Yangi mahsulot</Link>
      </section>

      {products.length === 0 ? (
        <p className="muted">Hali mahsulot yo&apos;q. Birinchisini qo&apos;shing yoki fayldan yuklang.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th scope="col"><span className="hp">Rasm</span></th><th scope="col">Nomi</th><th scope="col">Narxi</th><th scope="col">Kategoriya</th><th scope="col">Holat</th><th scope="col"><span className="hp">Amallar</span></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.images[0] ? <img src={p.images[0]} alt="" /> : null}</td>
                  <td><Link href={`/dashboard/products/${p.id}`}>{p.name}</Link>{p.variants.length > 0 && <div className="hint">{p.variants.join(', ')}</div>}</td>
                  <td className="price">{sum(p.price)}</td>
                  <td>{p.category}</td>
                  <td>
                    <form action={toggleAvailable.bind(null, p.id)}>
                      <button className={`tag ${p.available ? '' : 'tag-muted'}`} style={{ border: 0, cursor: 'pointer' }} title="Holatni almashtirish">
                        {p.available ? 'Mavjud' : 'Mavjud emas'}
                      </button>
                    </form>
                  </td>
                  <td>
                    <div className="row">
                      <Link href={`/dashboard/products/${p.id}`} className="btn btn-small">Tahrirlash</Link>
                      <form action={deleteProduct.bind(null, p.id)}>
                        <button className="btn btn-small btn-danger" aria-label={`${p.name} — o'chirish`}>O&apos;chirish</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section aria-labelledby="import" className="panel stack">
        <h2 id="import" className="label">CSV / Excel orqali yuklash</h2>
        <p className="small muted">
          Ustunlar: <code>nomi</code>, <code>narxi</code>, <code>kategoriya</code>, <code>variantlar</code> (vergul bilan: S, M, L), <code>tavsif</code>.
          Birinchi qator sarlavha. Xato bo&apos;lsa hech narsa qo&apos;shilmaydi.
        </p>
        <ImportForm />
      </section>
    </div>
  )
}
