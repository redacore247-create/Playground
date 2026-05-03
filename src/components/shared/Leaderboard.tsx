// src/components/shared/Leaderboard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Zap, Trophy, Medal, Crown } from 'lucide-react'
import { cn, formatVP } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/actions/market'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  title?: string
  className?: string
}

const RANK_CONFIG = [
  { icon: Crown,  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', size: 'w-6 h-6' },
  { icon: Medal,  color: 'text-zinc-400',   bg: 'bg-zinc-500/10 border-zinc-500/20',    size: 'w-5 h-5' },
  { icon: Medal,  color: 'text-amber-600',  bg: 'bg-amber-700/10 border-amber-700/20',  size: 'w-5 h-5' },
]

export function Leaderboard({ entries, currentUserId, title = 'Vibe Leaderboard', className }: LeaderboardProps) {
  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="font-display font-bold text-lg text-zinc-100 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        {title}
      </h2>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {/* Re-order: 2nd, 1st, 3rd */}
          {[top3[1], top3[0], top3[2]].map((entry, podiumIdx) => {
            if (!entry) return <div key={podiumIdx} />
            const rankIdx = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2
            const cfg = RANK_CONFIG[rankIdx]
            const Icon = cfg.icon
            const isCurrentUser = entry.id === currentUserId
            const heights = ['h-20', 'h-28', 'h-16']

            return (
              <Link key={entry.id} href={`/profile/${entry.username}`}>
                <div className={cn(
                  'flex flex-col items-center gap-2 px-2 pb-3 pt-3 rounded-2xl border transition-all',
                  cfg.bg,
                  isCurrentUser && 'ring-2 ring-vibe-500/50',
                  heights[podiumIdx],
                  'justify-end',
                )}>
                  <Icon className={cn(cfg.size, cfg.color)} />

                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl overflow-hidden border-2 flex-shrink-0',
                    rankIdx === 0 ? 'border-yellow-500/50' : 'border-zinc-700',
                  )}>
                    {entry.avatar_url ? (
                      <Image
                        src={entry.avatar_url}
                        alt={entry.username}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                        {(entry.display_name ?? entry.username)[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <p className={cn(
                    'text-[10px] font-medium text-center truncate w-full',
                    cfg.color,
                  )}>
                    {entry.display_name ?? entry.username}
                  </p>

                  <div className="vp-badge text-[10px] px-1.5 py-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    {formatVP(entry.vibe_points)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Ranks 4+ */}
      <div className="space-y-2">
        {rest.map((entry) => {
          const isCurrentUser = entry.id === currentUserId

          return (
            <Link key={entry.id} href={`/profile/${entry.username}`}>
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-zinc-700',
                isCurrentUser
                  ? 'bg-vibe-500/8 border-vibe-500/20'
                  : 'bg-zinc-900/50 border-zinc-800',
              )}>
                {/* Rank number */}
                <span className="w-6 text-center text-xs font-mono text-zinc-500 flex-shrink-0">
                  {entry.rank}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                  {entry.avatar_url ? (
                    <Image
                      src={entry.avatar_url}
                      alt={entry.username}
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                      {(entry.display_name ?? entry.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isCurrentUser ? 'text-vibe-300' : 'text-zinc-200',
                  )}>
                    {entry.display_name ?? entry.username}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs text-vibe-500 font-normal">you</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-600">@{entry.username}</p>
                </div>

                {/* VP */}
                <div className="vp-badge flex-shrink-0">
                  <Zap className="w-3 h-3" />
                  {formatVP(entry.vibe_points)}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {entries.length === 0 && (
        <div className="py-10 text-center text-sm text-zinc-600">
          No players yet. Start earning Vibe Points!
        </div>
      )}
    </div>
  )
}
