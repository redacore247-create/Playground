// src/components/market/BetModal.tsx
'use client'

import { useState, useTransition } from 'react'
import { X, Zap, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatVP } from '@/lib/utils'
import { placeBet } from '@/lib/actions/market'
import type { Market, MarketOption } from '@/types/database'

const PRESET_BETS = [10, 25, 50, 100, 250]

interface BetModalProps {
  market: Market
  userBalance: number
  onClose: () => void
  onSuccess: (newBalance: number, optionId: string) => void
}

export function BetModal({ market, userBalance, onClose, onSuccess }: BetModalProps) {
  const [selectedOption, setSelectedOption] = useState<MarketOption | null>(null)
  const [amount, setAmount] = useState(25)
  const [isPending, startTransition] = useTransition()
  const options = market.market_options ?? []
  const totalPool = market.total_pool + amount

  function getOdds(opt: MarketOption): { pct: number; multiplier: string } {
    const newTotal = opt.id === selectedOption?.id
      ? opt.total_points_bet + amount
      : opt.total_points_bet
    const pool = market.total_pool + (selectedOption?.id === opt.id ? amount : 0)
    const pct = pool > 0 ? (newTotal / pool) * 100 : 100 / options.length
    const mult = pct > 0 ? (100 / pct).toFixed(2) : '∞'
    return { pct, multiplier: mult }
  }

  const potentialReturn = selectedOption
    ? Math.floor((amount / (selectedOption.total_points_bet + amount)) * (market.total_pool + amount))
    : 0

  function handleBet() {
    if (!selectedOption || amount < 1 || amount > userBalance) return

    startTransition(async () => {
      const result = await placeBet({
        marketId: market.id,
        optionId: selectedOption.id,
        points: amount,
      })

      if (result.success) {
        toast.success('Prediction placed! 🎯', {
          description: `${formatVP(amount)} on "${selectedOption.label}"`,
        })
        onSuccess(result.new_balance ?? 0, selectedOption.id)
        onClose()
      } else {
        toast.error(result.error ?? 'Failed to place bet')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-700/60 overflow-hidden animate-slide-up"
        style={{ background: 'linear-gradient(160deg, #18181b 0%, #111113 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-plasma-400" />
            <h2 className="font-display font-bold text-lg text-zinc-100">Place Prediction</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question */}
        <div className="px-5 pb-4 border-b border-zinc-800/60">
          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{market.question}</p>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Option selector */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Pick your outcome</p>
            <div className="space-y-2">
              {options.map(opt => {
                const { pct, multiplier } = getOdds(opt)
                const isSelected = selectedOption?.id === opt.id

                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt)}
                    className={cn(
                      'w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200',
                      isSelected
                        ? 'border-plasma-500/60 bg-plasma-500/10'
                        : 'border-zinc-700/60 bg-zinc-900/40 hover:border-zinc-600',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-plasma-300' : 'text-zinc-300',
                      )}>
                        {opt.label}
                      </span>
                      <span className={cn(
                        'text-xs font-mono',
                        isSelected ? 'text-plasma-400' : 'text-zinc-500',
                      )}>
                        {multiplier}×
                      </span>
                    </div>
                    {/* Odds bar */}
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          isSelected ? 'bg-plasma-500' : 'bg-zinc-600',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-zinc-600">{pct.toFixed(1)}% chance</span>
                      <span className="text-[10px] text-zinc-600">{formatVP(opt.total_points_bet)} bet</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Wager amount</p>
              <div className="vp-badge">
                <Zap className="w-3 h-3" />
                {formatVP(userBalance)} available
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-2 mb-3">
              {PRESET_BETS.map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  disabled={p > userBalance}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all',
                    amount === p
                      ? 'bg-plasma-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Custom amount slider */}
            <input
              type="range"
              min={1}
              max={Math.min(userBalance, 500)}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full accent-plasma-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>1 VP</span>
              <span className="font-mono font-bold text-plasma-400">{amount} VP</span>
              <span>{Math.min(userBalance, 500)} VP</span>
            </div>
          </div>

          {/* Potential return preview */}
          {selectedOption && (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Wager</span>
                <span className="font-mono text-zinc-300">{amount} VP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Pool share</span>
                <span className="font-mono text-zinc-300">
                  {((amount / (selectedOption.total_points_bet + amount)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-zinc-800">
                <span className="text-zinc-400">If correct</span>
                <span className={cn(
                  'font-mono font-bold',
                  potentialReturn > amount ? 'text-vibe-400' : 'text-zinc-400',
                )}>
                  ~{formatVP(potentialReturn)}
                </span>
              </div>
            </div>
          )}

          {!selectedOption && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/40 text-sm text-zinc-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Select an outcome above
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleBet}
            disabled={!selectedOption || amount < 1 || amount > userBalance || isPending}
            className="btn-primary w-full"
            style={selectedOption ? { background: 'linear-gradient(135deg, #cc44e8, #a020c8)' } : {}}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing bet...
              </span>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Predict {selectedOption ? `"${selectedOption.label}"` : '—'} · {formatVP(amount)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
