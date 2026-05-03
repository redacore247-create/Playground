// src/components/minigame/MiniGamesClient.tsx
'use client'

import { useState, useCallback } from 'react'
import { Zap, RotateCw, Flame, Music, Brain, ChevronRight, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatVP } from '@/lib/utils'
import { SpinWheel } from './SpinWheel'
import { DailyCheckin } from './DailyCheckin'
import { GuessTheTrack } from './GuessTheTrack'
import { DailyQuiz } from './DailyQuiz'
import { VPToast } from './VPToast'
import type { Profile } from '@/types/database'
import type { AllGameStatus, SpinResult } from '@/lib/actions/mini-games'

interface MiniGamesClientProps {
  initialProfile: Profile
  gameStatus: AllGameStatus | null
}

type GameId = 'checkin' | 'spin' | 'quiz' | 'guess'

interface GameTab {
  id: GameId
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  description: string
  maxPts: string
}

const GAME_TABS: GameTab[] = [
  {
    id: 'checkin',
    label: 'Daily Check-in',
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/25',
    description: 'Streak rewards',
    maxPts: '10–60 VP',
  },
  {
    id: 'spin',
    label: 'Spin Wheel',
    icon: RotateCw,
    color: 'text-vibe-400',
    bgColor: 'bg-vibe-500/10',
    borderColor: 'border-vibe-500/25',
    description: '1x per day',
    maxPts: '5–200 VP',
  },
  {
    id: 'quiz',
    label: 'Vibe Quiz',
    icon: Brain,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/25',
    description: '5 questions',
    maxPts: '5–30 VP',
  },
  {
    id: 'guess',
    label: 'Guess Track',
    icon: Music,
    color: 'text-plasma-400',
    bgColor: 'bg-plasma-500/10',
    borderColor: 'border-plasma-500/25',
    description: '3x per day',
    maxPts: '20–40 VP',
  },
]

export function MiniGamesClient({ initialProfile, gameStatus }: MiniGamesClientProps) {
  const [activeGame, setActiveGame] = useState<GameId>('checkin')
  const [balance, setBalance] = useState(initialProfile.vibe_points)
  const [vpToast, setVpToast] = useState<{ points: number; isJackpot?: boolean } | null>(null)
  const [status, setStatus] = useState(gameStatus)

  // Track plays locally to update UI without re-fetching
  const [localPlays, setLocalPlays] = useState<Record<string, number>>({
    spin: gameStatus?.spin_wheel.plays_today ?? 0,
    quiz: gameStatus?.daily_quiz.plays_today ?? 0,
    guess: gameStatus?.guess_the_track.plays_today ?? 0,
  })

  const showVPGain = useCallback((points: number, isJackpot = false) => {
    setBalance(prev => prev + points)
    setVpToast({ points, isJackpot })
  }, [])

  function handleSpinWin(result: SpinResult, newBalance: number) {
    setBalance(newBalance)
    setLocalPlays(prev => ({ ...prev, spin: prev.spin + 1 }))
    if (result.points > 0) {
      showVPGain(result.points, result.is_jackpot)
      toast.success(
        result.is_jackpot ? '🎰 JACKPOT! You hit the jackpot!' : `Spun ${result.label}!`,
        { description: `+${result.points} Vibe Points` }
      )
    } else {
      toast('💀 Better luck next time!', { description: 'No points this spin' })
    }
  }

  function handleCheckin(points: number, streak: number, newBalance: number) {
    setBalance(newBalance)
    if (points > 0) {
      showVPGain(points)
      toast.success(`Day ${streak} streak! 🔥`, {
        description: `+${points} Vibe Points earned`,
      })
    }
  }

  function handleQuizWin(points: number, newBalance: number) {
    setBalance(newBalance)
    setLocalPlays(prev => ({ ...prev, quiz: prev.quiz + 1 }))
    if (points > 0) showVPGain(points)
  }

  function handleGuessWin(points: number, newBalance: number) {
    setBalance(newBalance)
    setLocalPlays(prev => ({ ...prev, guess: prev.guess + 1 }))
    if (points > 0) showVPGain(points)
  }

  const activeTab = GAME_TABS.find(t => t.id === activeGame)!

  return (
    <div className="max-w-lg mx-auto">
      {/* VP Balance header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Balance</p>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-vibe-400" />
              <span className="font-display font-bold text-2xl text-vibe-400 tabular-nums">
                {formatVP(balance)}
              </span>
            </div>
          </div>

          {/* Daily earnings summary */}
          <div className="text-right">
            <p className="text-xs text-zinc-600 mb-1">Today</p>
            <div className="flex items-center gap-1 text-zinc-400 text-sm">
              {status?.checkin.done_today && (
                <span className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center text-[10px]">
                  🔥
                </span>
              )}
              {localPlays.spin > 0 && (
                <span className="w-5 h-5 rounded bg-vibe-500/20 flex items-center justify-center text-[10px]">
                  ⚡
                </span>
              )}
              {localPlays.quiz > 0 && (
                <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-[10px]">
                  🧠
                </span>
              )}
              {localPlays.guess > 0 && (
                <span className="w-5 h-5 rounded bg-plasma-500/20 flex items-center justify-center text-[10px]">
                  🎵
                </span>
              )}
              {!status?.checkin.done_today && localPlays.spin === 0 && localPlays.quiz === 0 && localPlays.guess === 0 && (
                <span className="text-xs text-zinc-600">No plays yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game selector grid */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {GAME_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeGame === tab.id
            const isDone =
              tab.id === 'checkin'
                ? status?.checkin.done_today
                : tab.id === 'spin'
                  ? localPlays.spin >= (status?.spin_wheel.max_plays ?? 1)
                  : tab.id === 'quiz'
                    ? localPlays.quiz >= (status?.daily_quiz.max_plays ?? 2)
                    : localPlays.guess >= (status?.guess_the_track.max_plays ?? 3)

            return (
              <button
                key={tab.id}
                onClick={() => setActiveGame(tab.id)}
                className={cn(
                  'relative flex flex-col items-start gap-2 p-3.5 rounded-2xl border-2',
                  'transition-all duration-200 active:scale-95 text-left',
                  isActive
                    ? cn(tab.bgColor, tab.borderColor.replace('/25', '/50'))
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700',
                )}
              >
                {/* Done badge */}
                {isDone && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-500" />
                  </div>
                )}

                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  isActive ? cn(tab.bgColor, 'border', tab.borderColor) : 'bg-zinc-800',
                )}>
                  <Icon className={cn('w-5 h-5', isActive ? tab.color : 'text-zinc-500')} />
                </div>

                <div>
                  <p className={cn(
                    'text-sm font-bold leading-tight',
                    isActive ? 'text-zinc-100' : 'text-zinc-400',
                  )}>
                    {tab.label}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {isDone ? 'Completed' : tab.maxPts}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active game panel */}
      <div className="px-4 pb-6">
        <div className={cn(
          'rounded-2xl border p-5',
          activeTab.bgColor,
          activeTab.borderColor,
        )}>
          {/* Game header */}
          <div className="flex items-center gap-3 mb-5">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              'bg-zinc-950/50',
            )}>
              <activeTab.icon className={cn('w-5 h-5', activeTab.color)} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-100">{activeTab.label}</h2>
              <p className="text-xs text-zinc-500">{activeTab.description} · Max {activeTab.maxPts}</p>
            </div>
          </div>

          {/* Game content */}
          <div>
            {activeGame === 'checkin' && (
              <DailyCheckin
                doneToday={status?.checkin.done_today ?? false}
                currentStreak={status?.checkin.streak_day ?? 0}
                pointsToday={status?.checkin.points_today ?? 0}
                onCheckin={handleCheckin}
              />
            )}

            {activeGame === 'spin' && (
              <SpinWheel
                canPlay={localPlays.spin < (status?.spin_wheel.max_plays ?? 1)}
                playsToday={localPlays.spin}
                maxPlays={status?.spin_wheel.max_plays ?? 1}
                onWin={handleSpinWin}
              />
            )}

            {activeGame === 'quiz' && (
              <DailyQuiz
                canPlay={localPlays.quiz < (status?.daily_quiz.max_plays ?? 2)}
                playsToday={localPlays.quiz}
                maxPlays={status?.daily_quiz.max_plays ?? 2}
                onWin={handleQuizWin}
              />
            )}

            {activeGame === 'guess' && (
              <GuessTheTrack
                canPlay={localPlays.guess < (status?.guess_the_track.max_plays ?? 3)}
                playsToday={localPlays.guess}
                maxPlays={status?.guess_the_track.max_plays ?? 3}
                onWin={handleGuessWin}
              />
            )}
          </div>
        </div>

        {/* Coming soon teaser */}
        <div className="mt-4 p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                <Star className="w-4 h-4 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">More games coming</p>
                <p className="text-xs text-zinc-600">Coin Flip, Lucky Draw, Rhythm Tap...</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
      </div>

      {/* VP gain toast */}
      {vpToast && (
        <VPToast
          points={vpToast.points}
          isJackpot={vpToast.isJackpot}
          onDone={() => setVpToast(null)}
        />
      )}
    </div>
  )
}
