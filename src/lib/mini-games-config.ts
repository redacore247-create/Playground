// src/lib/mini-games-config.ts
// Plain config file — no 'use server' directive

export const SPIN_SEGMENTS = [
  { label: '5 VP',       points: 5,   weight: 30, is_jackpot: false },
  { label: '10 VP',      points: 10,  weight: 25, is_jackpot: false },
  { label: '20 VP',      points: 20,  weight: 18, is_jackpot: false },
  { label: '35 VP',      points: 35,  weight: 12, is_jackpot: false },
  { label: '50 VP',      points: 50,  weight: 8,  is_jackpot: false },
  { label: '75 VP',      points: 75,  weight: 4,  is_jackpot: false },
  { label: '💀 Lose',    points: 0,   weight: 2,  is_jackpot: false },
  { label: '🎰 JACKPOT', points: 200, weight: 1,  is_jackpot: true  },
]

export interface GameStatus {
  game_type: string
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

export interface SpinResult {
  segment_index: number
  label: string
  points: number
  is_jackpot: boolean
}

export interface TrackQuestion {
  release_id: string
  youtube_url: string
  correct_title: string
  choices: string[]
}

export interface QuizQuestion {
  id: string
  question: string
  choices: string[]
  correct_index: number
  category: string
}

export const QUIZ_BANK: QuizQuestion[] = [
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

export const GAME_LIMITS: Record<string, number> = {
  spin_wheel: 1,
  daily_quiz: 2,
  lucky_draw: 1,
  rhythm_tap: 5,
  guess_the_track: 3,
  coin_flip: 5,
}
