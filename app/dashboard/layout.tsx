import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSeller } from '@/lib/session'
import { logout } from './actions'

export const metadata: Metadata = { title: 'Panel — Sahifa', robots: { index: false } }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sellerId = await requireSeller()
  const isAdmin = (process.env.ADMIN_TELEGRAM_IDS ?? '').split(',').map((s) => s.trim()).includes(String(sellerId))

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/dashboard" className="logo">Sahifa</Link>
          <nav aria-label="Panel">
            <Link href="/dashboard">Umumiy</Link>
            <Link href="/dashboard/products">Mahsulotlar</Link>
            <Link href="/dashboard/orders">Buyurtmalar</Link>
            <Link href="/dashboard/shop">Do&apos;kon</Link>
            {isAdmin && <Link href="/admin">Admin</Link>}
            <form action={logout}><button className="btn btn-small">Chiqish</button></form>
          </nav>
        </div>
      </header>
      <main className="wrap" style={{ padding: '48px var(--gutter) 96px' }}>{children}</main>
    </>
  )
}
