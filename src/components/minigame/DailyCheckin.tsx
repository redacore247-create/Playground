// src/components/minigame/DailyCheckin.tsx
'use client'

import { useState, useTransition } from 'react'
import { Flame, CheckCircle2, Zap, Star, Lock } from 'lucide-react'
import { cn, formatVP } from '@/lib/utils'
import { doCheckin } from '@/lib/actions/mini-games'

interface DailyCheckinProps {
  doneToday: boolean
  currentStreak: number
  pointsToday: number
  onCheckin: (points: number, streak: number, newBalance: number) => void
}

// Point schedule per streak day
const STREAK_REWARDS = [10, 15, 20, 25, 30, 40, 60]

function getStreakReward(day: number): number {
  return STREAK_REWARDS[Math.min(day - 1, STREAK_REWARDS.length - 1)]
}

function getNextReward(streak: number): number {
  return getStreakReward(streak + 1)
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function DailyCheckin({ doneToday, currentStreak, pointsToday, onCheckin }: DailyCheckinProps) {
  const [checked, setChecked] = useState(doneToday)
  const [streak, setStreak] = useState(currentStreak)
  const [earned, setEarned] = useState(pointsToday)
  const [isPending, startTransition] = useTransition()
  const [showReward, setShowReward] = useState(false)

  const todayDow = new Date().getDay() // 0=Sun
  const nextPoints = getStreakReward(streak + (checked ? 0 : 1))

  function handleCheckin() {
    if (checked || isPending) return
    startTransition(async () => {
      const res = await doCheckin()
      if (res.success && !res.already_checked_in) {
        setChecked(true)
        setStreak(res.streak_day ?? streak + 1)
        setEarned(res.points_earned ?? 0)
        setShowReward(true)
        onCheckin(res.points_earned ?? 0, res.streak_day ?? streak + 1, res.new_balance ?? 0)
        setTimeout(() => setShowReward(false), 3000)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Streak display */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-orange-950/40 to-zinc-900 border border-orange-900/30">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            'bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20',
          )}>
            <Flame className={cn(
              'w-8 h-8 transition-all duration-500',
              streak > 0 ? 'text-orange-400' : 'text-zinc-600',
              streak >= 7 && 'drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]',
            )} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Current Streak</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-3xl text-zinc-100">{streak}</span>
              <span className="text-sm text-zinc-400">days</span>
            </div>
          </div>
        </div>

        {/* Milestone badges */}
        <div className="flex flex-col items-end gap-1">
          {[3, 7, 14, 30].map(milestone => (
            <div key={milestone} className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              streak >= milestone
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                : 'bg-zinc-800/50 text-zinc-600',
            )}>
              <Star className="w-2.5 h-2.5" />
              {milestone}d
            </div>
          ))}
        </div>
      </div>

      {/* Week calendar */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">This week</p>
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map((day, i) => {
            // Map Mon-Sun to 0-6, today is highlighted
            const dayIndex = (i + 1) % 7 // Mon=1 ... Sun=0
            const isToday = dayIndex === todayDow
            // Simulate filled days based on streak (rough)
            const daysPast = (todayDow === 0 ? 6 : todayDow - 1) // days elapsed this week (Mon=0)
            const weekdayIndex = i // 0=Mon
            const isFilled = weekdayIndex < daysPast || (weekdayIndex === daysPast && checked)
            const isFuture = weekdayIndex > daysPast

            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-zinc-600">{day}</span>
                <div className={cn(
                  'w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300',
                  isToday && checked
                    ? 'bg-vibe-500 shadow-[0_0_12px_rgba(74,185,74,0.4)]'
                    : isToday
                      ? 'bg-zinc-800 border-2 border-vibe-500/50 border-dashed'
                      : isFilled
                        ? 'bg-orange-500/20 border border-orange-500/20'
                        : 'bg-zinc-900 border border-zinc-800',
                )}>
                  {isFilled || (isToday && checked) ? (
                    <Flame className={cn(
                      'w-3.5 h-3.5',
                      (isToday && checked) ? 'text-white' : 'text-orange-400',
                    )} />
                  ) : isToday ? (
                    <span className="text-[10px] text-vibe-400 font-bold">→</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reward schedule */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Streak rewards</p>
        <div className="grid grid-cols-7 gap-1">
          {STREAK_REWARDS.map((pts, i) => {
            const day = i + 1
            const isPast = streak > day
            const isToday = streak === day || (day === 1 && streak === 0 && !checked)
            const isNext = streak + 1 === day && !checked
            return (
              <div key={day} className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
                isPast
                  ? 'bg-vibe-500/10 border-vibe-500/20'
                  : isToday && checked
                    ? 'bg-vibe-500/20 border-vibe-500/40'
                    : isNext
                      ? 'bg-zinc-800 border-vibe-500/30 border-dashed'
                      : 'bg-zinc-900/50 border-zinc-800',
              )}>
                <span className="text-[9px] text-zinc-600">Day {day}</span>
                <span className={cn(
                  'font-mono text-[10px] font-bold',
                  isPast || (isToday && checked) ? 'text-vibe-400' : isNext ? 'text-zinc-300' : 'text-zinc-600',
                )}>
                  {pts}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Check-in button */}
      {checked ? (
        <div className="relative overflow-hidden w-full p-4 rounded-2xl bg-vibe-500/10 border border-vibe-500/30 flex items-center justify-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-vibe-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-vibe-400">Checked in today!</p>
            <p className="text-xs text-zinc-500">
              Earned <span className="text-vibe-400 font-mono">+{earned} VP</span> · Streak: {streak} days
            </p>
          </div>

          {/* Reward burst animation */}
          {showReward && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-vibe-400"
                  style={{
                    animation: `burst-${i} 0.8s ease-out forwards`,
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleCheckin}
          disabled={isPending}
          className="relative overflow-hidden w-full py-4 rounded-2xl font-display font-bold text-lg text-white transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
            boxShadow: '0 0 30px rgba(249,115,22,0.25)',
          }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Checking in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <Flame className="w-6 h-6" />
              Check In · Earn {nextPoints} VP
              {streak >= 6 && <span className="text-yellow-300">🔥</span>}
            </span>
          )}
        </button>
      )}

      {!checked && (
        <p className="text-center text-xs text-zinc-600">
          Tomorrow: <span className="text-zinc-400">{getStreakReward(streak + 2)} VP</span>
          {streak >= 6 && ' · Max streak reached!'}
        </p>
      )}
    </div>
  )
}
