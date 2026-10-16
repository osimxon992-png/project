import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getSellerId } from '@/lib/session'
import { LandingFx } from './LandingFx'
import { Scene } from './Scene'
import { TelegramLogin } from './TelegramLogin'
import './landing.css'

const PRO_PRICE = '99 000' // shortcut: hardcoded, move to env/DB when pricing changes often

const SECTIONS = [
  ['kv', 'top'],
  ['jarayon', 'jarayon'],
  ['missiya', 'missiya'],
  ['vizyon', 'vizyon'],
  ['imkoniyatlar', 'imkoniyatlar'],
  ['narxlar', 'narxlar'],
  ['boshlash', 'boshlash'],
] as const

const CROSSES = [[12, 22], [88, 18], [24, 80], [77, 84], [50, 10], [5, 52], [95, 58], [64, 28]]

const MARQUEE = ['Instagram', 'Telegram', 'Mahsulot', 'Buyurtma', 'AI tavsif', 'Excel', 'Statistika']

const STEPS = [
  {
    no: '01 / 03', time: '≈ 10 soniya', title: 'Telegram orqali kiring',
    sub: "Parol ham, ro'yxatdan o'tish formasi ham yo'q. Bir bosish bilan ichkaridasiz.",
    tags: ['telegram_login', 'parolsiz', 'bepul'], mock: 'login',
  },
  {
    no: '02 / 03', time: '≈ 5 daqiqa', title: "Do'kon va mahsulotlar",
    sub: "Nom, logo, narx, razmerlar. Excel'dan yuklang yoki tavsifni AI'ga yozdiring.",
    tags: ['excel_import', 'ai_tavsif', '5_ta_rasm'], mock: 'product',
  },
  {
    no: '03 / 03', time: '24 / 7', title: 'Buyurtmalar Telegramga',
    sub: 'Mijoz saytda buyurtma beradi, siz botda bir tugma bilan tasdiqlaysiz.',
    tags: ['telegram_bot', 'inline_tugmalar', 'holat_kuzatuvi'], mock: 'order',
  },
] as const

const FEATURES = [
  ['Shaxsiy manzil', "sahifa.uz/do'koningiz: Instagram bio va Telegram kanal uchun qisqa havola.", 'Your own address, ready for the bio.'],
  ['Telegramga buyurtmalar', "Tarkibi, summa va mijoz ma'lumotlari bilan. \"Tasdiqlash\" va \"Bekor qilish\" tugmalari.", 'Orders land in Telegram with one-tap actions.'],
  ['AI bilan tavsif', "Mahsulot nomi va 2–3 so'z: o'zbek va rus tilida tayyor sotuv matni.", 'Product copy in Uzbek and Russian, written for you.'],
  ['Excel / CSV import', "Butun katalogni bitta fayl bilan yuklang. Xato qatorlar aniq ko'rsatiladi.", 'Bulk upload your whole catalogue.'],
  ['Ikki tilli do\'kon', "Mijoz interfeysni o'zbek yoki rus tilida ko'radi.", 'Storefront in Uzbek and Russian.'],
  ['Statistika', "Oxirgi 7 va 30 kunlik ko'rishlar va buyurtmalar soni.", 'Views and orders at a glance.'],
]

function Slot({ children }: { children: string }) {
  return (
    <span className="slot">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )
}

// Word-by-word reveal: each word slides up out of its own clipping box.
function Split({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="w"><span style={{ '--i': i } as CSSProperties}>{w}</span></span>{' '}
        </span>
      ))}
    </>
  )
}

function Mock({ kind }: { kind: (typeof STEPS)[number]['mock'] }) {
  if (kind === 'login') {
    return (
      <div className="mock">
        <div className="mock-bar"><i /><i /><i /><span>sahifa.uz</span></div>
        <div className="mock-body">
          <h4>KIRISH</h4>
          <p className="muted" style={{ margin: 0 }}>Do&apos;koningizni yaratish uchun Telegram akkauntingiz bilan kiring.</p>
          <span className="tg-btn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.4-.1-.6-.6-.2L6.4 13.1l-4.7-1.5c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3z" /></svg>
            Log in with Telegram
          </span>
          <div className="row small muted"><span className="tag">✓</span> @sahifa_bot sizga xabar yuborishi mumkin</div>
        </div>
      </div>
    )
  }
  if (kind === 'product') {
    return (
      <div className="mock">
        <div className="mock-bar"><i /><i /><i /><span>sahifa.uz/dashboard/products/new</span></div>
        <div className="mock-body two">
          <div className="pic">IMG 1/5</div>
          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <div className="field"><small>Nomi</small><div>Zig&apos;ir ko&apos;ylak</div></div>
            <div className="field"><small>Narxi</small><div className="price">289 000 so&apos;m</div></div>
            <div className="chips"><span>S</span><span>M</span><span>L</span><span>XL</span></div>
            <span className="ai">✦ AI bilan yozish</span>
            <div className="lines"><i /><i /><i /></div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="mock">
      <div className="mock-bar"><span className="avatar">S</span><span style={{ background: 'none', margin: 0 }}>Sahifa bot</span></div>
      <div className="mock-body chat">
        <div className="bubble">
          <b>🛒 Yangi buyurtma #k3F9xQ2</b>
          <div className="mono">• Zig&apos;ir ko&apos;ylak (M) × 2 — 578 000 so&apos;m</div>
          <div className="mono">Jami: 578 000 so&apos;m</div>
          <div className="mono">👤 Dilnoza · 📞 +998 90 ··· ·· 67</div>
        </div>
        <div className="inline-btns"><span>✅ Tasdiqlash</span><span>❌ Bekor qilish</span></div>
      </div>
    </div>
  )
}

export default async function Landing() {
  const loggedIn = !!(await getSellerId())
  const bot = process.env.BOT_USERNAME ?? ''
  const cta = loggedIn ? { href: '/dashboard', text: "Panelga o'tish" } : { href: '#boshlash', text: 'Bepul boshlash' }

  return (
    <div className="lp">
      <Scene />
      <LandingFx />
      <div className="loader" aria-hidden="true">
        <p>Har bir kichik biznesga<br />o&apos;z onlayn do&apos;koni.</p>
        <i />
      </div>

      <header className="lp-header">
        <Link href="/" className="logo" aria-label="Sahifa — bosh sahifa">Sahifa</Link>
        <nav className="lp-nav" aria-label="Asosiy">
          <a href="#jarayon">Jarayon</a>
          <a href="#missiya">Missiya</a>
          <a href="#imkoniyatlar">Imkoniyatlar</a>
          <a href="#narxlar">Narxlar</a>
        </nav>
        <div className="lp-right">
          <button type="button" className="motion-toggle" data-motion-toggle aria-pressed="true" aria-label="Animatsiyani yoqish yoki o'chirish">
            <span className="bars" aria-hidden="true"><i /><i /><i /><i /></span>
            <span className="mono">motion</span>
          </button>
          <Link href={cta.href} className="btn"><Slot>{cta.text}</Slot></Link>
          <button className="hamburger" popoverTarget="menu" aria-label="Menyu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div id="menu" popover="auto" className="side-menu">
        <button className="btn btn-small side-close" popoverTarget="menu" popoverTargetAction="hide">Yopish ×</button>
        <span className="label">Menyu</span>
        <ul>
          {SECTIONS.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label === 'top' ? 'Bosh sahifa' : label[0].toUpperCase() + label.slice(1)}</a></li>)}
          <li><Link href="/dashboard">Panel</Link></li>
        </ul>
      </div>

      <nav className="scroll-ind" aria-label="Bo'limlar">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}><span>{label}</span></a>)}
      </nav>

      <main>
        {/* ---------- KV ---------- */}
        <section id="kv" className="kv" aria-label="Sahifa">
          <div className="crosses" aria-hidden="true">
            {CROSSES.map(([x, y]) => <i key={`${x}-${y}`} style={{ '--x': `${x}%`, '--y': `${y}%` } as CSSProperties} />)}
          </div>

          <div className="kv-content">
            <div>
              <h1 className="kv-mark">SAHIFA<span className="hp"> — Instagram va Telegram do&apos;konlari uchun sayt</span></h1>
              <div className="kv-text">
                <p className="kv-lead">Do&apos;koningiz uchun sayt — 5 daqiqada.</p>
                <p className="kv-en">Online stores for Instagram<br />and Telegram sellers in Uzbekistan.</p>
              </div>
            </div>
          </div>

          <aside className="kv-news" aria-label="Sahifa ichida">
            <h2>Sahifa ichida</h2>
            <ul>
              <li><b>S / 02</b><span>Buyurtmalar Telegramga keladi, bir tugma bilan tasdiqlanadi</span></li>
              <li><b>S / 03</b><span>AI o&apos;zbek va rus tilida mahsulot tavsifini yozadi</span></li>
              <li><b>S / 04</b><span>Butun katalog Excel yoki CSV orqali yuklanadi</span></li>
            </ul>
          </aside>
          <a href="#jarayon" className="kv-scroll">scroll to explore</a>
        </section>

        {/* ---------- Steps (works) ---------- */}
        <section id="jarayon" className="sec" aria-labelledby="jarayon-h">
          <div className="sec-head" data-reveal>
            <h2 id="jarayon-h"><span className="label"><b>01</b> / jarayon</span><Split text="Qanday ishlaydi" /></h2>
            <p className="en">Three steps from zero<br />to your first order.</p>
          </div>
          {STEPS.map((s) => (
            <article key={s.no} className="step">
              <div className="step-visual" data-tilt>
                <div className="mock-wrap" data-reveal><div className="mock-float"><Mock kind={s.mock} /></div></div>
              </div>
              <div className="step-info" data-reveal>
                <div className="step-meta"><time>{s.no}</time><span className="tag">{s.time}</span></div>
                <h3 className="step-title"><Split text={s.title} /></h3>
                <p className="step-sub">{s.sub}</p>
                <ul className="step-tags">{s.tags.map((t) => <li key={t} className="tag-line">{t}</li>)}</ul>
              </div>
            </article>
          ))}
        </section>

        {/* ---------- Mission / Vision ---------- */}
        <section id="missiya" className="mv" aria-labelledby="missiya-h">
          <div className="mv-inner">
            <h2 id="missiya-h" className="mv-title">MISSION</h2>
            <p className="mv-text">
              <span className="mv-line"><span className="mv-marker">O&apos;zbekistondagi har bir</span></span>
              <span className="mv-line"><span className="mv-marker">kichik biznesga o&apos;z</span></span>
              <span className="mv-line"><span className="mv-marker">onlayn do&apos;konini beramiz.</span></span>
            </p>
            <p className="mv-en">Giving every small business in Uzbekistan<br />an online store of its own.</p>
          </div>
        </section>
        <section id="vizyon" className="mv" aria-labelledby="vizyon-h">
          <div className="mv-inner">
            <h2 id="vizyon-h" className="mv-title">VISION</h2>
            <p className="mv-text">
              <span className="mv-line"><span className="mv-marker">Direkt va skrinshotlardan</span></span>
              <span className="mv-line"><span className="mv-marker">haqiqiy do&apos;kon</span></span>
              <span className="mv-line"><span className="mv-marker">tajribasiga.</span></span>
            </p>
            <p className="mv-en">From DMs and screenshots<br />to a real storefront experience.</p>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <span key={k}>{MARQUEE.map((m) => <span key={m}>{m}<i>✦</i></span>)}</span>
            ))}
          </div>
        </div>

        {/* ---------- Features (service) ---------- */}
        <section id="imkoniyatlar" className="sec" aria-labelledby="imk-h" style={{ paddingBottom: 160, borderTop: '1px solid var(--line)' }}>
          <div className="sec-head" data-reveal>
            <h2 id="imk-h"><span className="label"><b>02</b> / imkoniyatlar</span><Split text="Hammasi bir joyda" /></h2>
            <p className="en">Everything a small shop needs.<br />Nothing it doesn&apos;t.</p>
          </div>
          <ol className="feat-list" role="list">
            {FEATURES.map(([title, text, en], i) => (
              <li key={title} className="feat" data-reveal>
                <span className="feat-no">S / {String(i + 1).padStart(2, '0')}</span>
                <div><h3>{title}</h3></div>
                <div><p>{text}</p><p className="en">{en}</p></div>
                <span className="arrow-circle" aria-hidden="true">↗</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Pricing (framed) ---------- */}
        <section id="narxlar" className="frame-sec" aria-labelledby="narx-h">
          <div className="frame" aria-hidden="true">
            <div className="crosses"><i /><i /><i /><i /></div>
            <b /><b /><b /><b />
          </div>
          <div className="sec-head" data-reveal>
            <h2 id="narx-h"><span className="label"><b>03</b> / narxlar</span><Split text="14 kun bepul" /></h2>
            <p className="en">Start free. Upgrade<br />when your shop grows.</p>
          </div>
          <div className="plans-x" data-reveal>
            <article className="plan-x">
              <span className="tag tag-muted">Bepul</span>
              <p className="amount">0</p>
              <span className="per">so&apos;m · har doim</span>
              <ul>
                <li>10 tagacha mahsulot</li>
                <li>Telegramga buyurtmalar</li>
                <li>AI tavsif va Excel import</li>
                <li>Pastda &quot;Sahifa&apos;da yaratilgan&quot; yozuvi</li>
              </ul>
            </article>
            <article className="plan-x featured">
              <span className="tag">Pro</span>
              <p className="amount">{PRO_PRICE}</p>
              <span className="per">so&apos;m · oyiga</span>
              <ul>
                <li>Cheksiz mahsulot</li>
                <li>Telegramga buyurtmalar</li>
                <li>AI tavsif va Excel import</li>
                <li>Reklama yozuvisiz</li>
              </ul>
            </article>
          </div>
        </section>

        {/* ---------- Outro / login ---------- */}
        <section id="boshlash" className="outro" aria-labelledby="start-h">
          <span className="label"><b>04</b> / boshlash</span>
          <h2 id="start-h" data-reveal><Split text="BOSHLAYMIZMI?" /></h2>
          <p>Telegram orqali kiring. Do&apos;koningiz bir necha daqiqada tayyor bo&apos;ladi, 14 kun bepul.</p>
          <div className="login-box">
            {loggedIn ? (
              <Link href="/dashboard" className="btn btn-accent btn-big"><Slot>Panelga o&apos;tish</Slot> →</Link>
            ) : bot ? (
              <TelegramLogin bot={bot} authUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/telegram`} />
            ) : (
              <span className="tag tag-muted">Telegram bot sozlanmagan: .env faylida BOT_USERNAME ni kiriting</span>
            )}
            <p className="hint">Bot sizga buyurtmalarni yuborishi uchun xabar yuborishga ruxsat so&apos;raladi.</p>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="f-top">
          <div className="f-cols">
            <div className="f-col">
              <h2 className="f-title">Sahifa</h2>
              <ul>
                <li><a href="#jarayon" data-scramble>Jarayon</a></li>
                <li><a href="#missiya" data-scramble>Missiya</a></li>
                <li><a href="#imkoniyatlar" data-scramble>Imkoniyatlar</a></li>
                <li><a href="#narxlar" data-scramble>Narxlar</a></li>
              </ul>
            </div>
            <div className="f-col">
              <h2 className="f-title">Sotuvchilar</h2>
              <ul>
                <li><Link href="/dashboard" data-scramble>Panel</Link></li>
                <li><Link href="/dashboard/products" data-scramble>Mahsulotlar</Link></li>
                <li><Link href="/dashboard/orders" data-scramble>Buyurtmalar</Link></li>
              </ul>
            </div>
          </div>
          <div className="f-contact">
            <a href="#boshlash"><span data-scramble>Bepul boshlash</span><span className="arrow-circle" aria-hidden="true">↗</span></a>
            {bot && (
              <a href={`https://t.me/${bot}`} target="_blank" rel="noopener"><span data-scramble>Telegram bot</span><span className="arrow-circle" aria-hidden="true">↗</span></a>
            )}
          </div>
        </div>
        <p className="f-copy">©{new Date().getFullYear()} Sahifa</p>
        <svg className="f-logo" viewBox="0 0 1000 168" role="img" aria-label="Sahifa">
          <text x="0" y="150" fontSize="190" textLength="1000" lengthAdjust="spacingAndGlyphs">SAHIFA</text>
        </svg>
      </footer>
    </div>
  )
}
