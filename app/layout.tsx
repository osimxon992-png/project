import type { Metadata } from 'next'
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const sans = IBM_Plex_Sans({ subsets: ['latin', 'cyrillic'], weight: ['300', '400', '500', '600'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin', 'cyrillic'], weight: ['300', '400', '600'], variable: '--font-mono' })
// Variable width axis gives the wide wordmark look (alche uses acumin-pro / a custom logotype).
const display = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-display' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: "Sahifa — Instagram do'koningiz uchun sayt",
  description: "Kichik bizneslar uchun onlayn do'kon 5 daqiqada. Buyurtmalar to'g'ridan-to'g'ri Telegramga keladi.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  )
}
