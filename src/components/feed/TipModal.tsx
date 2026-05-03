// src/components/feed/TipModal.tsx
'use client'

import { useState, useTransition } from 'react'
import { Zap, X, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatVP } from '@/lib/utils'
import { sendTip } from '@/lib/actions/vibe-points'

const PRESET_AMOUNTS = [10, 25, 50, 100, 250]

interface TipModalProps {
  releaseId: string
  releaseTitle: string
  userBalance: number
  onClose: () => void
  onSuccess?: (newBalance: number) => void
}

export function TipModal({ releaseId, releaseTitle, userBalance, onClose, onSuccess }: TipModalProps) {
  const [amount, setAmount] = useState(25)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const canAfford = amount <= userBalance
  const tooLow = amount < 1

  function adjust(delta: number) {
    setAmount(prev => Math.max(1, Math.min(userBalance, prev + delta)))
  }

  function handleTip() {
    if (!canAfford || tooLow || isPending) return

    startTransition(async () => {
      const result = await sendTip({ releaseId, points: amount, message: message || undefined })
      if (result.success) {
        toast.success(`Tipped ${formatVP(amount)}! 🎉`, {
          description: `New balance: ${formatVP(result.new_balance ?? 0)}`,
        })
        onSuccess?.(result.new_balance ?? 0)
        onClose()
      } else {
        toast.error(result.error ?? 'Tip failed')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-sm card-dark p-6 animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-vibe-400" />
            <h2 className="font-display font-bold text-xl text-zinc-100">Send a Tip</h2>
          </div>
          <p className="text-sm text-zinc-500 truncate">to "{releaseTitle}"</p>
        </div>

        {/* Balance */}
        <div className="flex justify-between items-center mb-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-sm text-zinc-500">Your balance</span>
          <div className="vp-badge">
            <Zap className="w-3 h-3" />
            {formatVP(userBalance)}
          </div>
        </div>

        {/* Amount selector */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-3">Amount</label>

          {/* Preset chips */}
          <div className="flex gap-2 flex-wrap mb-3">
            {PRESET_AMOUNTS.map(preset => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                disabled={preset > userBalance}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-mono transition-all',
                  amount === preset
                    ? 'bg-vibe-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed',
                )}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom amount stepper */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjust(-10)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 active:scale-90 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <span className={cn(
                'font-mono text-3xl font-bold',
                canAfford ? 'text-vibe-400' : 'text-red-400',
              )}>
                {amount}
              </span>
              <span className="text-zinc-500 text-sm ml-1">VP</span>
            </div>
            <button
              onClick={() => adjust(10)}
              disabled={amount >= userBalance}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 active:scale-90 transition-all disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional message */}
        <div className="mb-6">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add a message... (optional)"
            maxLength={120}
            rows={2}
            className="w-full input-glass resize-none text-sm"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleTip}
          disabled={!canAfford || tooLow || isPending}
          className="btn-primary w-full"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Tip {formatVP(amount)}
            </>
          )}
        </button>

        {!canAfford && (
          <p className="text-center text-xs text-red-400 mt-2">
            Not enough Vibe Points
          </p>
        )}
      </div>
    </div>
  )
}
