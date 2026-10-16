'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { sum } from '@/lib/format'
import type { Dict } from '@/lib/i18n'
import { placeOrder, type OrderState } from '../actions'
import { useCart, writeCart } from '../cart'
import { keepValues } from '../../submit'

export function Checkout({ slug, t }: { slug: string; t: Dict }) {
  const lines = useCart(slug)
  const router = useRouter()
  const [state, action, pending] = useActionState<OrderState, FormData>(placeOrder.bind(null, slug), {})

  useEffect(() => {
    if (!state.publicId) return
    writeCart(slug, [])
    router.push(`/${slug}/order/${state.publicId}`)
  }, [state.publicId, slug, router])

  const setQty = (i: number, qty: number) =>
    writeCart(slug, qty < 1 ? lines.filter((_, j) => j !== i) : lines.map((l, j) => (j === i ? { ...l, qty: Math.min(99, qty) } : l)))

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0)

  return (
    <div className="product">
      <section aria-labelledby="cart-h">
        <h1 id="cart-h" className="page-title">{t.cart}</h1>
        {lines.length === 0 && <p className="muted">{t.emptyCart}</p>}
        {lines.map((l, i) => (
          <div key={`${l.productId}:${l.variant}`} className="cart-line">
            {l.image ? <img src={l.image} alt="" /> : <div className="ph" />}
            <div>
              <div>{l.name}{l.variant && <span className="muted"> · {l.variant}</span>}</div>
              <div className="qty mono small">
                <button type="button" className="btn btn-small" onClick={() => setQty(i, l.qty - 1)} aria-label="−1">−</button>
                <span aria-live="polite">{l.qty}</span>
                <button type="button" className="btn btn-small" onClick={() => setQty(i, l.qty + 1)} aria-label="+1">+</button>
                <button type="button" className="link muted" onClick={() => setQty(i, 0)}>{t.remove}</button>
              </div>
            </div>
            <span className="price">{sum(l.price * l.qty, t.sum)}</span>
          </div>
        ))}
        {lines.length > 0 && (
          <p className="row between" style={{ marginTop: 16 }}>
            <span className="label" style={{ margin: 0 }}>{t.total}</span>
            <strong className="price price-lg">{sum(total, t.sum)}</strong>
          </p>
        )}
      </section>

      {lines.length > 0 && (
        <form onSubmit={keepValues(action)} className="form">
          <input type="hidden" name="items" value={JSON.stringify(lines.map(({ productId, variant, qty }) => ({ productId, variant, qty })))} />
          <div className="hp" aria-hidden="true">
            <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <label><span>{t.name}</span><input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
          <label>
            <span>{t.phone}</span>
            <input name="phone" type="tel" required defaultValue="+998 " placeholder={t.phoneHint} autoComplete="tel" />
          </label>
          <label><span>{t.address}</span><textarea name="address" required minLength={5} maxLength={500} autoComplete="street-address" /></label>
          <label><span>{t.comment}</span><textarea name="comment" maxLength={1000} /></label>
          {state.error && <p className="error" role="alert">{state.error}</p>}
          <button className="btn btn-accent" disabled={pending}>{pending ? t.sending : `${t.checkout} — ${sum(total, t.sum)}`}</button>
        </form>
      )}
    </div>
  )
}
