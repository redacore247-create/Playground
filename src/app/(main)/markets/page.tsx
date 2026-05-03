// src/app/(main)/markets/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getMarkets } from '@/lib/actions/market'
import { TopBar } from '@/components/layout/TopBar'
import { MarketCard } from '@/components/market/MarketCard'
import { MarketsFilters } from '@/components/market/MarketsFilters'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Profile } from '@/types/database'

export const metadata = { title: 'Prediction Markets' }

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const filter = (params.filter ?? 'open') as 'open' | 'resolved' | 'all'

  const [{ data: authData }, markets] = await Promise.all([
    supabase.auth.getUser(),
    getMarkets(filter),
  ])

  let profile: Profile | null = null
  if (authData.user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    profile = data
  }

  return (
    <>
      <TopBar profile={profile} title="Markets" />

      {/* Filter tabs */}
      <MarketsFilters active={filter} />

      {/* Create market CTA */}
      {profile && (
        <div className="px-4 pt-3 max-w-lg mx-auto">
          <Link
            href="/markets/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-plasma-500/30 bg-plasma-500/5 text-plasma-400 text-sm hover:bg-plasma-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create a prediction market
          </Link>
        </div>
      )}

      {/* Markets list */}
      <div className="px-4 pt-3 pb-6 space-y-3 max-w-lg mx-auto">
        {(markets ?? []).map(market => (
          <MarketCard
            key={market.id}
            market={market}
            currentUserId={authData.user?.id}
          />
        ))}

        {(!markets || markets.length === 0) && (
          <div className="py-16 text-center">
            <p className="text-zinc-500">No markets yet.</p>
            <p className="text-xs text-zinc-600 mt-1">
              {filter === 'open' ? 'Be the first to create a prediction market!' : 'No resolved markets yet.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
