import * as XLSX from 'xlsx'

export type ImportedProduct = { name: string; price: number; category: string; variants: string[]; description: string }

const HEADERS: Record<string, keyof ImportedProduct> = {
  nomi: 'name', nom: 'name', name: 'name',
  narxi: 'price', narx: 'price', price: 'price',
  kategoriya: 'category', category: 'category',
  variantlar: 'variants', variants: 'variants',
  tavsif: 'description', description: 'description',
}

export const MAX_IMPORT_ROWS = 500

// All-or-nothing: any row error means nothing is imported, so re-uploading a fixed file never duplicates.
export function parseProductsFile(data: ArrayBuffer, filename: string) {
  const wb = filename.toLowerCase().endsWith('.csv')
    ? XLSX.read(new TextDecoder().decode(data), { type: 'string', raw: true })
    : XLSX.read(data, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { products: [], errors: ['Fayl bo\'sh'] }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true, blankrows: false })
  const [head = [], ...body] = rows
  const cols = head.map((h) => HEADERS[String(h).trim().toLowerCase()])
  if (!cols.includes('name') || !cols.includes('price')) return { products: [], errors: ['"nomi" va "narxi" ustunlari topilmadi'] }
  if (body.length > MAX_IMPORT_ROWS) return { products: [], errors: [`Ko'pi bilan ${MAX_IMPORT_ROWS} qator`] }

  const products: ImportedProduct[] = []
  const errors: string[] = []
  body.forEach((row, i) => {
    const get = (k: keyof ImportedProduct) => row[cols.indexOf(k)] ?? ''
    if (row.every((c) => String(c).trim() === '')) return
    const line = i + 2
    const name = String(get('name')).trim()
    const price = parsePrice(get('price'))
    if (!name) errors.push(`${line}-qator: nomi bo'sh`)
    if (price === null) errors.push(`${line}-qator: narx noto'g'ri ("${String(get('price'))}")`)
    if (!name || price === null) return
    products.push({
      name: name.slice(0, 200),
      price,
      category: String(get('category')).trim().slice(0, 100),
      variants: String(get('variants')).split(/[,;|]/).map((v) => v.trim()).filter(Boolean).slice(0, 30),
      description: String(get('description')).trim().slice(0, 3000),
    })
  })
  if (!products.length && !errors.length) errors.push('Faylda mahsulot yo\'q')
  return errors.length ? { products: [], errors } : { products, errors }
}

function parsePrice(v: unknown) {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 ? v : null
  const s = String(v).replace(/[\s,]/g, '').replace(/so'?m$/i, '')
  return /^\d{1,10}$/.test(s) ? Number(s) : null
}
