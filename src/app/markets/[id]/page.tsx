// src/app/markets/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMarketById } from '@/lib/actions/market'
import { MarketDetailClient } from '@/components/market/MarketDetailClient'
import type { Profile } from '@/types/database'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const market = await getMarketById(id)
  return { title: market?.question ?? 'Market' }
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [market, profileResult] = await Promise.all([
    getMarketById(id),
    user
      ? supabase.from('profiles').select('*').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  if (!market) notFound()

  return (
    <div className="min-h-dvh bg-zinc-950 pb-8">
      <MarketDetailClient
        market={market}
        profile={profileResult.data as Profile | null}
      />
    </div>
  )
}
