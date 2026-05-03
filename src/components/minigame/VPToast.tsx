// src/components/minigame/VPToast.tsx
'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VPToastProps {
  points: number
  isJackpot?: boolean
  onDone?: () => void
}

export function VPToast({ points, isJackpot, onDone }: VPToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDone?.(), 400)
    }, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={cn(
      'fixed top-20 left-1/2 -translate-x-1/2 z-50',
      'transition-all duration-400',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
    )}>
      <div className={cn(
        'flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl',
        'border font-mono font-bold text-lg',
        isJackpot
          ? 'bg-yellow-950 border-yellow-500/50 text-yellow-400 shadow-yellow-500/20'
          : 'bg-zinc-900 border-vibe-500/40 text-vibe-400 shadow-vibe-500/10',
      )}>
        <Zap className={cn(
          'w-5 h-5',
          isJackpot ? 'text-yellow-400' : 'text-vibe-400',
        )} />
        +{points} VP
        {isJackpot && <span className="ml-1">🎰</span>}
      </div>
    </div>
  )
}

// Mini floating particles burst
export function VPBurst({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-vibe-400"
          style={{
            animation: `particle-burst 0.8s ease-out ${i * 0.06}s forwards`,
            transform: `rotate(${i * 60}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes particle-burst {
          0% { transform: rotate(${0}deg) translateX(0); opacity: 1; }
          100% { transform: rotate(var(--r, 0deg)) translateX(40px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
