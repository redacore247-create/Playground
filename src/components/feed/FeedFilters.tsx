// src/components/feed/FeedFilters.tsx
'use client'

import { useState } from 'react'
import { Music, Video, Palette, Flame, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'latest',   label: 'Latest',   icon: Clock },
  { id: 'following',label: 'Following', icon: Users },
  { id: 'music',    label: 'Music',    icon: Music },
  { id: 'video',    label: 'Video',    icon: Video },
  { id: 'art',      label: 'Art',      icon: Palette },
]

export function FeedFilters() {
  const [active, setActive] = useState('trending')

  return (
    <div className="sticky top-14 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/40">
      <div className="flex overflow-x-auto no-scrollbar gap-1 px-4 py-2 max-w-lg mx-auto">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
              'transition-all duration-200 flex-shrink-0',
              active === id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
