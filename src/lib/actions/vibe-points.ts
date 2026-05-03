// src/lib/actions/vibe-points.ts
'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import type { TransactionType } from '@/types/database'

interface TransferResult { success: boolean; error?: string; new_balance?: number }

export async function mutateVibePoints({ userId, amount, type, referenceId, note }: {
  userId: string; amount: number; type: TransactionType; referenceId?: string; note?: string
}): Promise<TransferResult> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.rpc('mutate_vibe_points', {
    p_user_id: userId, p_amount: amount, p_type: type, p_reference_id: referenceId ?? null, p_note: note ?? null,
  })
  if (error) return { success: false, error: error.message }
  return { success: true, new_balance: data as number }
}

export async function sendTip({ releaseId, points, message }: { releaseId: string; points: number; message?: string }): Promise<TransferResult> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const supabase = await createAdminClient()
  const { data: release } = await supabase.from('releases').select('creator_id').eq('id', releaseId).single()
  if (!release) return { success: false, error: 'Release not found' }
  if (release.creator_id === user.id) return { success: false, error: 'Cannot tip your own release' }

  const { data, error } = await supabase.rpc('send_tip', {
    p_sender_id: user.id, p_release_id: releaseId, p_creator_id: release.creator_id, p_points: points, p_message: message ?? null,
  })
  if (error) return { success: false, error: error.message }
  return { success: true, new_balance: data as number }
}

export async function placePrediction({ marketId, optionId, pointsWagered }: { marketId: string; optionId: string; pointsWagered: number }): Promise<TransferResult> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const supabase = await createAdminClient()
  const { data, error } = await supabase.rpc('place_prediction', {
    p_user_id: user.id, p_market_id: marketId, p_option_id: optionId, p_points: pointsWagered,
  })
  if (error) return { success: false, error: error.message }
  return { success: true, new_balance: data as number }
}

export async function recordMiniGame({ gameType, pointsEarned, resultData }: { gameType: string; pointsEarned: number; resultData?: Record<string, unknown> }): Promise<TransferResult> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const supabase = await createAdminClient()
  const { data, error } = await supabase.rpc('record_mini_game', {
    p_user_id: user.id, p_game_type: gameType, p_points_earned: pointsEarned, p_result_data: resultData ?? null,
  })
  if (error) return { success: false, error: error.message }
  return { success: true, new_balance: data as number }
}

export async function dailyCheckin(): Promise<{ success: boolean; error?: string; points_earned?: number; streak_day?: number; already_checked_in?: boolean }> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const supabase = await createAdminClient()
  const { data, error } = await supabase.rpc('daily_checkin', { p_user_id: user.id })

  if (error) {
    if (error.message.includes('already_checked_in')) return { success: true, already_checked_in: true }
    return { success: false, error: error.message }
  }
  const result = data as { points_earned: number; streak_day: number }
  return { success: true, points_earned: result.points_earned, streak_day: result.streak_day }
}
