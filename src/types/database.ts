// src/types/database.ts
// Auto-generated types matching Supabase schema

export type ReleaseType = 'music' | 'video' | 'digital_art'
export type ReleaseStatus = 'draft' | 'published' | 'archived'
export type MarketStatus = 'open' | 'closed' | 'resolved' | 'cancelled'
export type TransactionType =
  | 'earn_checkin'
  | 'earn_minigame'
  | 'earn_tip_received'
  | 'spend_prediction'
  | 'spend_tip_sent'
  | 'refund_prediction'
  | 'reward_prediction'
  | 'admin_grant'
export type GameType =
  | 'spin_wheel'
  | 'daily_quiz'
  | 'lucky_draw'
  | 'rhythm_tap'
  | 'guess_the_track'
  | 'coin_flip'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  youtube_channel_id: string | null
  soundcloud_username: string | null
  is_artist: boolean
  is_bettor: boolean
  vibe_points: number
  created_at: string
  updated_at: string
}

export interface Release {
  id: string
  creator_id: string
  title: string
  type: ReleaseType
  description: string | null
  link_youtube: string | null
  link_soundcloud: string | null
  cover_image_url: string | null
  status: ReleaseStatus
  tip_total: number
  view_count: number
  released_at: string | null
  created_at: string
  updated_at: string
  // Joined
  profiles?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export interface Market {
  id: string
  release_id: string | null
  creator_id: string
  question: string
  description: string | null
  status: MarketStatus
  closes_at: string
  resolved_at: string | null
  resolution: string | null
  total_pool: number
  created_at: string
  updated_at: string
  // Joined
  releases?: Pick<Release, 'id' | 'title' | 'type' | 'cover_image_url'>
  profiles?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
  market_options?: MarketOption[]
  user_prediction?: Prediction | null
}

export interface MarketOption {
  id: string
  market_id: string
  label: string
  total_points_bet: number
  is_winner: boolean | null
  created_at: string
}

export interface Prediction {
  id: string
  user_id: string
  market_id: string
  option_id: string
  points_wagered: number
  points_returned: number | null
  created_at: string
}

export interface Tip {
  id: string
  sender_id: string
  release_id: string
  points: number
  message: string | null
  created_at: string
  profiles?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export interface MiniGameSession {
  id: string
  user_id: string
  game_type: GameType
  points_earned: number
  result_data: Record<string, unknown> | null
  played_at: string
}

export interface DailyCheckin {
  id: string
  user_id: string
  checkin_date: string
  streak_day: number
  points_earned: number
  created_at: string
}

export interface PointTransaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  reference_id: string | null
  note: string | null
  created_at: string
}

// Supabase Database type for typed client
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile> }
      releases: { Row: Release; Insert: Omit<Release, 'id' | 'created_at' | 'updated_at' | 'tip_total' | 'view_count'>; Update: Partial<Release> }
      markets: { Row: Market; Insert: Omit<Market, 'id' | 'created_at' | 'updated_at' | 'total_pool'>; Update: Partial<Market> }
      market_options: { Row: MarketOption; Insert: Omit<MarketOption, 'id' | 'created_at' | 'total_points_bet'>; Update: Partial<MarketOption> }
      predictions: { Row: Prediction; Insert: Omit<Prediction, 'id' | 'created_at'>; Update: Partial<Prediction> }
      tips: { Row: Tip; Insert: Omit<Tip, 'id' | 'created_at'>; Update: Partial<Tip> }
      mini_game_sessions: { Row: MiniGameSession; Insert: Omit<MiniGameSession, 'id'>; Update: Partial<MiniGameSession> }
      daily_checkins: { Row: DailyCheckin; Insert: Omit<DailyCheckin, 'id' | 'created_at'>; Update: Partial<DailyCheckin> }
      point_transactions: { Row: PointTransaction; Insert: Omit<PointTransaction, 'id' | 'created_at'>; Update: Partial<PointTransaction> }
    }
  }
}
