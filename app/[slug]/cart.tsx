'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sum } from '@/lib/format'
import type { Dict } from '@/lib/i18n'

// name/price/image are for display only; the server re-reads prices from the DB.
export type CartLine = { productId: string; variant: string; qty: number; name: string; price: number; image?: string }

const key = (slug: string) => `cart:${slug}`

export function readCart(slug: string): CartLine[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(slug)) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function writeCart(slug: string, lines: CartLine[]) {
  try {
    localStorage.setItem(key(slug), JSON.stringify(lines))
  } catch {}
  window.dispatchEvent(new Event('cart'))
}

export function useCart(slug: string) {
  const [lines, setLines] = useState<CartLine[]>([])
  useEffect(() => {
    const load = () => setLines(readCart(slug))
    load()
    window.addEventListener('cart', load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener('cart', load)
      window.removeEventListener('storage', load)
    }
  }, [slug])
  return lines
}

export function CartLink({ slug, label }: { slug: string; label: string }) {
  const count = useCart(slug).reduce((n, l) => n + l.qty, 0)
  return (
    <Link href={`/${slug}/checkout`} className="btn btn-small">
      {label} ({count})
    </Link>
  )
}

type P = { id: string; name: string; price: number; image?: string; variants: string[] }

export function AddToCart({ slug, product, t }: { slug: string; product: P; t: Dict }) {
  const [variant, setVariant] = useState(product.variants[0] ?? '')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  function add() {
    const lines = readCart(slug)
    const same = lines.find((l) => l.productId === product.id && l.variant === variant)
    if (same) same.qty = Math.min(99, same.qty + qty)
    else lines.push({ productId: product.id, variant, qty, name: product.name, price: product.price, image: product.image })
    writeCart(slug, lines)
    setAdded(true)
  }

  return (
    <div className="stack">
      {product.variants.length > 0 && (
        <label>
          <span>{t.variant}</span>
          <select value={variant} onChange={(e) => setVariant(e.target.value)}>
            {product.variants.map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
      )}
      <label>
        <span>{t.qty}</span>
        <input type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
      </label>
      <div className="row">
        <button type="button" className="btn btn-accent" onClick={add}>{t.addToCart} — {sum(product.price * qty, t.sum)}</button>
        {added && <Link href={`/${slug}/checkout`} className="ok" role="status">{t.added}. {t.goToCart}</Link>}
      </div>
    </div>
  )
}
