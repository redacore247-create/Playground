// src/components/feed/ReleaseCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, Zap, TrendingUp, Music, Video, Palette } from 'lucide-react'
import { cn, formatVP, formatRelativeTime, getReleaseTypeLabel, getYouTubeThumbnail } from '@/lib/utils'
import type { Release } from '@/types/database'

interface ReleaseCardProps {
  release: Release
  onTip?: (releaseId: string) => void
  className?: string
}

const TYPE_CONFIG = {
  music: {
    icon: Music,
    label: 'Music',
    gradient: 'from-vibe-900/60 to-vibe-950/80',
    accent: 'text-vibe-400',
    pill: 'bg-vibe-500/10 text-vibe-400 border-vibe-500/20',
  },
  video: {
    icon: Video,
    label: 'Video',
    gradient: 'from-plasma-900/60 to-plasma-950/80',
    accent: 'text-plasma-400',
    pill: 'bg-plasma-500/10 text-plasma-400 border-plasma-500/20',
  },
  digital_art: {
    icon: Palette,
    label: 'Digital Art',
    gradient: 'from-amber-900/60 to-zinc-950/80',
    accent: 'text-amber-400',
    pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
}

export function ReleaseCard({ release, onTip, className }: ReleaseCardProps) {
  const [liked, setLiked] = useState(false)
  const config = TYPE_CONFIG[release.type]
  const Icon = config.icon

  const coverImage =
    release.cover_image_url ??
    (release.link_youtube ? getYouTubeThumbnail(release.link_youtube) : null)

  const artist = release.profiles

  return (
    <article className={cn(
      'card-dark overflow-hidden',
      'hover:border-zinc-700/60 transition-all duration-300',
      'animate-slide-up',
      className,
    )}>
      {/* Cover image */}
      <div className="relative aspect-video bg-zinc-900 overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={release.title}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
          />
        ) : (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-gradient-to-br',
            config.gradient,
          )}>
            <Icon className={cn('w-16 h-16 opacity-30', config.accent)} strokeWidth={1} />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

        {/* Type pill */}
        <div className={cn(
          'absolute top-3 left-3 type-pill border',
          config.pill,
        )}>
          <Icon className="w-3 h-3" />
          {config.label}
        </div>

        {/* Market indicator */}
        {release.tip_total > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-zinc-300">
            <TrendingUp className="w-3 h-3 text-plasma-400" />
            Market
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Artist */}
        {artist && (
          <Link href={`/profile/${artist.username}`} className="flex items-center gap-2 mb-3 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 overflow-hidden border border-zinc-700 flex-shrink-0">
              {artist.avatar_url ? (
                <Image
                  src={artist.avatar_url}
                  alt={artist.display_name ?? artist.username}
                  width={28}
                  height={28}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                  {(artist.display_name ?? artist.username)[0].toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
              {artist.display_name ?? artist.username}
            </span>
            <span className="text-xs text-zinc-600 ml-auto flex-shrink-0">
              {formatRelativeTime(release.released_at ?? release.created_at)}
            </span>
          </Link>
        )}

        {/* Title */}
        <Link href={`/releases/${release.id}`}>
          <h2 className="font-display font-bold text-lg text-zinc-100 leading-tight mb-1 line-clamp-2 hover:text-vibe-300 transition-colors">
            {release.title}
          </h2>
        </Link>

        {/* Description */}
        {release.description && (
          <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
            {release.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/60">
          {/* Like */}
          <button
            onClick={() => setLiked(!liked)}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-all duration-200 active:scale-90',
              liked ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
          </button>

          {/* Tip button */}
          <button
            onClick={() => onTip?.(release.id)}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-vibe-400 transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>Tip</span>
          </button>

          {/* Tip total */}
          {release.tip_total > 0 && (
            <div className="vp-badge ml-auto">
              <Zap className="w-3 h-3" />
              {formatVP(release.tip_total)}
            </div>
          )}

          {/* Bet CTA */}
          <Link
            href={`/markets?release=${release.id}`}
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-plasma-400 hover:text-plasma-300 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Predict
          </Link>
        </div>
      </div>
    </article>
  )
}
