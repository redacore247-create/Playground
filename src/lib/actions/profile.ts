// src/lib/actions/profile.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile, Release, PointTransaction } from '@/types/database'

export interface FullProfile {
  profile: Profile
  releases: Release[]
  follower_count: number
  following_count: number
  is_following: boolean
  transaction_history: PointTransaction[]
  total_tips_received: number
  total_predictions: number
  correct_predictions: number
}

export async function getProfileByUsername(username: string): Promise<FullProfile | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: profile, error } = await db
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) return null

  const [
    { data: releases },
    { count: followerCount },
    { count: followingCount },
    { data: followCheck },
    { data: transactions },
    { data: predictions },
  ] = await Promise.all([
    db.from('releases')
      .select('*, profiles(id, username, display_name, avatar_url)')
      .eq('creator_id', profile.id)
      .eq('status', 'published')
      .order('released_at', { ascending: false })
      .limit(12),

    db.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),

    db.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),

    authUser && authUser.id !== profile.id
      ? db.from('follows')
          .select('follower_id')
          .eq('follower_id', authUser.id)
          .eq('following_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    authUser?.id === profile.id
      ? db.from('point_transactions')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),

    db.from('predictions')
      .select('points_returned')
      .eq('user_id', profile.id),
  ])

  const correctPredictions = (predictions ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => p.points_returned !== null && p.points_returned > 0
  ).length

  const totalTipsReceived = (releases ?? []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, r: any) => sum + (r.tip_total ?? 0), 0
  )

  return {
    profile: profile as Profile,
    releases: (releases as Release[]) ?? [],
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
    is_following: !!followCheck,
    transaction_history: (transactions as PointTransaction[]) ?? [],
    total_tips_received: totalTipsReceived,
    total_predictions: predictions?.length ?? 0,
    correct_predictions: correctPredictions,
  }
}
