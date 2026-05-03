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

export async function getProfileByUsername(
  username: string
): Promise<FullProfile | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch target profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) return null

  // Parallel fetch all related data
  const [
    { data: releases },
    { count: followerCount },
    { count: followingCount },
    { data: followCheck },
    { data: transactions },
    { data: predictions },
  ] = await Promise.all([
    supabase
      .from('releases')
      .select('*, profiles(id, username, display_name, avatar_url)')
      .eq('creator_id', profile.id)
      .eq('status', 'published')
      .order('released_at', { ascending: false })
      .limit(12),

    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),

    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),

    authUser && authUser.id !== profile.id
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', authUser.id)
          .eq('following_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Last 20 transactions (own profile only)
    authUser?.id === profile.id
      ? supabase
          .from('point_transactions')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),

    // Prediction stats
    supabase
      .from('predictions')
      .select('points_returned')
      .eq('user_id', profile.id),
  ])

  const correctPredictions = predictions?.filter(
    p => p.points_returned !== null && p.points_returned > 0
  ).length ?? 0

  const totalTipsReceived = releases?.reduce(
    (sum, r) => sum + (r.tip_total ?? 0), 0
  ) ?? 0

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
