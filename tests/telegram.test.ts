import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyTelegramLogin } from '@/lib/telegram'
import { decodeSession, encodeSession } from '@/lib/session'

const TOKEN = '123456:TEST_TOKEN'
const now = 1_760_000_000_000

function signed(data: Record<string, string>, token = TOKEN) {
  const check = Object.keys(data).sort().map((k) => `${k}=${data[k]}`).join('\n')
  const hash = createHmac('sha256', createHash('sha256').update(token).digest()).update(check).digest('hex')
  return { ...data, hash }
}

const data = { id: '42', first_name: 'Ali', username: 'ali', auth_date: String(now / 1000 - 60) }

describe('verifyTelegramLogin', () => {
  it('accepts a valid hash', () => {
    expect(verifyTelegramLogin(signed(data), TOKEN, now)).toBe(true)
  })

  it('rejects a forged hash', () => {
    expect(verifyTelegramLogin({ ...data, hash: 'a'.repeat(64) }, TOKEN, now)).toBe(false)
    expect(verifyTelegramLogin(signed(data, '999:OTHER_BOT'), TOKEN, now)).toBe(false)
  })

  it('rejects tampered fields', () => {
    expect(verifyTelegramLogin({ ...signed(data), id: '43' }, TOKEN, now)).toBe(false)
  })

  it('rejects a missing hash and stale auth_date', () => {
    expect(verifyTelegramLogin(data, TOKEN, now)).toBe(false)
    const old = signed({ ...data, auth_date: String(now / 1000 - 2 * 86400) })
    expect(verifyTelegramLogin(old, TOKEN, now)).toBe(false)
  })
})

describe('session cookie', () => {
  it('round-trips and rejects tampering/expiry', () => {
    process.env.BOT_TOKEN = TOKEN
    const token = encodeSession(42, now)
    expect(decodeSession(token, now)).toBe(42)
    expect(decodeSession(token.replace(/^42\./, '43.'), now)).toBeNull()
    expect(decodeSession(token, now + 31 * 24 * 3600 * 1000)).toBeNull()
    expect(decodeSession(undefined, now)).toBeNull()
  })
})
