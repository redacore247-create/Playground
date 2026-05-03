// src/app/(main)/mini-games/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGameStatus } from '@/lib/actions/mini-games'
import { MiniGamesClient } from '@/components/minigame/MiniGamesClient'
import { TopBar } from '@/components/layout/TopBar'
import type { Profile } from '@/types/database'

export const metadata = { title: 'Mini Games' }

export default async function MiniGamesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/mini-games')

  const [profileResult, gameStatus] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getGameStatus(),
  ])

  const profile = profileResult.data as Profile | null
  if (!profile) redirect('/')

  return (
    <>
      <TopBar profile={profile} title="Mini Games" />
      <MiniGamesClient initialProfile={profile} gameStatus={gameStatus} />
    </>
  )
}
