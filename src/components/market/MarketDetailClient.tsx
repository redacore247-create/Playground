// src/components/market/MarketDetailClient.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Clock, Zap, Users, CheckCircle2, ArrowLeft, Share2 } from 'lucide-react'
import { cn, formatVP, formatRelativeTime, formatDate } from '@/lib/utils'
import { BetModal } from './BetModal'
import type { Market, Profile, MarketOption } from '@/types/database'

interface MarketDetailClientProps {
  market: Market
  profile: Profile | null
}

export function MarketDetailClient({ market, profile }: MarketDetailClientProps) {
  const [showBetModal, setShowBetModal] = useState(false)
  const [balance, setBalance] = useState(profile?.vibe_points ?? 0)
  const [userBet, setUserBet] = useState(market.user_prediction)
  const [localPool, setLocalPool] = useState(market.total_pool)
  const [localOptions, setLocalOptions] = useState(market.market_options ?? [])

  const isOpen = market.status === 'open'
  const isResolved = market.status === 'resolved'
  const canBet = isOpen && profile && !userBet
  const hasEnded = new Date(market.closes_at) < new Date()

  function handleBetSuccess(newBalance: number, optionId: string) {
    setBalance(newBalance)
    const wagered = balance - newBalance
    setLocalPool(prev => prev + wagered)
    setLocalOptions(prev =>
      prev.map(o => o.id === optionId
        ? { ...o, total_points_bet: o.total_points_bet + wagered }
        : o
      )
    )
  }

  const totalPool = localPool
  const options = localOptions

  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky header */}
      <header className="sticky top-0 z-40">
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60" />
        <div className="relative flex items-center gap-3 px-4 h-14">
          <Link href="/markets" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-display font-bold text-sm text-zinc-100 flex-1 truncate">
            Prediction Market
          </span>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border',
            isOpen && !hasEnded
              ? 'bg-vibe-500/10 text-vibe-400 border-vibe-500/20'
              : isResolved
                ? 'bg-plasma-500/10 text-plasma-400 border-plasma-500/20'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700',
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isOpen && !hasEnded ? 'bg-vibe-400 animate-pulse' : 'bg-zinc-500',
            )} />
            {isOpen && !hasEnded ? 'Betting open' : isResolved ? 'Resolved' : 'Betting closed'}
          </span>

          {market.releases && (
            <Link
              href={`/releases/${market.releases.id}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 truncate"
            >
              Re: {market.releases.title}
            </Link>
          )}
        </div>

        {/* Question */}
        <h1 className="font-display font-bold text-2xl text-zinc-100 leading-tight">
          {market.question}
        </h1>

        {market.description && (
          <p className="text-sm text-zinc-400 leading-relaxed">{market.description}</p>
        )}

        {/* Pool stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Pool', value: formatVP(totalPool), icon: Zap, color: 'text-vibe-400' },
            { label: 'Options', value: options.length, icon: TrendingUp, color: 'text-plasma-400' },
            {
              label: isResolved ? 'Resolved' : 'Closes',
              value: isResolved
                ? formatDate(market.resolved_at!)
                : formatRelativeTime(market.closes_at),
              icon: Clock,
              color: 'text-zinc-400',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <Icon className={cn('w-4 h-4 mb-1.5', color)} />
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={cn('text-sm font-bold font-mono mt-0.5', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* User's bet indicator */}
        {userBet && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-300">Your prediction</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                <span className="text-zinc-200">
                  {options.find(o => o.id === userBet.option_id)?.label}
                </span>
                {' · '}
                <span className="font-mono text-vibe-400">{formatVP(userBet.points_wagered)}</span>
                {userBet.points_returned !== null && (
                  <span className={cn(
                    'ml-2 font-mono',
                    userBet.points_returned > 0 ? 'text-vibe-400' : 'text-red-400',
                  )}>
                    {userBet.points_returned > 0
                      ? `+${formatVP(userBet.points_returned)} won`
                      : 'Lost'}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Options with odds */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Outcomes</h2>
          {options.map((opt) => {
            const pct = totalPool > 0 ? (opt.total_points_bet / totalPool) * 100 : 100 / options.length
            const isWinner = isResolved && opt.is_winner
            const isUserChoice = userBet?.option_id === opt.id
            const multiplier = pct > 0 ? (100 / pct).toFixed(2) : '∞'

            return (
              <div
                key={opt.id}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  isWinner
                    ? 'bg-vibe-500/10 border-vibe-500/30'
                    : isUserChoice
                      ? 'bg-blue-500/8 border-blue-500/25'
                      : 'bg-zinc-900/50 border-zinc-800',
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isWinner && <CheckCircle2 className="w-4 h-4 text-vibe-400" />}
                    {isUserChoice && !isWinner && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    <span className={cn(
                      'font-medium text-sm',
                      isWinner ? 'text-vibe-300' : isUserChoice ? 'text-blue-300' : 'text-zinc-200',
                    )}>
                      {opt.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'text-sm font-mono font-bold',
                      isWinner ? 'text-vibe-400' : 'text-zinc-400',
                    )}>
                      {multiplier}×
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      isWinner ? 'bg-vibe-500' : isUserChoice ? 'bg-blue-500' : 'bg-zinc-600',
                    )}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{pct.toFixed(1)}% probability</span>
                  <span>{formatVP(opt.total_points_bet)} wagered</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Creator info */}
        {market.profiles && (
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>Market by</span>
            <Link href={`/profile/${market.profiles.username}`} className="text-zinc-400 hover:text-zinc-200">
              @{market.profiles.username}
            </Link>
            <span>·</span>
            <span>{formatRelativeTime(market.created_at)}</span>
          </div>
        )}
      </div>

      {/* Sticky bet CTA */}
      {canBet && !hasEnded && (
        <div className="sticky bottom-20 px-4 pb-4">
          <button
            onClick={() => setShowBetModal(true)}
            className="w-full py-4 rounded-2xl font-display font-bold text-base text-white transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #cc44e8 0%, #9933cc 100%)',
              boxShadow: '0 8px 32px rgba(204,68,232,0.3)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Place Prediction · {formatVP(balance)} available
            </span>
          </button>
        </div>
      )}

      {!profile && (
        <div className="sticky bottom-20 px-4 pb-4">
          <Link href="/login" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
            Sign in to predict
          </Link>
        </div>
      )}

      {showBetModal && profile && (
        <BetModal
          market={{ ...market, total_pool: localPool, market_options: localOptions }}
          userBalance={balance}
          onClose={() => setShowBetModal(false)}
          onSuccess={(newBalance, optionId) => {
            handleBetSuccess(newBalance, optionId)
            setUserBet({ id: '', user_id: profile.id, market_id: market.id, option_id: optionId, points_wagered: balance - newBalance, points_returned: null, created_at: new Date().toISOString() })
          }}
        />
      )}
    </div>
  )
}
