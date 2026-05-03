// src/components/layout/TopBar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bell, Zap } from 'lucide-react'
import { cn, formatVP } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface TopBarProps {
  profile?: Profile | null
  title?: string
  showLogo?: boolean
}

export function TopBar({ profile, title, showLogo = false }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60" />

      <div className="relative flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        {/* Left: Logo or Title */}
        {showLogo ? (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-vibe-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg text-zinc-100">
              Playground
            </span>
          </Link>
        ) : (
          <h1 className="font-display font-bold text-lg text-zinc-100">
            {title}
          </h1>
        )}

        {/* Right: VP + Notifications + Avatar */}
        <div className="flex items-center gap-3">
          {profile && (
            <div className="vp-badge">
              <Zap className="w-3 h-3" />
              {formatVP(profile.vibe_points)}
            </div>
          )}

          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <Bell className="w-4 h-4" />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-vibe-400" />
          </button>

          {profile && (
            <Link href={`/profile/${profile.username}`}>
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name ?? profile.username}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                ) : (
                  <div className={cn(
                    'w-full h-full flex items-center justify-center',
                    'text-sm font-bold text-zinc-400',
                  )}>
                    {(profile.display_name ?? profile.username)[0].toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
