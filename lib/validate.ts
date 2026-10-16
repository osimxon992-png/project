export const RESERVED_SLUGS = new Set([
  'admin', 'dashboard', 'api', 'login', 'logout', 'auth', 'signup', 'register', 'settings',
  'checkout', 'order', 'orders', 'p', 'shop', 'shops', 'static', 'public', 'assets', 'images',
  '_next', 'www', 'mail', 'help', 'support', 'about', 'pricing', 'terms', 'privacy', 'blog',
  'sahifa', 'robots-txt', 'sitemap', 'favicon',
])

export function validateSlug(slug: string): string | null {
  if (slug.length < 3 || slug.length > 40) return "Slug 3–40 belgidan iborat bo'lishi kerak"
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
    return 'Faqat kichik lotin harflari, raqamlar va "-" (boshida/oxirida emas)'
  if (RESERVED_SLUGS.has(slug)) return 'Bu nom band qilingan, boshqasini tanlang'
  return null
}

export function suggestSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, '') // o'zbek apostrophes: o'g'il -> ogil
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
}

// Returns "+998XXXXXXXXX" or null. Spaces, dashes and brackets are allowed in input.
export function normalizePhone(input: string) {
  const s = input.replace(/[\s\-()]/g, '')
  const m = /^\+?998(\d{9})$/.exec(s)
  return m ? `+998${m[1]}` : null
}

// Stores only https URLs on the expected host, so stored links can never be javascript: URLs.
export function normalizeSocial(kind: 'instagram' | 'telegram', input: string) {
  const v = input.trim()
  if (!v) return ''
  const host = kind === 'instagram' ? 'instagram.com' : 't.me'
  const handle = v.replace(/^https?:\/\/(www\.)?(instagram\.com|t\.me|telegram\.me)\//i, '').replace(/^@/, '').replace(/\/.*$/, '')
  return /^[A-Za-z0-9._]{2,40}$/.test(handle) ? `https://${host}/${handle}` : null
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
