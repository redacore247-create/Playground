// src/lib/spin-segments.ts
// NOT a server file - exports a plain constant

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
