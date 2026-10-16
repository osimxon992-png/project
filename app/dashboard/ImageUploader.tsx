'use client'

import { useState } from 'react'
import { uploadImage } from './actions'

const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 1600

// Downscale to 1600px on the longest side before upload; webp keeps PNG transparency.
async function resize(file: File): Promise<File> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85))
  if (!blob) return file
  // Browsers without webp encoding return PNG instead. Re-encoding an already small image may grow it, so keep the original then.
  return scale < 1 || blob.size < file.size ? new File([blob], 'image', { type: blob.type }) : file
}

export function ImageUploader({ name, max, initial = [], label }: { name: string; max: number; initial?: string[]; label: string }) {
  const [urls, setUrls] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onFiles(files: FileList | null) {
    setError('')
    const list = [...(files ?? [])].slice(0, max - urls.length)
    setBusy(true)
    for (const f of list) {
      if (!TYPES.includes(f.type)) { setError('Faqat JPEG, PNG yoki WEBP'); continue }
      if (f.size > MAX_BYTES) { setError(`${f.name}: 5 MB dan katta`); continue }
      const fd = new FormData()
      fd.set('file', await resize(f))
      const res = await uploadImage(fd)
      if (res.url) setUrls((u) => [...u, res.url!])
      else setError(res.error ?? 'Xatolik')
    }
    setBusy(false)
  }

  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
      <legend className="label">{label} ({urls.length}/{max})</legend>
      {urls.map((u) => <input key={u} type="hidden" name={name} value={u} />)}
      <div className="thumbs-edit">
        {urls.map((u) => (
          <figure key={u}>
            <img src={u} alt="" />
            <button type="button" className="btn btn-small" onClick={() => setUrls(urls.filter((x) => x !== u))} aria-label="Rasmni olib tashlash">×</button>
          </figure>
        ))}
      </div>
      {urls.length < max && (
        <input type="file" accept={TYPES.join(',')} multiple={max > 1} disabled={busy} onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} />
      )}
      {busy && <p className="hint" role="status">Yuklanmoqda…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <p className="hint">JPEG, PNG yoki WEBP, 5 MB gacha.</p>
    </fieldset>
  )
}
