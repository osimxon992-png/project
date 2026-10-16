'use client'

import { useEffect, useRef } from 'react'

// The widget script renders its iframe next to itself, so it must be injected into this div (React would hoist a JSX <script>).
export function TelegramLogin({ bot, authUrl }: { bot: string; authUrl: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.dataset.telegramLogin = bot
    s.dataset.size = 'large'
    s.dataset.radius = '999'
    s.dataset.authUrl = authUrl
    s.dataset.requestAccess = 'write'
    ref.current?.replaceChildren(s)
  }, [bot, authUrl])
  return <div ref={ref} aria-label="Telegram orqali kirish" />
}
