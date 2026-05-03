// src/components/minigame/GuessTheTrack.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Music, Timer, Zap, CheckCircle2, XCircle, RefreshCw, Lock, Play, Pause } from 'lucide-react'
import { cn, formatVP, extractYouTubeId } from '@/lib/utils'
import { getTrackQuestion, submitTrackGuess } from '@/lib/actions/mini-games'
import type { TrackQuestion } from '@/lib/actions/mini-games'

interface GuessTheTrackProps {
  canPlay: boolean
  playsToday: number
  maxPlays: number
  onWin: (points: number, newBalance: number) => void
}

type Phase = 'idle' | 'loading' | 'playing' | 'answered' | 'error' | 'limit'

const TIMER_SECONDS = 15

export function GuessTheTrack({ canPlay, playsToday, maxPlays, onWin }: GuessTheTrackProps) {
  const [phase, setPhase] = useState<Phase>(canPlay ? 'idle' : 'limit')
  const [question, setQuestion] = useState<TrackQuestion | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [startTime, setStartTime] = useState(0)
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const ytId = question ? extractYouTubeId(question.youtube_url) : null

  const startTimer = useCallback(() => {
    setStartTime(Date.now())
    setTimeLeft(TIMER_SECONDS)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Time's up — auto-submit as wrong
          setPhase('answered')
          setLastResult({ correct: false, points: 0 })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(timerRef.current), [])

  async function loadQuestion() {
    setPhase('loading')
    setSelected(null)
    setLastResult(null)
    setIsAudioPlaying(false)

    const q = await getTrackQuestion()
    if (!q) {
      setPhase('error')
      return
    }
    setQuestion(q)
    setPhase('playing')
    startTimer()
  }

  async function handleAnswer(choice: string) {
    if (phase !== 'playing' || selected) return
    clearInterval(timerRef.current)
    const elapsed = Date.now() - startTime

    setSelected(choice)
    setPhase('answered')

    const isCorrect = choice === question?.correct_title
    const result = await submitTrackGuess({
      releaseId: question!.release_id,
      isCorrect,
      timeMs: elapsed,
    })

    setLastResult({ correct: isCorrect, points: result.points_earned })
    if (result.success && result.points_earned > 0 && result.new_balance !== undefined) {
      onWin(result.points_earned, result.new_balance)
    }
  }

  function nextRound() {
    if (!canPlay || playsToday >= maxPlays) {
      setPhase('limit')
      return
    }
    loadQuestion()
  }

  const timerPct = (timeLeft / TIMER_SECONDS) * 100
  const timerColor = timeLeft > 10 ? '#4ab94a' : timeLeft > 5 ? '#ef9f27' : '#dc2626'

  if (phase === 'limit') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <Lock className="w-8 h-8 text-zinc-500" />
        </div>
        <div className="text-center">
          <p className="font-medium text-zinc-300">Daily limit reached</p>
          <p className="text-sm text-zinc-600 mt-1">
            Used {playsToday}/{maxPlays} plays today. Come back tomorrow!
          </p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: maxPlays }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-vibe-500" />
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Hero icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-plasma-900/60 to-zinc-900 border border-plasma-700/30 flex items-center justify-center">
            <Music className="w-12 h-12 text-plasma-400" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-vibe-500 flex items-center justify-center border-2 border-zinc-950">
            <Timer className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-display font-bold text-xl text-zinc-100">Guess The Track</h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            Listen to the intro and identify the song. You have {TIMER_SECONDS} seconds.
          </p>
        </div>

        <div className="w-full space-y-2">
          {[
            { icon: '🎵', text: 'Hear the first few seconds' },
            { icon: '⏱️', text: `${TIMER_SECONDS}s timer, speed bonus up to +20 VP` },
            { icon: '🎯', text: `${maxPlays} plays per day · 20–40 VP per correct answer` },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="text-base">{icon}</span>
              {text}
            </div>
          ))}
        </div>

        <button onClick={loadQuestion} className="btn-primary w-full">
          <Play className="w-4 h-4" />
          Start Game
        </button>

        <p className="text-xs text-zinc-600">{playsToday}/{maxPlays} plays used today</p>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-12 h-12 rounded-full border-2 border-plasma-500/30 border-t-plasma-400 animate-spin" />
        <p className="text-sm text-zinc-500">Loading track...</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-zinc-400">Not enough tracks available yet.</p>
        <p className="text-sm text-zinc-600">Artists need to publish more music releases!</p>
        <button onClick={() => setPhase('idle')} className="btn-ghost">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Timer bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500">Time remaining</span>
          <span className="font-mono font-bold" style={{ color: timerColor }}>
            {timeLeft}s
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          />
        </div>
      </div>

      {/* YouTube embed (start from 0, autoplay) */}
      {ytId && phase === 'playing' && (
        <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
          </div>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&start=0&controls=0&modestbranding=1&rel=0&mute=0`}
            className="w-full h-40 opacity-30"
            allow="autoplay"
            title="Track preview"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center">
                <Music className="w-7 h-7 text-plasma-400 animate-pulse-slow" />
              </div>
              <p className="text-xs text-zinc-500 font-medium">Listen carefully...</p>
            </div>
          </div>
        </div>
      )}

      {/* Audio bars animation when playing */}
      {phase === 'playing' && (
        <div className="flex items-end justify-center gap-1 h-8">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-plasma-500/60 rounded-full"
              style={{
                height: `${20 + Math.sin(i * 0.8) * 15}px`,
                animation: `eq-bar ${0.6 + i * 0.07}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Question prompt */}
      <p className="text-center text-sm font-medium text-zinc-300">
        Which track is playing?
      </p>

      {/* Answer choices */}
      <div className="grid grid-cols-1 gap-2">
        {question?.choices.map((choice) => {
          const isSelected = selected === choice
          const isCorrect = choice === question.correct_title
          const showResult = phase === 'answered'

          return (
            <button
              key={choice}
              onClick={() => handleAnswer(choice)}
              disabled={phase !== 'playing'}
              className={cn(
                'relative w-full px-4 py-3.5 rounded-xl text-left text-sm font-medium',
                'border transition-all duration-300',
                showResult && isCorrect
                  ? 'bg-vibe-500/15 border-vibe-500/60 text-vibe-300'
                  : showResult && isSelected && !isCorrect
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : isSelected
                      ? 'bg-plasma-500/15 border-plasma-500/50 text-plasma-300'
                      : 'bg-zinc-900/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-600',
                phase !== 'playing' && 'cursor-default',
              )}
            >
              <span className="pr-8">{choice}</span>
              {showResult && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-vibe-400" />
                  ) : isSelected ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : null}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Result */}
      {phase === 'answered' && lastResult && (
        <div className={cn(
          'p-4 rounded-2xl border text-center animate-bounce-in',
          lastResult.correct
            ? 'bg-vibe-500/10 border-vibe-500/30'
            : 'bg-zinc-800/60 border-zinc-700',
        )}>
          {lastResult.correct ? (
            <>
              <p className="font-display font-bold text-vibe-400 text-lg">Correct! 🎵</p>
              <p className="text-sm text-zinc-400 mt-1">
                <span className="text-vibe-400 font-mono font-bold">+{lastResult.points} VP</span> earned
              </p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-zinc-300 text-lg">
                {timeLeft === 0 ? "Time's up!" : 'Wrong answer'}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                Correct: <span className="text-zinc-300">"{question?.correct_title}"</span>
              </p>
            </>
          )}

          <button
            onClick={nextRound}
            className={cn(
              'mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition-all',
              playsToday + 1 < maxPlays
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                : 'bg-zinc-900 text-zinc-500 cursor-not-allowed',
            )}
            disabled={playsToday + 1 >= maxPlays}
          >
            {playsToday + 1 < maxPlays ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Next Track ({maxPlays - playsToday - 1} left)
              </span>
            ) : (
              'No more plays today'
            )}
          </button>
        </div>
      )}

      {/* Plays counter */}
      <div className="flex items-center justify-between text-xs text-zinc-600">
        <span>Plays used today</span>
        <div className="flex gap-1">
          {Array.from({ length: maxPlays }).map((_, i) => (
            <div key={i} className={cn(
              'w-2 h-2 rounded-full',
              i < playsToday || (phase === 'answered' && i === playsToday)
                ? 'bg-plasma-500'
                : 'bg-zinc-700',
            )} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes eq-bar {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
