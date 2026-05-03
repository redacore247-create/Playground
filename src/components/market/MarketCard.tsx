// src/components/market/MarketCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, Clock, Users, Zap, CheckCircle2 } from 'lucide-react'
import { cn, formatVP, formatRelativeTime, calculateOdds } from '@/lib/utils'
import type { Market } from '@/types/database'

interface MarketCardProps {
  market: Market
  currentUserId?: string
}

export function MarketCard({ market, currentUserId }: MarketCardProps) {
  const options = market.market_options ?? []
  const totalPool = market.total_pool
  const isOpen = market.status === 'open'
  const isResolved = market.status === 'resolved'
  const userBet = market.user_prediction

  // Top 2 options by bet volume
  const topOptions = [...options].sort((a, b) => b.total_points_bet - a.total_points_bet).slice(0, 3)

  return (
    <Link href={`/markets/${market.id}`}>
      <article className={cn(
        'card-dark p-4 hover:border-zinc-700/60 transition-all duration-300',
        'active:scale-[0.99]',
        isResolved && 'opacity-80',
      )}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Release cover thumbnail */}
          {market.releases?.cover_image_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
              <Image
                src={market.releases.cover_image_url}
                alt={market.releases.title ?? ''}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-plasma-500/10 border border-plasma-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-plasma-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full',
                isOpen
                  ? 'bg-vibe-500/10 text-vibe-400 border border-vibe-500/20'
                  : isResolved
                    ? 'bg-plasma-500/10 text-plasma-400 border border-plasma-500/20'
                    : 'bg-zinc-800 text-zinc-500',
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isOpen ? 'bg-vibe-400 animate-pulse' : isResolved ? 'bg-plasma-400' : 'bg-zinc-500',
                )} />
                {isOpen ? 'Live' : isResolved ? 'Resolved' : 'Closed'}
              </span>

              {userBet && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Voted
                </span>
              )}
            </div>

            <h3 className="font-display font-bold text-sm text-zinc-100 leading-snug line-clamp-2">
              {market.question}
            </h3>
          </div>
        </div>

        {/* Options bars */}
        <div className="space-y-2 mb-3">
          {topOptions.map(opt => {
            const pct = totalPool > 0 ? (opt.total_points_bet / totalPool) * 100 : 0
            const isWinner = isResolved && opt.is_winner
            const userChose = userBet?.option_id === opt.id

            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    'font-medium truncate max-w-[65%]',
                    isWinner ? 'text-vibe-400' : userChose ? 'text-blue-400' : 'text-zinc-400',
                  )}>
                    {isWinner && '✓ '}{opt.label}
                  </span>
                  <span className={cn(
                    'font-mono tabular-nums',
                    isWinner ? 'text-vibe-400' : 'text-zinc-500',
                  )}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isWinner
                        ? 'bg-vibe-500'
                        : userChose
                          ? 'bg-blue-500'
                          : 'bg-zinc-600',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer stats */}
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/60 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-vibe-400" />
            <span className="text-vibe-400 font-mono">{formatVP(totalPool)}</span>
            <span>pool</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isOpen
              ? `Closes ${formatRelativeTime(market.closes_at)}`
              : `Resolved ${formatRelativeTime(market.resolved_at ?? market.closes_at)}`
            }
          </div>
          <div className="ml-auto flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-plasma-400" />
            <span>Predict</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
