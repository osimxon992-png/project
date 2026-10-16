import { describe, expect, it } from 'vitest'
import { normalizePhone, normalizeSocial, suggestSlug, validateSlug } from '@/lib/validate'

describe('validateSlug', () => {
  it('accepts latin letters, digits and inner dashes', () => {
    expect(validateSlug('gulnora-shop')).toBeNull()
    expect(validateSlug('shop24')).toBeNull()
  })

  it('rejects bad characters, case, edges and length', () => {
    for (const s of ['Gul', 'gul shop', 'gul_shop', 'гул', '-gul', 'gul-', 'gu--l', 'ab', 'a'.repeat(41), "o'g'il"])
      expect(validateSlug(s), s).not.toBeNull()
  })

  it('blocks reserved words', () => {
    for (const s of ['admin', 'dashboard', 'api', 'login']) expect(validateSlug(s), s).not.toBeNull()
  })
})

describe('suggestSlug', () => {
  it('transliterates shop names', () => {
    expect(suggestSlug("Gulnora's Shop!")).toBe('gulnoras-shop')
    expect(suggestSlug("O'g'il bola kiyimlari")).toBe('ogil-bola-kiyimlari')
  })
})

describe('normalizePhone', () => {
  it('accepts +998 and 9 digits', () => {
    expect(normalizePhone('+998 90 123-45-67')).toBe('+998901234567')
    expect(normalizePhone('998901234567')).toBe('+998901234567')
  })

  it('rejects other formats', () => {
    for (const s of ['901234567', '+99890123456', '+9989012345678', '+7 901 234 56 78', '+998 90 abc 45 67'])
      expect(normalizePhone(s), s).toBeNull()
  })
})

describe('normalizeSocial', () => {
  it('turns handles and URLs into https links', () => {
    expect(normalizeSocial('instagram', '@gul.shop')).toBe('https://instagram.com/gul.shop')
    expect(normalizeSocial('instagram', 'https://www.instagram.com/gul.shop/')).toBe('https://instagram.com/gul.shop')
    expect(normalizeSocial('telegram', 'https://t.me/gulshop')).toBe('https://t.me/gulshop')
    expect(normalizeSocial('telegram', '')).toBe('')
  })

  it('rejects anything that is not a handle', () => {
    expect(normalizeSocial('instagram', 'javascript:alert(1)')).toBeNull()
    expect(normalizeSocial('telegram', 'https://evil.com/x')).toBeNull()
  })
})
