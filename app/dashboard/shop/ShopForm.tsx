'use client'

import { useActionState, useState } from 'react'
import type { Shop } from '@/lib/db'
import { suggestSlug } from '@/lib/validate'
import { checkSlug, saveShop, type FormState } from '../actions'
import { ImageUploader } from '../ImageUploader'
import { keepValues } from '../../submit'

export function ShopForm({ shop }: { shop: Shop | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveShop, {})
  const [slug, setSlug] = useState(shop?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!shop)
  const [slugMsg, setSlugMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function verify(value: string) {
    if (!value) return setSlugMsg(null)
    const err = await checkSlug(value)
    setSlugMsg(err ? { ok: false, text: err } : { ok: true, text: "Bo'sh ✓" })
  }

  return (
    <form onSubmit={keepValues(action)} className="form">
      <label>
        <span>Do&apos;kon nomi *</span>
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={shop?.name}
          onChange={(e) => !slugTouched && setSlug(suggestSlug(e.target.value))}
          onBlur={() => !slugTouched && verify(slug)}
        />
      </label>
      <label>
        <span>Manzil (slug) *</span>
        <input
          name="slug"
          required
          maxLength={40}
          value={slug}
          onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); setSlugMsg(null) }}
          onBlur={() => verify(slug)}
          aria-describedby="slug-hint"
        />
        <span id="slug-hint" className="hint" style={{ textTransform: 'none', letterSpacing: 0 }}>
          {process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '')}/{slug || '...'} — lotin harflari, raqamlar va &quot;-&quot;
        </span>
        {slugMsg && <span className={slugMsg.ok ? 'ok' : 'error'} role="status">{slugMsg.text}</span>}
      </label>
      <ImageUploader name="logo_url" max={1} initial={shop?.logo_url ? [shop.logo_url] : []} label="Logo" />
      <label>
        <span>Qisqa tavsif</span>
        <textarea name="description" maxLength={500} defaultValue={shop?.description} />
      </label>
      <label>
        <span>Telefon</span>
        <input name="phone" type="tel" placeholder="+998 90 123 45 67" defaultValue={shop?.phone} />
      </label>
      <label>
        <span>Instagram</span>
        <input name="instagram" placeholder="@username" defaultValue={shop?.instagram} />
      </label>
      <label>
        <span>Telegram</span>
        <input name="telegram" placeholder="@kanal yoki @username" defaultValue={shop?.telegram} />
      </label>
      <label>
        <span>Yetkazib berish shartlari</span>
        <textarea name="delivery_info" maxLength={1000} placeholder="Toshkent bo'ylab 1 kunda, 20 000 so'm..." defaultValue={shop?.delivery_info} />
      </label>
      <label>
        <span>To&apos;lov usullari</span>
        <textarea name="payment_methods" maxLength={500} placeholder="Naqd, Click, Payme, karta orqali" defaultValue={shop?.payment_methods} />
      </label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.ok && <p className="ok" role="status">{state.ok}</p>}
      <button className="btn btn-accent" disabled={pending}>{pending ? 'Saqlanmoqda…' : shop ? 'Saqlash' : "Do'konni yaratish →"}</button>
    </form>
  )
}
