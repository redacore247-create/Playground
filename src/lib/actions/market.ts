// src/lib/actions/market.ts
'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Market } from '@/types/database'

// ── Fetch ──────────────────────────────────────────────────────────────────

export async function getMarkets(filter: 'open' | 'resolved' | 'all' = 'open') {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('markets')
    .select(`*, profiles (id, username, display_name, avatar_url), releases (id, title, type, cover_image_url), market_options (*)`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data, error } = await query
  if (error) return null
  return data as Market[]
}

export async function getMarketById(id: string): Promise<Market | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('markets')
    .select(`*, profiles (id, username, display_name, avatar_url), releases (id, title, type, cover_image_url), market_options (*)`)
    .eq('id', id)
    .single()

  if (error || !data) return null

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pred } = await (supabase as any)
      .from('predictions')
      .select('*')
      .eq('market_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    return { ...data, user_prediction: pred } as Market
  }

  return data as Market
}

// ── Create ─────────────────────────────────────────────────────────────────

const CreateMarketSchema = z.object({
  releaseId: z.string().uuid().optional(),
  question: z.string().min(10).max(200),
  description: z.string().max(500).optional(),
  options: z.array(z.string().min(1).max(80)).min(2).max(6),
  closesAt: z.string().datetime(),
})

export async function createMarket(input: z.infer<typeof CreateMarketSchema>): Promise<{
  success: boolean
  error?: string
  marketId?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = CreateMarketSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const admin = await createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: market, error: mErr } = await (admin as any)
    .from('markets')
    .insert({
      creator_id: user.id,
      release_id: parsed.data.releaseId ?? null,
      question: parsed.data.question,
      description: parsed.data.description ?? null,
      status: 'open',
      closes_at: parsed.data.closesAt,
    })
    .select('id')
    .single()

  if (mErr) return { success: false, error: mErr.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: oErr } = await (admin as any).from('market_options').insert(
    parsed.data.options.map((label: string) => ({
      market_id: market.id,
      label,
    }))
  )

  if (oErr) return { success: false, error: oErr.message }

  return { success: true, marketId: market.id }
}

// ── Bet ────────────────────────────────────────────────────────────────────

export async function placeBet({
  marketId,
  optionId,
  points,
}: {
  marketId: string
  optionId: string
  points: number
}): Promise<{ success: boolean; error?: string; new_balance?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const admin = await createAdminClient()
  const { data, error } = await (admin as any).rpc('place_prediction', {
    p_user_id: user.id,
    p_market_id: marketId,
    p_option_id: optionId,
    p_points: points,
  })

  if (error) {
    const msg = error.message
    if (msg.includes('insufficient_points')) return { success: false, error: 'Not enough Vibe Points' }
    if (msg.includes('already_predicted')) return { success: false, error: 'You already placed a bet' }
    if (msg.includes('market_not_open')) return { success: false, error: 'Market is closed' }
    if (msg.includes('market_closed')) return { success: false, error: 'Betting period has ended' }
    return { success: false, error: msg }
  }

  return { success: true, new_balance: data as number }
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  vibe_points: number
  rank: number
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, username, display_name, avatar_url, vibe_points')
    .order('vibe_points', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((p, i) => ({ ...p, rank: i + 1 }))
}
