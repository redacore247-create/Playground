// src/components/feed/HomeFeed.tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ReleaseCard } from './ReleaseCard'
import { TipModal } from './TipModal'
import { createClient } from '@/lib/supabase/client'
import type { Release, Profile } from '@/types/database'
import { Loader2 } from 'lucide-react'

const PAGE_SIZE = 10

interface HomeFeedProps {
  initialReleases: Release[]
  currentUser: Profile | null
}

export function HomeFeed({ initialReleases, currentUser }: HomeFeedProps) {
  const [releases, setReleases] = useState<Release[]>(initialReleases)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialReleases.length === PAGE_SIZE)
  const [tipTarget, setTipTarget] = useState<Release | null>(null)
  const [userBalance, setUserBalance] = useState(currentUser?.vibe_points ?? 0)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(PAGE_SIZE)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('releases')
      .select(`
        *,
        profiles (id, username, display_name, avatar_url)
      `)
      .eq('status', 'published')
      .order('released_at', { ascending: false })
      .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1)

    if (data) {
      setReleases(prev => [...prev, ...(data as Release[])])
      setHasMore(data.length === PAGE_SIZE)
      offsetRef.current += data.length
    }
    setLoading(false)
  }, [loading, hasMore])

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="space-y-3 px-4">
      {releases.map(release => (
        <ReleaseCard
          key={release.id}
          release={release}
          onTip={currentUser ? (id) => {
            const r = releases.find(r => r.id === id)
            if (r) setTipTarget(r)
          } : undefined}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
        </div>
      )}

      {!hasMore && releases.length > 0 && (
        <div className="text-center py-6 text-sm text-zinc-600">
          You've seen it all ✨
        </div>
      )}

      {releases.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">No releases yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Be the first to create something.</p>
        </div>
      )}

      {/* Tip Modal */}
      {tipTarget && currentUser && (
        <TipModal
          releaseId={tipTarget.id}
          releaseTitle={tipTarget.title}
          userBalance={userBalance}
          onClose={() => setTipTarget(null)}
          onSuccess={(newBalance) => {
            setUserBalance(newBalance)
            setTipTarget(null)
          }}
        />
      )}
    </div>
  )
}
