// src/app/(main)/page.tsx  (Home Feed)
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { HomeFeed } from '@/components/feed/HomeFeed'
import { FeedFilters } from '@/components/feed/FeedFilters'
import type { Release, Profile } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: releases }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('releases')
      .select(`*, profiles (id, username, display_name, avatar_url)`)
      .eq('status', 'published')
      .order('released_at', { ascending: false })
      .limit(10),
  ])

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  return (
    <>
      <TopBar profile={profile} showLogo />
      <FeedFilters />
      <HomeFeed
        initialReleases={(releases as Release[]) ?? []}
        currentUser={profile}
      />
    </>
  )
}
