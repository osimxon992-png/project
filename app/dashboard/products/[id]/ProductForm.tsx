'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import type { Product } from '@/lib/db'
import { keepValues } from '../../../submit'
import { aiDescribe, saveProduct, type FormState } from '../../actions'
import { ImageUploader } from '../../ImageUploader'

export function ProductForm({ product }: { product: Product | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {})
  const [name, setName] = useState(product?.name ?? '')
  const [hint, setHint] = useState('')
  const [description, setDescription] = useState(product?.description ?? '')
  const [ai, setAi] = useState<{ busy: boolean; error?: string }>({ busy: false })

  async function generate() {
    setAi({ busy: true })
    const res = await aiDescribe(name, hint)
    if (res.text) setDescription(res.text)
    setAi({ busy: false, error: res.error })
  }

  return (
    <form onSubmit={keepValues(action)} className="form">
      {product && <input type="hidden" name="id" value={product.id} />}
      <label>
        <span>Nomi *</span>
        <input name="name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        <span>Narxi, so&apos;m *</span>
        <input name="price" required inputMode="numeric" pattern="[0-9 ]+" placeholder="120000" defaultValue={product?.price} />
      </label>
      <label>
        <span>Kategoriya</span>
        <input name="category" maxLength={100} placeholder="Ko'ylaklar" defaultValue={product?.category} />
      </label>
      <label>
        <span>Variantlar (razmer/rang)</span>
        <input name="variants" maxLength={500} placeholder="S, M, L yoki Qizil, Ko'k" defaultValue={product?.variants.join(', ')} />
        <span className="hint" style={{ textTransform: 'none', letterSpacing: 0 }}>Vergul bilan ajrating. Mijoz bittasini tanlaydi.</span>
      </label>
      <ImageUploader name="images" max={5} initial={product?.images} label="Rasmlar" />

      <fieldset className="panel stack" style={{ margin: 0 }}>
        <legend className="label" style={{ padding: '0 8px' }}>AI bilan tavsif yozish</legend>
        <label>
          <span>2–3 so&apos;zli izoh</span>
          <input value={hint} onChange={(e) => setHint(e.target.value)} maxLength={100} placeholder="paxta, yozgi, oversize" />
        </label>
        <div className="row">
          <button type="button" className="btn btn-small" onClick={generate} disabled={ai.busy || !name.trim()}>
            {ai.busy ? 'Yozilmoqda…' : '✦ AI bilan yozish'}
          </button>
          <span className="hint">O&apos;zbek va rus tilida tavsif pastdagi maydonga qo&apos;yiladi.</span>
        </div>
        {ai.error && <p className="error" role="alert">{ai.error}</p>}
      </fieldset>

      <label>
        <span>Tavsif</span>
        <textarea name="description" maxLength={3000} rows={8} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" name="available" defaultChecked={product?.available ?? true} />
        Sotuvda mavjud
      </label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <div className="row">
        <button className="btn btn-accent" disabled={pending}>{pending ? 'Saqlanmoqda…' : 'Saqlash'}</button>
        <Link href="/dashboard/products" className="btn">Bekor qilish</Link>
      </div>
    </form>
  )
}
