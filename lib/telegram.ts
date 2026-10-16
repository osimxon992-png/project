import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

// https://core.telegram.org/widgets/login#checking-authorization
export function verifyTelegramLogin(params: Record<string, string>, botToken: string, now = Date.now()) {
  const { hash, ...data } = params
  if (!hash || !data.id || !data.auth_date) return false
  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n')
  const secret = createHash('sha256').update(botToken).digest()
  const expected = createHmac('sha256', secret).update(checkString).digest('hex')
  if (expected.length !== hash.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return false
  return now / 1000 - Number(data.auth_date) < 86400
}

export async function tg(method: 'sendMessage' | 'answerCallbackQuery', body: object) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) console.error(`telegram ${method} failed`, res.status, await res.text())
  return res.ok
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
