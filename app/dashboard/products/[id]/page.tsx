import { notFound } from 'next/navigation'
import { db, type Product } from '@/lib/db'
import { requireShop } from '@/lib/session'
import { UUID } from '@/lib/validate'
import { ProductForm } from './ProductForm'

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shop = await requireShop()
  let product: Product | null = null
  if (id !== 'new') {
    if (!UUID.test(id)) notFound()
    const { data } = await db().from('products').select('*').eq('id', id).eq('shop_id', shop.id).maybeSingle()
    if (!data) notFound()
    product = data as Product
  }
  return (
    <>
      <span className="label">{product ? 'Tahrirlash' : 'Yangi mahsulot'}</span>
      <h1 className="page-title">{product?.name ?? "Mahsulot qo'shish"}</h1>
      <ProductForm product={product} />
    </>
  )
}
