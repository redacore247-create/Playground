// src/lib/actions/mini-games.ts
'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  SPIN_SEGMENTS, QUIZ_BANK, GAME_LIMITS,
  type AllGameStatus, type GameStatus,
  type SpinResult, type TrackQuestion, type QuizQuestion,
} from '@/lib/mini-games-config'

export type { AllGameStatus, GameStatus, SpinResult, TrackQuestion, QuizQuestion }

export async function getGameStatus(): Promise<AllGameStatus | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = supabase
  const today = new Date().toISOString().split('T')[0]

  const [{ data: sessions }, { data: checkin }] = await Promise.all([
    db.from('mini_game_sessions')
      .select('game_type, points_earned')
      .eq('user_id', user.id)
      .gte('played_at', `${today}T00:00:00`),
    db.from('daily_checkins')
      .select('streak_day, points_earned, checkin_date')
      .eq('user_id', user.id)
      .order('checkin_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const sessionList: any[] = sessions ?? []
  const checkinData: any = checkin

  function buildStatus(type: string): GameStatus {
    const plays = sessionList.filter((s: any) => s.game_type === type)
    const max = GAME_LIMITS[type] ?? 3
    return {
      game_type: type,
      plays_today: plays.length,
      max_plays: max,
      can_play: plays.length < max,
      total_earned_today: plays.reduce((sum: number, s: any) => sum + s.points_earned, 0),
    }
  }

  const checkinDoneToday = checkinData?.checkin_date === today

  return {
    spin_wheel: buildStatus('spin_wheel'),
    daily_quiz: buildStatus('daily_quiz'),
    guess_the_track: buildStatus('guess_the_track'),
    checkin: {
      done_today: checkinDoneToday,
      streak_day: checkinData?.streak_day ?? 0,
      points_today: checkinDoneToday ? (checkinData?.points_earned ?? 0) : 0,
    },
  }
}

export async function spinWheel(): Promise<{
  success: boolean; error?: string; result?: SpinResult; new_balance?: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const totalWeight = SPIN_SEGMENTS.reduce((s, seg) => s + seg.weight, 0)
  let rand = Math.random() * totalWeight
  let chosen = 0
  for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
    rand -= SPIN_SEGMENTS[i].weight
    if (rand <= 0) { chosen = i; break }
  }
  const seg = SPIN_SEGMENTS[chosen]

  const admin = await createAdminClient()
  const { data, error } = await admin.rpc('record_mini_game', {
    p_user_id: user.id,
    p_game_type: 'spin_wheel',
    p_points_earned: seg.points,
    p_result_data: { segment_index: chosen, label: seg.label, is_jackpot: seg.is_jackpot },
  })

  if (error) {
    if (error.message.includes('daily_limit_reached')) return { success: false, error: 'daily_limit_reached' }
    return { success: false, error: error.message }
  }

  return {
    success: true,
    result: { segment_index: chosen, label: seg.label, points: seg.points, is_jackpot: seg.is_jackpot },
    new_balance: data as number,
  }
}

export async function doCheckin(): Promise<{
  success: boolean; error?: string; already_checked_in?: boolean
  points_earned?: number; streak_day?: number; new_balance?: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const admin = await createAdminClient()
  const { data, error } = await admin.rpc('daily_checkin', { p_user_id: user.id })

  if (error) {
    if (error.message.includes('already_checked_in')) return { success: true, already_checked_in: true }
    return { success: false, error: error.message }
  }

  const res = data as any
  return { success: true, points_earned: res.points_earned, streak_day: res.streak_day, new_balance: res.new_balance }
}

export async function getTrackQuestion(): Promise<TrackQuestion | null> {
  const supabase = await createClient()

  const { data: releases } = await supabase
    .from('releases')
    .select('id, title, link_youtube')
    .eq('status', 'published')
    .eq('type', 'music')
    .not('link_youtube', 'is', null)
    .limit(50)

  const list: any[] = releases ?? []
  if (list.length < 4) return null

  const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 4)
  const correct = shuffled[0]

  return {
    release_id: correct.id,
    youtube_url: correct.link_youtube,
    correct_title: correct.title,
    choices: shuffled.map((r: any) => r.title).sort(() => Math.random() - 0.5),
  }
}

export async function submitTrackGuess({ releaseId, isCorrect, timeMs }: {
  releaseId: string; isCorrect: boolean; timeMs: number
}): Promise<{ success: boolean; error?: string; points_earned: number; new_balance?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated', points_earned: 0 }

  const speedBonus = isCorrect ? Math.max(0, Math.floor(20 - (timeMs / 1000) * 4)) : 0
  const points = isCorrect ? 20 + speedBonus : 0
  if (points === 0) return { success: true, points_earned: 0 }

  const admin = await createAdminClient()
  const { data, error } = await admin.rpc('record_mini_game', {
    p_user_id: user.id, p_game_type: 'guess_the_track', p_points_earned: points,
    p_result_data: { release_id: releaseId, correct: isCorrect, time_ms: timeMs, speed_bonus: speedBonus },
  })

  if (error) {
    if (error.message.includes('daily_limit_reached')) return { success: false, error: 'daily_limit_reached', points_earned: 0 }
    return { success: false, error: error.message, points_earned: 0 }
  }
  return { success: true, points_earned: points, new_balance: data as number }
}

export async function getQuizQuestions(count = 5): Promise<QuizQuestion[]> {
  return [...QUIZ_BANK].sort(() => Math.random() - 0.5).slice(0, count)
}

export async function submitQuizResult({ correct, total, timeMs }: {
  correct: number; total: number; timeMs: number
}): Promise<{ success: boolean; error?: string; points_earned: number; new_balance?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated', points_earned: 0 }

  const points = correct * 5 + (correct === total ? 5 : 0)
  if (points === 0) return { success: true, points_earned: 0 }

  const admin = await createAdminClient()
  const { data, error } = await admin.rpc('record_mini_game', {
    p_user_id: user.id, p_game_type: 'daily_quiz', p_points_earned: points,
    p_result_data: { correct, total, time_ms: timeMs },
  })

  if (error) {
    if (error.message.includes('daily_limit_reached')) return { success: false, error: 'daily_limit_reached', points_earned: 0 }
    return { success: false, error: error.message, points_earned: 0 }
  }
  return { success: true, points_earned: points, new_balance: data as number }
}
