// src/components/minigame/SpinWheel.tsx
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Zap, RotateCw, Trophy, Lock } from 'lucide-react'
import { cn, formatVP } from '@/lib/utils'
import { spinWheel, SPIN_SEGMENTS } from '@/lib/actions/mini-games'
import type { SpinResult } from '@/lib/actions/mini-games'

// Segment colors — alternating palette
const SEG_COLORS = [
  ['#1a2e1a', '#4ab94a'],   // vibe dark/light
  ['#1e1535', '#cc44e8'],   // plasma dark/light
  ['#2a1f0a', '#ef9f27'],   // amber dark/light
  ['#1a2535', '#378add'],   // blue dark/light
  ['#2a0a1a', '#d4537e'],   // pink dark/light
  ['#0a2a2a', '#1d9e75'],   // teal dark/light
  ['#1f1f1f', '#888780'],   // gray dark/light
  ['#2a1a00', '#FFE566'],   // gold dark/light
]

interface SpinWheelProps {
  canPlay: boolean
  playsToday: number
  maxPlays: number
  onWin: (result: SpinResult, newBalance: number) => void
}

const TOTAL_SEGMENTS = SPIN_SEGMENTS.length
const PI2 = Math.PI * 2

export function SpinWheel({ canPlay, playsToday, maxPlays, onWin }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [currentAngle, setCurrentAngle] = useState(0)
  const animRef = useRef<number>()
  const angleRef = useRef(0)

  // Draw wheel on canvas
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 8

    ctx.clearRect(0, 0, size, size)

    SPIN_SEGMENTS.forEach((seg, i) => {
      const startAngle = angle + (PI2 / TOTAL_SEGMENTS) * i
      const endAngle = startAngle + PI2 / TOTAL_SEGMENTS
      const [darkColor, lightColor] = SEG_COLORS[i % SEG_COLORS.length]

      // Segment fill
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = i % 2 === 0 ? darkColor : darkColor
      ctx.fill()
      ctx.strokeStyle = '#0a0a0a'
      ctx.lineWidth = 2
      ctx.stroke()

      // Segment gradient overlay
      const midAngle = startAngle + PI2 / TOTAL_SEGMENTS / 2
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStop(0, 'rgba(255,255,255,0.05)')
      grad.addColorStop(1, 'rgba(0,0,0,0.2)')
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)
      ctx.textAlign = 'right'
      ctx.fillStyle = lightColor
      ctx.font = `bold ${size < 280 ? 10 : 12}px "Space Grotesk", sans-serif`
      ctx.fillText(seg.label, radius - 12, 4)
      ctx.restore()
    })

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, PI2)
    ctx.fillStyle = '#0a0a0a'
    ctx.fill()
    ctx.strokeStyle = '#3f3f46'
    ctx.lineWidth = 2
    ctx.stroke()

    // Center icon (Zap)
    ctx.fillStyle = '#4ab94a'
    ctx.font = `bold ${size < 280 ? 14 : 18}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚡', cx, cy)

    // Outer ring
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, PI2)
    ctx.strokeStyle = '#27272a'
    ctx.lineWidth = 4
    ctx.stroke()
  }, [])

  useEffect(() => {
    drawWheel(0)
  }, [drawWheel])

  const handleSpin = async () => {
    if (spinning || !canPlay) return
    setSpinning(true)
    setResult(null)

    // Call server action first to get the server-determined result
    const res = await spinWheel()

    if (!res.success) {
      setSpinning(false)
      return
    }

    const targetSegment = res.result!.segment_index
    // Calculate target angle so pointer (top, -PI/2) lands on that segment
    const segAngle = PI2 / TOTAL_SEGMENTS
    const targetAngle = -(segAngle * targetSegment + segAngle / 2) - Math.PI / 2

    // Spin: 5+ full rotations + target
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * PI2
    const endAngle = fullSpins + targetAngle - angleRef.current

    const duration = 4000
    const start = performance.now()
    const startAngle = angleRef.current

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const angle = startAngle + endAngle * eased

      angleRef.current = angle
      drawWheel(angle)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setResult(res.result!)
        onWin(res.result!, res.new_balance ?? 0)
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0" style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '20px solid #4ab94a',
            filter: 'drop-shadow(0 0 8px rgba(74,185,74,0.8))',
          }} />
        </div>

        {/* Glow ring */}
        <div className={cn(
          'absolute inset-0 rounded-full transition-all duration-500',
          spinning
            ? 'shadow-[0_0_40px_rgba(74,185,74,0.4),0_0_80px_rgba(74,185,74,0.2)]'
            : result?.is_jackpot
              ? 'shadow-[0_0_40px_rgba(255,229,102,0.6),0_0_80px_rgba(255,229,102,0.3)]'
              : 'shadow-[0_0_20px_rgba(74,185,74,0.1)]',
        )} />

        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className={cn(
            'rounded-full transition-opacity duration-300',
            !canPlay && 'opacity-40 grayscale',
          )}
        />
      </div>

      {/* Result banner */}
      {result && !spinning && (
        <div className={cn(
          'w-full p-4 rounded-2xl border text-center animate-bounce-in',
          result.is_jackpot
            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            : result.points === 0
              ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
              : 'bg-vibe-500/10 border-vibe-500/30 text-vibe-400',
        )}>
          {result.is_jackpot && (
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5" />
              <span className="font-display font-bold text-lg">JACKPOT!</span>
              <Trophy className="w-5 h-5" />
            </div>
          )}
          <p className="font-mono font-bold text-2xl">
            {result.points > 0 ? `+${result.points} VP` : result.label}
          </p>
          {result.points > 0 && !result.is_jackpot && (
            <p className="text-xs mt-1 opacity-70">Vibe Points earned!</p>
          )}
        </div>
      )}

      {/* Spin button */}
      {!canPlay ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-500">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Come back tomorrow</span>
          </div>
          <p className="text-xs text-zinc-600">Used {playsToday}/{maxPlays} spins today</p>
        </div>
      ) : (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className={cn(
            'btn-primary w-full max-w-xs text-base',
            spinning && 'opacity-70 cursor-wait',
          )}
        >
          {spinning ? (
            <>
              <RotateCw className="w-5 h-5 animate-spin" />
              Spinning...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Spin!
            </>
          )}
        </button>
      )}

      {/* Usage indicator */}
      <div className="flex gap-1.5">
        {Array.from({ length: maxPlays }).map((_, i) => (
          <div key={i} className={cn(
            'w-2 h-2 rounded-full transition-colors',
            i < playsToday ? 'bg-vibe-500' : 'bg-zinc-700',
          )} />
        ))}
      </div>
    </div>
  )
}
