import type { Metadata } from 'next'
import { getDict } from '@/lib/i18n'
import { Checkout } from './Checkout'

export const metadata: Metadata = { robots: { index: false } }

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { t } = await getDict()
  return <Checkout slug={slug} t={t} />
}
