// src/lib/actions/mini-games.ts
'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { GameType } from '@/types/database'

export interface GameStatus {
  game_type: GameType
  plays_today: number
  max_plays: number
  can_play: boolean
  total_earned_today: number
}

export interface AllGameStatus {
  spin_wheel: GameStatus
  daily_quiz: GameStatus
  guess_the_track: GameStatus
  checkin: {
    done_today: boolean
    streak_day: number
    points_today: number
  }
}

const GAME_LIMITS: Record<GameType, number> = {
  spin_wheel: 1,
  daily_quiz: 2,
  lucky_draw: 1,
  rhythm_tap: 5,
  guess_the_track: 3,
  coin_flip: 5,
}

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionList: any[] = sessions ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkinData: any = checkin

  function buildStatus(type: GameType): GameStatus {
    const plays = sessionList.filter((s: any) => s.game_type === type)
    const max = GAME_LIMITS[type]
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

// ── Spin Wheel ─────────────────────────────────────────────────────────────

export interface SpinResult {
  segment_index: number
  label: string
  points: number
  is_jackpot: boolean
}

import { SPIN_SEGMENTS } from '@/lib/spin-segments'
export { SPIN_SEGMENTS }

export async function spinWheel(): Promise<{
  success: boolean
  error?: string
  result?: SpinResult
  new_balance?: number
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ── Daily Check-in ──────────────────────────────────────────────────────────

export async function doCheckin(): Promise<{
  success: boolean
  error?: string
  already_checked_in?: boolean
  points_earned?: number
  streak_day?: number
  new_balance?: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.rpc('daily_checkin', { p_user_id: user.id })

  if (error) {
    if (error.message.includes('already_checked_in')) return { success: true, already_checked_in: true }
    return { success: false, error: error.message }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = data as any
  return {
    success: true,
    points_earned: res.points_earned,
    streak_day: res.streak_day,
    new_balance: res.new_balance,
  }
}

// ── Guess The Track ─────────────────────────────────────────────────────────

export interface TrackQuestion {
  release_id: string
  youtube_url: string
  correct_title: string
  choices: string[]
}

export async function getTrackQuestion(): Promise<TrackQuestion | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: releases } = await db
    .from('releases')
    .select('id, title, link_youtube')
    .eq('status', 'published')
    .eq('type', 'music')
    .not('link_youtube', 'is', null)
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function submitTrackGuess({
  releaseId,
  isCorrect,
  timeMs,
}: {
  releaseId: string
  isCorrect: boolean
  timeMs: number
}): Promise<{ success: boolean; error?: string; points_earned: number; new_balance?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated', points_earned: 0 }

  const speedBonus = isCorrect ? Math.max(0, Math.floor(20 - (timeMs / 1000) * 4)) : 0
  const points = isCorrect ? 20 + speedBonus : 0
  if (points === 0) return { success: true, points_earned: 0 }

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.rpc('record_mini_game', {
    p_user_id: user.id,
    p_game_type: 'guess_the_track',
    p_points_earned: points,
    p_result_data: { release_id: releaseId, correct: isCorrect, time_ms: timeMs, speed_bonus: speedBonus },
  })

  if (error) {
    if (error.message.includes('daily_limit_reached')) return { success: false, error: 'daily_limit_reached', points_earned: 0 }
    return { success: false, error: error.message, points_earned: 0 }
  }
  return { success: true, points_earned: points, new_balance: data as number }
}

// ── Daily Quiz ──────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  question: string
  choices: string[]
  correct_index: number
  category: string
}

const QUIZ_BANK: QuizQuestion[] = [
  { id: 'q1',  category: 'Music', question: 'Which streaming platform launched in 2008?', choices: ['Spotify', 'Apple Music', 'Tidal', 'Deezer'], correct_index: 0 },
  { id: 'q2',  category: 'Music', question: 'How many strings does a standard guitar have?', choices: ['4', '5', '6', '7'], correct_index: 2 },
  { id: 'q3',  category: 'Music', question: 'What does BPM stand for in music?', choices: ['Beats Per Minute', 'Bass Per Measure', 'Bars Per Mix', 'Beat Play Mode'], correct_index: 0 },
  { id: 'q4',  category: 'Music', question: 'Which genre originated in Jamaica in the late 1960s?', choices: ['Soul', 'Reggae', 'Ska', 'Dancehall'], correct_index: 1 },
  { id: 'q5',  category: 'Art',   question: 'What painting technique uses small dots of color?', choices: ['Impasto', 'Pointillism', 'Fresco', 'Sfumato'], correct_index: 1 },
  { id: 'q6',  category: 'Art',   question: 'Which artist painted the Mona Lisa?', choices: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Botticelli'], correct_index: 2 },
  { id: 'q7',  category: 'Music', question: 'What is the main recurring theme in a song called?', choices: ['Bridge', 'Chorus', 'Hook', 'Verse'], correct_index: 2 },
  { id: 'q8',  category: 'Tech',  question: 'What does NFT stand for?', choices: ['New Financial Token', 'Non-Fungible Token', 'Net File Transfer', 'Network Forge Technology'], correct_index: 1 },
  { id: 'q9',  category: 'Music', question: 'Which city is known as the birthplace of jazz?', choices: ['Chicago', 'New York', 'New Orleans', 'Memphis'], correct_index: 2 },
  { id: 'q10', category: 'Art',   question: 'What color do you get mixing red and blue?', choices: ['Green', 'Orange', 'Purple', 'Brown'], correct_index: 2 },
  { id: 'q11', category: 'Music', question: 'How many notes are in a standard musical octave?', choices: ['7', '8', '12', '16'], correct_index: 2 },
  { id: 'q12', category: 'Music', question: 'What does "forte" mean in music dynamics?', choices: ['Soft', 'Medium', 'Loud', 'Very fast'], correct_index: 2 },
]

export async function getQuizQuestions(count = 5): Promise<QuizQuestion[]> {
  return [...QUIZ_BANK].sort(() => Math.random() - 0.5).slice(0, count)
}

export async function submitQuizResult({
  correct,
  total,
  timeMs,
}: {
  correct: number
  total: number
  timeMs: number
}): Promise<{ success: boolean; error?: string; points_earned: number; new_balance?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated', points_earned: 0 }

  const points = correct * 5 + (correct === total ? 5 : 0)
  if (points === 0) return { success: true, points_earned: 0 }

  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.rpc('record_mini_game', {
    p_user_id: user.id,
    p_game_type: 'daily_quiz',
    p_points_earned: points,
    p_result_data: { correct, total, time_ms: timeMs },
  })

  if (error) {
    if (error.message.includes('daily_limit_reached')) return { success: false, error: 'daily_limit_reached', points_earned: 0 }
    return { success: false, error: error.message, points_earned: 0 }
  }
  return { success: true, points_earned: points, new_balance: data as number }
}
