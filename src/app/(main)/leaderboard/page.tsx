// src/app/(main)/leaderboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/lib/actions/market'
import { Leaderboard } from '@/components/shared/Leaderboard'
import { TopBar } from '@/components/layout/TopBar'
import type { Profile } from '@/types/database'

export const metadata = { title: 'Leaderboard' }

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [entries, profileResult] = await Promise.all([
    getLeaderboard(50),
    user
      ? supabase.from('profiles').select('*').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  const profile = profileResult.data as Profile | null

  return (
    <>
      <TopBar profile={profile} title="Leaderboard" />
      <div className="max-w-lg mx-auto px-4 py-4 pb-8">
        <Leaderboard
          entries={entries}
          currentUserId={user?.id}
        />
      </div>
    </>
  )
}
