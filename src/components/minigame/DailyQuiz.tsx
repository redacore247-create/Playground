// src/components/minigame/DailyQuiz.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Brain, CheckCircle2, XCircle, Trophy, RotateCcw, Lock, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getQuizQuestions, submitQuizResult } from '@/lib/actions/mini-games'
import type { QuizQuestion } from '@/lib/actions/mini-games'

interface DailyQuizProps {
  canPlay: boolean
  playsToday: number
  maxPlays: number
  onWin: (points: number, newBalance: number) => void
}

type Phase = 'idle' | 'loading' | 'question' | 'answered' | 'complete' | 'limit'

const QUESTION_TIME = 20
const TOTAL_QUESTIONS = 5

export function DailyQuiz({ canPlay, playsToday, maxPlays, onWin }: DailyQuizProps) {
  const [phase, setPhase] = useState<Phase>(canPlay ? 'idle' : 'limit')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [totalMs, setTotalMs] = useState(0)
  const [sessionStart, setSessionStart] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const current = questions[qIndex]

  const stopTimer = useCallback(() => clearInterval(timerRef.current), [])

  const startQuestionTimer = useCallback(() => {
    setTimeLeft(QUESTION_TIME)
    setStartTime(Date.now())
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setPhase('answered')
          setSelected(-1) // -1 = timed out
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

  async function startQuiz() {
    setPhase('loading')
    setScore(0)
    setQIndex(0)
    setSelected(null)
    setSubmitted(false)
    setSessionStart(Date.now())

    const qs = await getQuizQuestions(TOTAL_QUESTIONS)
    setQuestions(qs)
    setPhase('question')
    startQuestionTimer()
  }

  function handleAnswer(choiceIndex: number) {
    if (phase !== 'question' || selected !== null) return
    stopTimer()
    const elapsed = Date.now() - startTime
    setTotalMs(prev => prev + elapsed)
    setSelected(choiceIndex)
    setPhase('answered')

    if (choiceIndex === current.correct_index) {
      setScore(prev => prev + 1)
    }
  }

  async function nextQuestion() {
    const next = qIndex + 1
    if (next >= TOTAL_QUESTIONS) {
      // Final — submit result
      setPhase('complete')
      if (!submitted) {
        setSubmitted(true)
        const finalScore = score + (selected === current.correct_index ? 1 : 0)
        const res = await submitQuizResult({
          correct: finalScore,
          total: TOTAL_QUESTIONS,
          timeMs: totalMs,
        })
        if (res.success && res.points_earned > 0 && res.new_balance !== undefined) {
          onWin(res.points_earned, res.new_balance)
        }
      }
    } else {
      setQIndex(next)
      setSelected(null)
      setPhase('question')
      startQuestionTimer()
    }
  }

  const timerPct = (timeLeft / QUESTION_TIME) * 100
  const timerColor = timeLeft > 12 ? '#4ab94a' : timeLeft > 7 ? '#ef9f27' : '#dc2626'

  // ── Idle ───────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-900/60 to-zinc-900 border border-blue-700/30 flex items-center justify-center">
            <Brain className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-plasma-500 flex items-center justify-center border-2 border-zinc-950">
            <span className="text-xs font-bold text-white">{TOTAL_QUESTIONS}</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-display font-bold text-xl text-zinc-100">Vibe Quiz</h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            {TOTAL_QUESTIONS} questions on music, art, and culture. {QUESTION_TIME}s per question.
          </p>
        </div>

        <div className="w-full space-y-2">
          {[
            { icon: '🧠', text: `${TOTAL_QUESTIONS} questions, ${QUESTION_TIME}s each` },
            { icon: '✅', text: '5 VP per correct answer' },
            { icon: '🏆', text: '+5 bonus VP for perfect score (5/5)' },
            { icon: '🔄', text: `${maxPlays} quiz sessions per day` },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-zinc-400">
              <span>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        <button onClick={startQuiz} className="btn-primary w-full">
          <Brain className="w-4 h-4" />
          Start Quiz
        </button>

        <p className="text-xs text-zinc-600">{playsToday}/{maxPlays} sessions used today</p>
      </div>
    )
  }

  // ── Limit ──────────────────────────────────────────────────────────────────
  if (phase === 'limit') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Lock className="w-12 h-12 text-zinc-600" />
        <div className="text-center">
          <p className="font-medium text-zinc-300">Quiz limit reached</p>
          <p className="text-sm text-zinc-600 mt-1">{playsToday}/{maxPlays} sessions today</p>
        </div>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
        <p className="text-sm text-zinc-500">Preparing questions...</p>
      </div>
    )
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const finalScore = score
    const pts = finalScore * 5 + (finalScore === TOTAL_QUESTIONS ? 5 : 0)
    const isPerfect = finalScore === TOTAL_QUESTIONS

    return (
      <div className="flex flex-col items-center gap-6 py-4 animate-slide-up">
        <div className={cn(
          'w-24 h-24 rounded-3xl flex items-center justify-center',
          isPerfect
            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30'
            : finalScore >= 3
              ? 'bg-vibe-500/10 border border-vibe-500/20'
              : 'bg-zinc-800 border border-zinc-700',
        )}>
          {isPerfect ? (
            <Trophy className="w-12 h-12 text-yellow-400" />
          ) : (
            <Brain className="w-12 h-12 text-blue-400" />
          )}
        </div>

        <div className="text-center">
          <p className="text-zinc-500 text-sm mb-1">Quiz Complete!</p>
          <div className="flex items-baseline gap-2 justify-center">
            <span className="font-display font-bold text-5xl text-zinc-100">{finalScore}</span>
            <span className="text-zinc-500 text-xl">/ {TOTAL_QUESTIONS}</span>
          </div>
          {isPerfect && (
            <p className="text-yellow-400 font-medium mt-1">Perfect score! 🎉</p>
          )}
        </div>

        {/* Score breakdown */}
        <div className="w-full flex gap-2">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div key={i} className={cn(
              'flex-1 h-2 rounded-full',
              i < finalScore ? 'bg-vibe-500' : 'bg-zinc-700',
            )} />
          ))}
        </div>

        {/* Points earned */}
        <div className={cn(
          'w-full p-4 rounded-2xl border text-center',
          pts > 0
            ? 'bg-vibe-500/10 border-vibe-500/30'
            : 'bg-zinc-800/60 border-zinc-700',
        )}>
          {pts > 0 ? (
            <>
              <div className="vp-badge mx-auto w-fit mb-1">
                <Zap className="w-3 h-3" />
                +{pts} VP
              </div>
              <p className="text-xs text-zinc-500">
                {finalScore} × 5 VP{isPerfect ? ' + 5 perfect bonus' : ''}
              </p>
            </>
          ) : (
            <p className="text-zinc-500 text-sm">No points this time. Practice makes perfect!</p>
          )}
        </div>

        {playsToday + 1 < maxPlays ? (
          <button onClick={startQuiz} className="btn-primary w-full">
            <RotateCcw className="w-4 h-4" />
            Play Again ({maxPlays - playsToday - 1} left)
          </button>
        ) : (
          <div className="w-full p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center text-sm text-zinc-500">
            <Lock className="w-4 h-4 inline mr-1.5" />
            Come back tomorrow for more questions!
          </div>
        )}
      </div>
    )
  }

  // ── Question / Answered ────────────────────────────────────────────────────
  if (!current) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5 flex-1">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div key={i} className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i < qIndex ? 'bg-vibe-500' :
              i === qIndex ? 'bg-zinc-400' :
              'bg-zinc-700',
            )} />
          ))}
        </div>
        <span className="text-xs text-zinc-500 tabular-nums flex-shrink-0">
          {qIndex + 1}/{TOTAL_QUESTIONS}
        </span>
      </div>

      {/* Timer */}
      {phase === 'question' && (
        <div className="space-y-1">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
            />
          </div>
          <div className="text-right">
            <span className="font-mono text-xs font-bold" style={{ color: timerColor }}>
              {timeLeft}s
            </span>
          </div>
        </div>
      )}

      {/* Category badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit">
        <Brain className="w-3 h-3 text-blue-400" />
        <span className="text-xs text-blue-400 font-medium">{current.category}</span>
      </div>

      {/* Question */}
      <h3 className="font-display font-bold text-xl text-zinc-100 leading-snug">
        {current.question}
      </h3>

      {/* Choices */}
      <div className="grid grid-cols-1 gap-2.5">
        {current.choices.map((choice, i) => {
          const isSelected = selected === i
          const isCorrect = i === current.correct_index
          const showResult = phase === 'answered'
          const isTimeout = selected === -1

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={phase !== 'question'}
              className={cn(
                'relative w-full px-4 py-4 rounded-xl text-left text-sm font-medium',
                'border transition-all duration-300 active:scale-[0.98]',
                showResult && isCorrect
                  ? 'bg-vibe-500/15 border-vibe-500/50 text-vibe-300'
                  : showResult && isSelected && !isCorrect
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-zinc-900/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-600',
                phase !== 'question' && !showResult && 'opacity-50',
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0',
                  showResult && isCorrect
                    ? 'bg-vibe-500/30 border-vibe-500/50 text-vibe-300'
                    : showResult && isSelected && !isCorrect
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : 'border-zinc-700 text-zinc-500',
                )}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="flex-1">{choice}</span>
                {showResult && (
                  <span className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-vibe-400" />
                    ) : isSelected ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : null}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Answer feedback + next button */}
      {phase === 'answered' && (
        <div className={cn(
          'p-3 rounded-xl border flex items-center justify-between animate-slide-up',
          selected === current.correct_index
            ? 'bg-vibe-500/10 border-vibe-500/30'
            : 'bg-red-500/10 border-red-500/20',
        )}>
          <div className="flex items-center gap-2">
            {selected === current.correct_index ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-vibe-400" />
                <span className="text-sm font-medium text-vibe-400">Correct! +5 VP</span>
              </>
            ) : selected === -1 ? (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">Time's up!</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">Wrong answer</span>
              </>
            )}
          </div>
          <button
            onClick={nextQuestion}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            {qIndex + 1 >= TOTAL_QUESTIONS ? 'See results' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
