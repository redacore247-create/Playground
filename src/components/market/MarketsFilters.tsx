// src/components/market/MarketsFilters.tsx
'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'open',     label: '🟢 Live' },
  { id: 'resolved', label: '✓ Resolved' },
  { id: 'all',      label: 'All' },
]

export function MarketsFilters({ active }: { active: string }) {
  const router = useRouter()

  return (
    <div className="sticky top-14 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/40">
      <div className="flex gap-1 px-4 py-2 max-w-lg mx-auto">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => router.push(`/markets?filter=${f.id}`)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              active === f.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
