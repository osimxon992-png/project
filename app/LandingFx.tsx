'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_+'

const readMotion = () => {
  try {
    return localStorage.getItem('motion') === 'off' ? 'off' : 'on'
  } catch {
    return 'on'
  }
}

// All DOM-side motion for the landing: smooth scroll, motion toggle, reveal-on-scroll, section indicator,
// 3D tilt of the UI mock-ups, velocity-skewed marquee, scramble links, loader hand-off from the WebGL scene.
export function LandingFx() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.lp')
    if (!root) return
    const html = document.documentElement
    root.classList.add('fx')

    // Loader leaves once the 3D scene has drawn its first frame (or after 3.5 s at worst).
    const showPage = () => root.classList.add('is-ready')
    window.addEventListener('sahifa:ready', showPage, { once: true })
    const readyTimer = window.setTimeout(showPage, 3500)

    // Smooth scroll + marquee skew driven by scroll velocity.
    const marquee = root.querySelector<HTMLElement>('.marquee')
    let lenis: Lenis | null = null
    let lenisRaf = 0
    const startLenis = () => {
      lenis = new Lenis({ anchors: true, lerp: 0.085 })
      lenis.on('scroll', (l: Lenis) => marquee?.style.setProperty('--skew', `${Math.max(-12, Math.min(12, l.velocity * 0.35))}deg`))
      const loop = (t: number) => {
        lenis?.raf(t)
        lenisRaf = requestAnimationFrame(loop)
      }
      lenisRaf = requestAnimationFrame(loop)
    }
    const stopLenis = () => {
      cancelAnimationFrame(lenisRaf)
      lenis?.destroy()
      lenis = null
      marquee?.style.setProperty('--skew', '0deg')
    }

    const toggle = root.querySelector<HTMLButtonElement>('[data-motion-toggle]')
    const applyMotion = (m: 'on' | 'off') => {
      html.dataset.motion = m
      toggle?.setAttribute('aria-pressed', String(m === 'on'))
      if (m === 'on' && !lenis) startLenis()
      if (m === 'off') stopLenis()
    }
    applyMotion(readMotion())
    const onToggle = () => {
      const next = html.dataset.motion === 'off' ? 'on' : 'off'
      try {
        localStorage.setItem('motion', next)
      } catch {}
      applyMotion(next)
    }
    toggle?.addEventListener('click', onToggle)

    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), reveal.unobserve(e.target))),
      { threshold: 0.18 },
    )
    root.querySelectorAll('[data-reveal], .mv, .frame-sec').forEach((el) => reveal.observe(el))

    const links = [...document.querySelectorAll<HTMLAnchorElement>('.scroll-ind a')]
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          links.forEach((a) => a.setAttribute('aria-current', String(a.hash === `#${e.target.id}`)))
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    root.querySelectorAll('section[id]').forEach((s) => spy.observe(s))

    // The indicator sits on the left edge; hide it over the footer where it would cover the link columns.
    const ind = document.querySelector('.scroll-ind')
    const footerIo = new IntersectionObserver(([e]) => ind?.classList.toggle('is-hidden', e.isIntersecting))
    const footer = root.querySelector('.lp-footer')
    if (footer) footerIo.observe(footer)

    const header = document.querySelector('.lp-header')
    const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    // UI mock-ups lean toward the pointer in 3D.
    const tilts = [...root.querySelectorAll<HTMLElement>('[data-tilt]')]
    const onTilt = (e: PointerEvent) => {
      const host = e.currentTarget as HTMLElement
      const r = host.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      host.style.setProperty('--ry', `${-14 + x * 22}deg`)
      host.style.setProperty('--rx', `${6 - y * 14}deg`)
    }
    const offTilt = (e: PointerEvent) => {
      const host = e.currentTarget as HTMLElement
      host.style.removeProperty('--ry')
      host.style.removeProperty('--rx')
    }
    tilts.forEach((el) => {
      el.addEventListener('pointermove', onTilt)
      el.addEventListener('pointerleave', offTilt)
    })

    const timers = new Map<Element, number>()
    const scramble = (e: Event) => {
      const el = e.currentTarget as HTMLElement
      const text = (el.dataset.text ??= el.textContent ?? '')
      let frame = 0
      clearInterval(timers.get(el))
      timers.set(el, window.setInterval(() => {
        el.textContent = [...text].map((c, i) => (c === ' ' || i < frame ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('')
        if (++frame > text.length) clearInterval(timers.get(el))
      }, 28))
    }
    const scrambled = [...root.querySelectorAll<HTMLElement>('[data-scramble]')]
    scrambled.forEach((el) => el.addEventListener('mouseenter', scramble))

    const menu = document.getElementById('menu')
    const closeMenu = (e: Event) => (e.target as HTMLElement).closest('a') && menu?.hidePopover?.()
    menu?.addEventListener('click', closeMenu)

    return () => {
      window.clearTimeout(readyTimer)
      window.removeEventListener('sahifa:ready', showPage)
      stopLenis()
      toggle?.removeEventListener('click', onToggle)
      reveal.disconnect()
      spy.disconnect()
      footerIo.disconnect()
      window.removeEventListener('scroll', onScroll)
      tilts.forEach((el) => {
        el.removeEventListener('pointermove', onTilt)
        el.removeEventListener('pointerleave', offTilt)
      })
      scrambled.forEach((el) => el.removeEventListener('mouseenter', scramble))
      timers.forEach((t) => clearInterval(t))
      menu?.removeEventListener('click', closeMenu)
      delete html.dataset.motion
    }
  }, [])
  return null
}
